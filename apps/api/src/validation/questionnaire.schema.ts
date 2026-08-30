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
 * Shape we ask the model to produce for ONE AI-generated page. Deliberately
 * narrower than the public `Question` type from packages/types — we assign
 * stable `id`s ourselves rather than trusting the model to produce unique
 * ones, since downstream validation (POST /api/business-plans) relies on
 * question ids being unique and stable. The model is restricted to
 * boolean/text here — "select" is reserved for the fixed page-1 fields,
 * since a select needs a closed option set the model can't reliably know.
 */
export const generatedQuestionSchema = z.object({
  label: z.string().min(1),
  type: z.enum(["boolean", "text"]),
});

/** One AI-generated page: a short title plus 5-6 questions. */
export const generatedPageSchema = z.object({
  title: z.string().min(1),
  questions: z.array(generatedQuestionSchema).min(5).max(6),
});

/**
 * Full model output: exactly 2 AI-generated pages (these become pages 2 and
 * 3 of the questionnaire; page 1 is the fixed catalog and is never sent to
 * the model).
 */
export const generatedQuestionnaireSchema = z.object({
  pages: z.array(generatedPageSchema).length(2),
});

export type GeneratedQuestionnaire = z.infer<typeof generatedQuestionnaireSchema>;

