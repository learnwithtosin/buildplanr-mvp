import type {
  AnswersMap,
  GetBusinessPlanResponse,
  PlanContent,
  PostBusinessPlanResponse,
} from "types";
import { prisma } from "../config/prisma";
import { retrieveRelevantKnowledge } from "./rag.service.js";
import { createStructuredResponse } from "./openai.client.js";
import {
  ConflictError,
  NotFoundError,
  UpstreamAIError,
  ValidationError,
} from "../errors/app-error.js";
import {
  planContentSchema,
  storedQuestionnaireSchema,
  type StoredQuestionnaire,
} from "../validation/business-plan.schema.js";
import { FIXED_PAGE_1_QUESTION_IDS } from "../config/fixed-questionnaire.js";
import { isValidIndustryCategory, isValidNigerianState } from "../config/nigeria-taxonomy.js";

const PLAN_MODEL = process.env["OPENAI_PLAN_MODEL"] ?? "gpt-4o-2024-08-06";

/**
 * JSON Schema sent to the Responses API (Structured Outputs). Mirrors
 * PlanContent from packages/types. Kept to plain required string fields —
 * the strict mode subset supports this shape directly; zod re-validates
 * after parsing anyway.
 */
const PLAN_CONTENT_JSON_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    executiveSummary: { type: "string" },
    businessDescription: { type: "string" },
    marketAnalysis: { type: "string" },
    marketingStrategy: { type: "string" },
    operationsPlan: { type: "string" },
    financialPlan: { type: "string" },
    startupCostEstimate: { type: "string" },
    operatingCostEstimate: { type: "string" },
    breakEvenEstimate: { type: "string" },
    cashFlowProjection: { type: "string" },
    regulatoryConsiderations: { type: "string" },
    risks: { type: "string" },
    recommendations: { type: "string" },
  },
  required: [
    "executiveSummary",
    "businessDescription",
    "marketAnalysis",
    "marketingStrategy",
    "operationsPlan",
    "financialPlan",
    "startupCostEstimate",
    "operatingCostEstimate",
    "breakEvenEstimate",
    "cashFlowProjection",
    "regulatoryConsiderations",
    "risks",
    "recommendations",
  ],
  additionalProperties: false,
};

/**
 * Failed generations are stored as `content: { error: string }` with status
 * "failed". BusinessPlan (docs/Database.md) has no dedicated error column,
 * and adding one is a schema change outside this Issue's scope — the Json
 * `content` column doubles as the error carrier for failed plans only.
 * GET /api/business-plans/:id reads it back out via this schema.
 */
interface FailedContent {
  error: string;
}

function isFailedContent(value: unknown): value is FailedContent {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof (value as { error: unknown }).error === "string"
  );
}

// ---------------------------------------------------------------------------
// Answer validation
// ---------------------------------------------------------------------------

/**
 * Ensures `answers` covers every question id from the stored questionnaire
 * with a value of the matching type (boolean question -> boolean, text
 * question -> string), and contains no unknown ids. Throws ValidationError
 * (400) on any mismatch, per docs/API.md.
 */
export function validateAnswersAgainstQuestionnaire(
  questionnaire: StoredQuestionnaire,
  answers: AnswersMap,
): void {
  const questionIds = new Set(questionnaire.map((q) => q.id));

  const missing = questionnaire.filter((q) => !(q.id in answers)).map((q) => q.id);
  if (missing.length > 0) {
    throw new ValidationError(`answers is missing question id(s): ${missing.join(", ")}`);
  }

  const unknown = Object.keys(answers).filter((id) => !questionIds.has(id));
  if (unknown.length > 0) {
    throw new ValidationError(`answers contains unknown question id(s): ${unknown.join(", ")}`);
  }

  for (const question of questionnaire) {
    const value = answers[question.id];
    if (question.type === "boolean" && typeof value !== "boolean") {
      throw new ValidationError(`answer for "${question.id}" must be a boolean`);
    }
    if ((question.type === "text" || question.type === "select") && typeof value !== "string") {
      throw new ValidationError(`answer for "${question.id}" must be a string`);
    }
    if (
      (question.type === "text" || question.type === "select") &&
      typeof value === "string" &&
      value.trim().length === 0
    ) {
      throw new ValidationError(`answer for "${question.id}" must not be empty`);
    }
    if (
      question.type === "select" &&
      question.options !== undefined &&
      !question.options.some((option) => option.value === value)
    ) {
      throw new ValidationError(`answer for "${question.id}" is not one of the allowed options`);
    }
  }
}

