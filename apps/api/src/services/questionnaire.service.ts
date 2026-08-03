import type { PostQuestionnaireResponse, Question } from "types";
import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { createStructuredResponse } from "./openai.client.js";
import { UpstreamAIError } from "../errors/app-error.js";
import {
  generatedQuestionnaireSchema,
  type GeneratedQuestionnaire,
} from "../validation/questionnaire.schema.js";

const QUESTIONNAIRE_MODEL = process.env["OPENAI_QUESTIONNAIRE_MODEL"] ?? "gpt-4o-2024-08-06";

/** JSON Schema sent to the Responses API. Kept intentionally simple: strict
 * Structured Outputs mode does not reliably support minItems/maxItems, so
 * the 4-6 question count is enforced afterwards via zod. */
const QUESTIONS_JSON_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
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
  required: ["questions"],
  additionalProperties: false,
};

function buildPrompt(businessIdea: string): string {
  return [
    "A prospective founder described their business idea below. Generate between",
    "4 and 6 tailored questionnaire questions that will gather the information",
    "needed to write a full business plan for this specific idea (e.g. target",
    "market, funding needs, team, location, regulatory context). Mix boolean",
    "(yes/no) and free-text questions as appropriate. Each question needs a",
    "short human-readable label; do not include an id.",
    "",
    `Business idea: "${businessIdea}"`,
  ].join("\n");
}

async function generateQuestions(businessIdea: string): Promise<GeneratedQuestionnaire> {
  const raw = await createStructuredResponse({
    model: QUESTIONNAIRE_MODEL,
    instructions:
      "You design intake questionnaires for a business-plan generation tool. Respond only with the requested JSON.",
    input: buildPrompt(businessIdea),
    format: {
      name: "questionnaire",
      schema: QUESTIONS_JSON_SCHEMA,
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

function assignIds(generated: GeneratedQuestionnaire): Question[] {
  return generated.questions.map((q, index) => ({
    id: `q${index + 1}`,
    label: q.label,
    type: q.type,
  }));
}

/**
 * Generates a tailored questionnaire for a business idea, persists a new
 * BusinessPlan row (status "awaiting_answers") with the questionnaire
 * attached, and returns the API response shape.
 *
 * Plan generation (POST /api/business-plans onward) is out of scope here.
 */
export async function createQuestionnaire(
  businessIdea: string,
): Promise<PostQuestionnaireResponse> {
  const generated = await generateQuestions(businessIdea);
  const questions = assignIds(generated);

  const plan = await prisma.businessPlan.create({
    data: {
      businessIdea,
      status: "awaiting_answers",
      questionnaire: JSON.parse(JSON.stringify(questions)),
    },
    select: { id: true },
  });

  return {
    planId: plan.id,
    questions,
  };
}
