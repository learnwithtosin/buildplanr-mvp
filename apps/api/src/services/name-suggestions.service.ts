import type { PostNameSuggestionsResponse } from "types";
import { prisma } from "../config/prisma";
import { createStructuredResponse } from "./openai.client.js";
import { NotFoundError, UpstreamAIError } from "../errors/app-error.js";
import { generatedNameSuggestionsSchema } from "../validation/name-suggestions.schema.js";
import { INDUSTRY_CATEGORIES, NIGERIAN_STATES } from "../config/nigeria-taxonomy.js";

const NAME_SUGGESTIONS_MODEL = process.env["OPENAI_NAME_SUGGESTIONS_MODEL"] ?? "gpt-4o-2024-08-06";

const SUGGESTIONS_JSON_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    suggestions: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: ["suggestions"],
  additionalProperties: false,
};

function labelFor(options: readonly { value: string; label: string }[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

function buildPrompt(businessIdea: string, industryCategory?: string, region?: string): string {
  const categoryLine =
    industryCategory !== undefined
      ? `Industry category: ${labelFor(INDUSTRY_CATEGORIES, industryCategory)}`
      : undefined;
  const regionLine =
    region !== undefined ? `Location: ${labelFor(NIGERIAN_STATES, region)}, Nigeria` : undefined;

  return [
    "Suggest exactly 3 short, memorable business names for the Nigerian",
    "founder's idea below. Every name must be clearly grounded in what",
    "this specific business actually does — draw on concrete details from",
    "the idea (and category, if given) rather than generic \"startup-y\"",
    "words untethered from the business. Names should sound natural in the",
    "Nigerian market, be easy to say and spell, and avoid names that are",
    "obviously already major existing brands. Return names only, no",
    "taglines or explanations.",
    "",
    `Business idea: "${businessIdea}"`,
    ...(categoryLine !== undefined ? [categoryLine] : []),
    ...(regionLine !== undefined ? [regionLine] : []),
  ].join("\n");
}

/**
 * POST /api/business-plans/:id/name-suggestions.
 *
 * Looks up the plan's stored businessIdea by id (the plan must already
 * exist — created by POST /api/questionnaire — but does not need to have
 * been submitted/completed yet, since this runs mid-page-1). industryCategory
 * and region are optional because the frontend may call this before the
 * founder has answered those fields on the same page.
 */
export async function suggestBusinessNames(
  planId: string,
  industryCategory?: string,
  region?: string,
): Promise<PostNameSuggestionsResponse> {
  const plan = await prisma.businessPlan.findUnique({
    where: { id: planId },
    select: { businessIdea: true },
  });

  if (!plan) {
    throw new NotFoundError("Plan not found");
  }

  const raw = await createStructuredResponse({
    model: NAME_SUGGESTIONS_MODEL,
    instructions:
      "You brainstorm business names for a business-plan generation tool targeting Nigerian founders. Respond only with the requested JSON.",
    input: buildPrompt(plan.businessIdea, industryCategory, region),
    format: {
      name: "name_suggestions",
      schema: SUGGESTIONS_JSON_SCHEMA,
    },
    temperature: 1,
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new UpstreamAIError("OpenAI response was not valid JSON", error);
  }

  const result = generatedNameSuggestionsSchema.safeParse(parsed);
  if (!result.success) {
    throw new UpstreamAIError(
      `OpenAI response did not match the expected name-suggestions shape: ${result.error.message}`,
    );
  }

  return result.data;
}
