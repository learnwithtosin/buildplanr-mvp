import { z } from "zod";

/**
 * POST /api/questionnaire request body.
 * docs/API.md: "businessIdea required, 10-500 characters."
 */
export const questionnaireRequestSchema = z.object({
  businessIdea: z
    .string({ error: "businessIdea is required and must be a string" })
    .min(10, "businessIdea must be at least 10 characters")
    .max(500, "businessIdea must be at most 500 characters"),
});

export type QuestionnaireRequestInput = z.infer<typeof questionnaireRequestSchema>;

/**
 * Shape we ask the model to produce. Deliberately narrower than the public
 * `Question` type from packages/types — we generate stable `id`s ourselves
 * rather than trusting the model to produce unique ones, since downstream
 * validation (POST /api/business-plans) relies on question ids being unique
 * and stable.
 */
export const generatedQuestionSchema = z.object({
  label: z.string().min(1),
  type: z.enum(["boolean", "text"]),
});

export const generatedQuestionnaireSchema = z.object({
  questions: z.array(generatedQuestionSchema).min(4).max(6),
});

export type GeneratedQuestionnaire = z.infer<typeof generatedQuestionnaireSchema>;