/**
 * Pulls the industryCategory/region values out of the fixed page-1 answers
 * (industry_category, business_state), validating each against the shared
 * taxonomy before it's persisted onto BusinessPlan and used as an exact-
 * match filter in rag.service.ts. Returns null for either field the
 * questionnaire didn't include or the answer didn't cover (defensive —
 * the fixed page is always present in practice, but this function shouldn't
 * assume it).
 */
export function extractIndustryCategoryAndRegion(answers: AnswersMap): {
  industryCategory: string | null;
  region: string | null;
} {
  const categoryValue = answers[FIXED_PAGE_1_QUESTION_IDS.industryCategory];
  const stateValue = answers[FIXED_PAGE_1_QUESTION_IDS.state];

  const industryCategory =
    typeof categoryValue === "string" && isValidIndustryCategory(categoryValue)
      ? categoryValue
      : null;
  const region =
    typeof stateValue === "string" && isValidNigerianState(stateValue) ? stateValue : null;

  return { industryCategory, region };
}

// ---------------------------------------------------------------------------
// Prompt assembly
// ---------------------------------------------------------------------------

export function formatAnswersForPrompt(
  questionnaire: StoredQuestionnaire,
  answers: AnswersMap,
): string {
  return questionnaire
    .map((question) => {
      const value = answers[question.id];
      const rendered = typeof value === "boolean" ? (value ? "Yes" : "No") : String(value);
      return `Q: ${question.label}\nA: ${rendered}`;
    })
    .join("\n\n");
}

function buildGenerationPrompt(
  businessIdea: string,
  questionnaire: StoredQuestionnaire,
  answers: AnswersMap,
  contextChunks: string[],
): string {
  const contextBlock =
    contextChunks.length > 0
      ? contextChunks.map((chunk, index) => `[${index + 1}] ${chunk}`).join("\n\n")
      : "(no reference material retrieved)";

  return [
    "Write a complete business plan for the Nigerian market based on the",
    "founder's idea and questionnaire answers below. Use the reference",
    "material as your factual grounding.",
    "",
    "## Business idea",
    businessIdea,
    "",
    "## Questionnaire answers",
    formatAnswersForPrompt(questionnaire, answers),
    "",
    "## Reference material (retrieved Nigerian regulatory and market data)",
    contextBlock,
  ].join("\n");
}

const GENERATION_INSTRUCTIONS = [
  "You write practical, structured business plans for founders in Nigeria.",
  "Respond only with the requested JSON; every field is plain text (no markdown headings).",
  "Ground all financial figures — startup costs, operating costs, break-even,",
  "cash flow, taxes, registration fees — in the provided reference material.",
  "Where the reference material states a figure, rate, or threshold, use it.",
  "Where it does not cover a figure you need, give a conservative range and",
  "explicitly label it as an assumption rather than inventing a precise number.",
  "Use Naira (₦) for all monetary amounts. Cover Nigerian regulatory steps",
  "(e.g. CAC, NAFDAC, FIRS) whenever the reference material shows they apply",
  "to this kind of business.",
].join(" ");

// ---------------------------------------------------------------------------
// Generation pipeline (runs after the 202 response)
// ---------------------------------------------------------------------------

