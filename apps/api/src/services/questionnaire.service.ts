import type { AnswersMap, PostNextPageResponse, PostQuestionnaireResponse, Question, QuestionnairePage } from "types";
import { prisma } from "../config/prisma";
import { createStructuredResponse } from "./openai.client.js";
import { ConflictError, NotFoundError, UpstreamAIError } from "../errors/app-error.js";
import { generatedPageSchema, type GeneratedPage } from "../validation/questionnaire.schema.js";
import {
  answersMapSchema,
  storedQuestionnaireSchema,
  type StoredQuestionnaire,
} from "../validation/business-plan.schema.js";
import { buildFixedPage1 } from "../config/fixed-questionnaire.js";
import {
  extractIndustryCategoryAndRegion,
  formatAnswersForPrompt,
  validateAnswersAgainstQuestionnaire,
} from "./plan-generation.service.js";

const QUESTIONNAIRE_MODEL = process.env["OPENAI_QUESTIONNAIRE_MODEL"] ?? "gpt-4o-2024-08-06";

/** Total pages the questionnaire always ends up with: 1 fixed + 2 AI-generated. */
const TOTAL_QUESTIONNAIRE_PAGES = 3;

/**
 * JSON Schema sent to the Responses API for ONE page at a time. Kept
 * intentionally simple: strict Structured Outputs mode does not reliably
 * support minItems/maxItems, so the 5-6-question shape is enforced
 * afterwards via zod. `options` is nullable (not omitted) for the same
 * reason — strict mode requires every property in `required`, so
 * "not a select question" is expressed as `null`.
 */
const SINGLE_PAGE_JSON_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    title: { type: "string" },
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          type: { type: "string", enum: ["boolean", "text", "select"] },
          options: {
            type: ["array", "null"],
            items: {
              type: "object",
              properties: {
                value: { type: "string" },
                label: { type: "string" },
              },
              required: ["value", "label"],
              additionalProperties: false,
            },
          },
        },
        required: ["label", "type", "options"],
        additionalProperties: false,
      },
    },
  },
  required: ["title", "questions"],
  additionalProperties: false,
};

const PAGE_FOCUS: Record<2 | 3, readonly string[]> = {
  2: [
    "This is page 2 of 3. Focus on the business model and operations:",
    "target customers, funding/startup capital, team/staffing, whether the",
    "business will have a physical premises or be online-only, suppliers,",
    "and pricing.",
  ],
  3: [
    "This is page 3 of 3 — the final page. Focus on goals and risk: growth",
    "ambitions, biggest anticipated challenges, competition, timeline to",
    "launch, and any licenses/permits the founder is already aware they'll",
    "need.",
  ],
};

function buildSinglePagePrompt(
  businessIdea: string,
  pageNumber: 2 | 3,
  answeredSoFarText: string,
): string {
  return [
    "A prospective founder described their business idea below, and has",
    "already answered every question shown in \"Answers so far\". Every new",
    "question you write must be clearly grounded in the specific business",
    "idea and category — and in those prior answers — below. Do not ask",
    "generic template questions that could apply to any business, and do",
    "not repeat anything already asked.",
    "",
    "Generate exactly 5 to 6 tailored follow-up questions for this ONE",
    "page that together gather what's still needed to write a full",
    "business plan for this specific idea.",
    "",
    ...PAGE_FOCUS[pageNumber],
    "",
    "Mix boolean (yes/no), free-text, and select questions as appropriate.",
    "Use a select question (with 2 to 4 short options) instead of forcing a",
    "nuanced choice into yes/no — e.g. \"physical location, online-only, or",
    "both?\" should be a select, not a boolean. Each question needs a short",
    "human-readable label; do not include an id. Give this page a short",
    "descriptive title (e.g. \"Operations & Funding\").",
    "",
    `Business idea: "${businessIdea}"`,
    "",
    "Answers so far:",
    answeredSoFarText,
  ].join("\n");
}

