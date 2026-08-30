import type { PostQuestionnaireResponse, Question, QuestionnairePage } from "types";
import { prisma } from "../config/prisma";
import { createStructuredResponse } from "./openai.client.js";
import { UpstreamAIError } from "../errors/app-error.js";
import {
  generatedQuestionnaireSchema,
  type GeneratedQuestionnaire,
} from "../validation/questionnaire.schema.js";
import { buildFixedPage1 } from "../config/fixed-questionnaire.js";

const QUESTIONNAIRE_MODEL = process.env["OPENAI_QUESTIONNAIRE_MODEL"] ?? "gpt-4o-2024-08-06";

/**
 * JSON Schema sent to the Responses API. Kept intentionally simple: strict
 * Structured Outputs mode does not reliably support minItems/maxItems, so
 * the 2-page / 5-6-question-per-page shape is enforced afterwards via zod.
 */
const PAGES_JSON_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    pages: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          questions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                label: { type: "string" },
                type: { type: "string", enum: ["boolean", "text"] },
              },
              required: ["label", "type"],
              additionalProperties: false,
            },
          },
        },
        required: ["title", "questions"],
        additionalProperties: false,
      },
    },
  },
  required: ["pages"],
  additionalProperties: false,
};

function buildPrompt(businessIdea: string): string {
  return [
    "A prospective founder described their business idea below. You have",
    "already been given their industry category, business name (or that",
    "they need one suggested), and state of operation on a separate page —",
    "do not ask about those again.",
    "",
    "Generate exactly 2 follow-up pages, each with 5 to 6 tailored",
    "questions, that together gather everything else needed to write a full",
    "business plan for this specific idea:",
    "",
    "- Page 2 should focus on the business model and operations: target",
    "  customers, funding/startup capital, team/staffing, premises or",
    "  online-only, suppliers, pricing.",
    "- Page 3 should focus on goals and risk: growth ambitions, biggest",
    "  anticipated challenges, competition, timeline to launch, any",
    "  licenses/permits the founder is already aware they'll need.",
    "",
    "Mix boolean (yes/no) and free-text questions as appropriate. Each",
    "question needs a short human-readable label; do not include an id.",
    "Give each page a short descriptive title (e.g. \"Operations & Funding\").",
    "",
    `Business idea: "${businessIdea}"`,
  ].join("\n");
}

async function generateFollowUpPages(businessIdea: string): Promise<GeneratedQuestionnaire> {
  const raw = await createStructuredResponse({
    model: QUESTIONNAIRE_MODEL,
    instructions:
      "You design intake questionnaires for a business-plan generation tool targeting Nigerian founders. Respond only with the requested JSON.",
    input: buildPrompt(businessIdea),
    format: {
      name: "questionnaire_pages",
      schema: PAGES_JSON_SCHEMA,
    },
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new UpstreamAIError("OpenAI response was not valid JSON", error);
  }

  const result = generatedQuestionnaireSchema.safeParse(parsed);
  if (!result.success) {
    throw new UpstreamAIError(
      `OpenAI response did not match the expected questionnaire shape: ${result.error.message}`,
    );
  }

  return result.data;
}

/**
 * Assigns stable, globally-unique ids to the AI-generated pages (2 and 3).
 * Ids are prefixed by page number (p2q1, p2q2, ... p3q1, ...) so they can
 * never collide with each other or with the fixed page 1 ids in
 * config/fixed-questionnaire.ts.
 */
function assignIdsToFollowUpPages(generated: GeneratedQuestionnaire): QuestionnairePage[] {
  return generated.pages.map((page, pageIndex) => {
    const pageNumber = pageIndex + 2; // page 1 is fixed, so AI pages start at 2
    const questions: Question[] = page.questions.map((q, questionIndex) => ({
      id: `p${pageNumber}q${questionIndex + 1}`,
      label: q.label,
      type: q.type,
    }));

    return {
      page: pageNumber,
      title: page.title,
      questions,
    };
  });
}

/**
 * Flattens all pages' questions into one array for storage on
 * BusinessPlan.questionnaire — the DB/validation layer (business-plan.schema.ts,
 * plan-generation.service.ts) only ever needs a flat id -> question lookup,
 * regardless of how the frontend paginates them.
 */
function flattenPages(pages: QuestionnairePage[]): Question[] {
  return pages.flatMap((page) => page.questions);
}

/**
 * Generates the full 3-page questionnaire for a business idea (page 1
 * fixed, pages 2-3 AI-generated), persists a new BusinessPlan row (status
 * "awaiting_answers") with the flattened questionnaire attached, and
 * returns the paginated API response shape.
 *
 * Plan generation (POST /api/business-plans onward) is out of scope here.
 */
export async function createQuestionnaire(
  businessIdea: string,
): Promise<PostQuestionnaireResponse> {
  const page1 = buildFixedPage1();
  const generated = await generateFollowUpPages(businessIdea);
  const followUpPages = assignIdsToFollowUpPages(generated);

  const pages: QuestionnairePage[] = [page1, ...followUpPages];
  const flatQuestions = flattenPages(pages);

  const plan = await prisma.businessPlan.create({
    data: {
      businessIdea,
      status: "awaiting_answers",
      questionnaire: JSON.parse(JSON.stringify(flatQuestions)),
    },
    select: { id: true },
  });

  return {
    planId: plan.id,
    pages,
  };
}