async function generatePlanContent(
  businessIdea: string,
  questionnaire: StoredQuestionnaire,
  answers: AnswersMap,
  industryCategory: string | null,
  region: string | null,
): Promise<PlanContent> {
  const retrievalText = `${businessIdea}\n\n${formatAnswersForPrompt(questionnaire, answers)}`;
  const contextChunks = await retrieveRelevantKnowledge(retrievalText, {
    ...(industryCategory !== null ? { category: industryCategory } : {}),
    ...(region !== null ? { region } : {}),
  });

  const raw = await createStructuredResponse({
    model: PLAN_MODEL,
    instructions: GENERATION_INSTRUCTIONS,
    input: buildGenerationPrompt(businessIdea, questionnaire, answers, contextChunks),
    format: {
      name: "business_plan",
      schema: PLAN_CONTENT_JSON_SCHEMA,
    },
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new UpstreamAIError("OpenAI response was not valid JSON", error);
  }

  const result = planContentSchema.safeParse(parsed);
  if (!result.success) {
    throw new UpstreamAIError(
      `OpenAI returned an invalid structured response.`,
    );
  }

  return result.data;
}

/**
 * Runs the full generation pipeline for a plan already in "processing" and
 * persists the outcome: content + "completed" on success, or
 * { error } + "failed" on any failure. Never throws — this runs detached
 * from the request/response cycle, so failures are recorded on the row
 * (where GET picks them up) instead of propagating.
 */
async function runGeneration(
  planId: string,
  businessIdea: string,
  questionnaire: StoredQuestionnaire,
  answers: AnswersMap,
  industryCategory: string | null,
  region: string | null,
): Promise<void> {
  try {
    const content = await generatePlanContent(
      businessIdea,
      questionnaire,
      answers,
      industryCategory,
      region,
    );

    await prisma.businessPlan.update({
      where: { id: planId },
      data: {
        status: "completed",
        content: JSON.parse(JSON.stringify(content)),
        modelUsed: PLAN_MODEL,
        generatedAt: new Date(),
      },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Plan generation failed for ${planId}:`, error);

    const message =
      error instanceof UpstreamAIError
        ? error.message
        : "Plan generation failed unexpectedly";

    try {
      await prisma.businessPlan.update({
        where: { id: planId },
        data: {
          status: "failed",
          content: { error: message },
        },
      });
    } catch (persistError) {
      // eslint-disable-next-line no-console
      console.error(`Failed to record generation failure for ${planId}:`, persistError);
    }
  }
}

// ---------------------------------------------------------------------------
// Public service API
// ---------------------------------------------------------------------------

/**
 * POST /api/business-plans.
 *
 * Validates the plan exists and is awaiting answers, validates the answers
 * against the stored questionnaire, persists the answers and flips the plan
 * to "processing" (atomically, so a concurrent double-submit gets a 409),
 * then kicks off generation in the background and returns immediately —
 * the endpoint responds 202 while the OpenAI call is still in flight, and
 * the client polls GET /api/business-plans/:id for the outcome.
 */
export async function submitAnswersAndStartGeneration(
  planId: string,
  answers: AnswersMap,
): Promise<PostBusinessPlanResponse> {
  const plan = await prisma.businessPlan.findUnique({
    where: { id: planId },
    select: {
      status: true,
      businessIdea: true,
      questionnaire: true,
    },
  });

  if (!plan) {
    throw new NotFoundError("Plan not found");
  }

  if (plan.status !== "awaiting_answers") {
    throw new ConflictError("Plan has already been processed");
  }

  const questionnaireResult = storedQuestionnaireSchema.safeParse(plan.questionnaire);
  if (!questionnaireResult.success) {
    // Data corruption, not a client mistake — surface as an unexpected 500.
    throw new Error(`Stored questionnaire for plan ${planId} is malformed`);
  }
  const questionnaire = questionnaireResult.data;

  validateAnswersAgainstQuestionnaire(questionnaire, answers);

  const { industryCategory, region } = extractIndustryCategoryAndRegion(answers);

  // Atomic status transition: the `status` condition in the WHERE clause
  // means only one of two racing submissions can win.
  const updated = await prisma.businessPlan.updateMany({
    where: { id: planId, status: "awaiting_answers" },
    data: {
      answers: JSON.parse(JSON.stringify(answers)),
      status: "processing",
      // Previously these columns were never written — rag.service.ts's
      // category/region filters were always dead code. Page 1 of the
      // questionnaire is now the sole source of truth for both.
      industryCategory,
      region,
    },
  });

  if (updated.count === 0) {
    throw new ConflictError("Plan has already been processed");
  }

  // Fire-and-forget: runGeneration handles (and records) its own failures.
  void runGeneration(
    planId,
    plan.businessIdea,
    questionnaire,
    answers,
    industryCategory,
    region,
  );

  return { planId, status: "processing" };
}

/**
 * GET /api/business-plans/:id.
 *
 * Single polling endpoint per docs/API.md: { status } while not finished,
 * { status, content } once completed, { status, error } on failure.
 * A plan still in "awaiting_answers" also reports "processing" — the API
 * contract has no separate value for it and the distinction is meaningless
 * to a polling client.
 */
export async function getBusinessPlanStatus(planId: string): Promise<GetBusinessPlanResponse> {
  const plan = await prisma.businessPlan.findUnique({
    where: { id: planId },
    select: { status: true, content: true },
  });

  if (!plan) {
    throw new NotFoundError("Plan not found");
  }

  if (plan.status === "completed") {
    const contentResult = planContentSchema.safeParse(plan.content);
    if (!contentResult.success) {
      throw new Error(`Stored content for plan ${planId} is malformed`);
    }
    return { status: "completed", content: contentResult.data };
  }

  if (plan.status === "failed") {
    const error = isFailedContent(plan.content)
      ? plan.content.error
      : "Plan generation failed";
    return { status: "failed", error };
  }

  return { status: "processing" };
}