async function generateSinglePage(
  businessIdea: string,
  pageNumber: 2 | 3,
  answeredSoFarText: string,
): Promise<GeneratedPage> {
  const raw = await createStructuredResponse({
    model: QUESTIONNAIRE_MODEL,
    instructions:
      "You design intake questionnaires for a business-plan generation tool targeting Nigerian founders. Respond only with the requested JSON.",
    input: buildSinglePagePrompt(businessIdea, pageNumber, answeredSoFarText),
    format: {
      name: "questionnaire_page",
      schema: SINGLE_PAGE_JSON_SCHEMA,
    },
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new UpstreamAIError("OpenAI response was not valid JSON", error);
  }

  const result = generatedPageSchema.safeParse(parsed);
  if (!result.success) {
    throw new UpstreamAIError(
      `OpenAI response did not match the expected questionnaire-page shape: ${result.error.message}`,
    );
  }

  return result.data;
}

/**
 * Assigns stable, globally-unique ids to a freshly generated page. Ids are
 * prefixed by page number (p2q1, p2q2, ... p3q1, ...) so they can never
 * collide with each other or with the fixed page 1 ids in
 * config/fixed-questionnaire.ts.
 */
function assignIdsToPage(pageNumber: number, generated: GeneratedPage): QuestionnairePage {
  const questions: Question[] = generated.questions.map((q, index) => {
    const id = `p${pageNumber}q${index + 1}`;
    if (q.type === "select" && q.options) {
      return { id, label: q.label, type: q.type, options: q.options };
    }
    return { id, label: q.label, type: q.type };
  });

  return { page: pageNumber, title: generated.title, questions };
}

/**
 * Derives which page number comes next purely from the ids already present
 * in the stored questionnaire — no separate "current page" column needed.
 * Fixed page-1 ids never match `p<N>q<M>`, so a questionnaire holding only
 * page 1 yields 2; once page 2's `p2q*` ids are appended it yields 3.
 */
function nextPageNumberFor(questionnaire: StoredQuestionnaire): number {
  const generatedPageNumbers = questionnaire
    .map((q) => /^p(\d+)q\d+$/.exec(q.id)?.[1])
    .filter((match): match is string => match !== undefined)
    .map(Number);

  const highestGeneratedPage = generatedPageNumbers.length > 0 ? Math.max(...generatedPageNumbers) : 1;
  return highestGeneratedPage + 1;
}

/**
 * Generates just the fixed page 1 and persists a new BusinessPlan row
 * (status "awaiting_answers") with it as the sole stored question so far.
 * Pages 2-3 are generated one at a time by generateNextPage below, once
 * each prior page's answers are known — this keeps every AI-generated
 * question grounded in what the founder has actually said so far, instead
 * of guessing everything upfront before page 1 is even answered.
 */
export async function createQuestionnaire(
  businessIdea: string,
): Promise<PostQuestionnaireResponse> {
  const page1 = buildFixedPage1();

  const plan = await prisma.businessPlan.create({
    data: {
      businessIdea,
      status: "awaiting_answers",
      questionnaire: JSON.parse(JSON.stringify(page1.questions)),
    },
    select: { id: true },
  });

  return { planId: plan.id, page: page1 };
}

/**
 * POST /api/business-plans/:id/next-page.
 *
 * Validates and persists the answers for whichever page is currently
 * pending (derived from stored-questionnaire ids minus already-answered
 * ids), then generates the next page via the Responses API, grounded in
 * the business idea plus every answer given so far. Right after page 1
 * specifically, also extracts and persists industryCategory/region so
 * they're available for page 2's prompt and rag.service.ts's filters as
 * early as possible, rather than only appearing at final submission.
 */
export async function generateNextPage(
  planId: string,
  pageAnswers: AnswersMap,
): Promise<PostNextPageResponse> {
  const plan = await prisma.businessPlan.findUnique({
    where: { id: planId },
    select: { status: true, businessIdea: true, questionnaire: true, answers: true },
  });

  if (!plan) {
    throw new NotFoundError("Plan not found");
  }
  if (plan.status !== "awaiting_answers") {
    throw new ConflictError("Plan has already been processed");
  }

  const questionnaireResult = storedQuestionnaireSchema.safeParse(plan.questionnaire);
  if (!questionnaireResult.success) {
    throw new Error(`Stored questionnaire for plan ${planId} is malformed`);
  }
  const questionnaire = questionnaireResult.data;

  const existingAnswersResult = answersMapSchema.safeParse(plan.answers ?? {});
  if (!existingAnswersResult.success) {
    throw new Error(`Stored answers for plan ${planId} are malformed`);
  }
  const existingAnswers = existingAnswersResult.data;

  const answeredIds = new Set(Object.keys(existingAnswers));
  const pendingQuestions = questionnaire.filter((q) => !answeredIds.has(q.id));
  if (pendingQuestions.length === 0) {
    throw new ConflictError("Questionnaire is already complete");
  }

  validateAnswersAgainstQuestionnaire(pendingQuestions, pageAnswers);

  const nextPageNumber = nextPageNumberFor(questionnaire);
  if (nextPageNumber > TOTAL_QUESTIONNAIRE_PAGES) {
    throw new ConflictError("Questionnaire is already complete");
  }

  const mergedAnswers: AnswersMap = { ...existingAnswers, ...pageAnswers };
  const answeredSoFarText = formatAnswersForPrompt(questionnaire, mergedAnswers);

  const generated = await generateSinglePage(
    plan.businessIdea,
    nextPageNumber as 2 | 3,
    answeredSoFarText,
  );
  const newPage = assignIdsToPage(nextPageNumber, generated);
  const updatedQuestionnaire = [...questionnaire, ...newPage.questions];

  await prisma.businessPlan.update({
    where: { id: planId },
    data: {
      answers: JSON.parse(JSON.stringify(mergedAnswers)),
      questionnaire: JSON.parse(JSON.stringify(updatedQuestionnaire)),
      ...(nextPageNumber === 2 ? extractIndustryCategoryAndRegion(mergedAnswers) : {}),
    },
  });

  return { page: newPage, isLastPage: nextPageNumber === TOTAL_QUESTIONNAIRE_PAGES };
}
