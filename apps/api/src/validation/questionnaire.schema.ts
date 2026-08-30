import { z } from "zod";
import { answersMapSchema } from "./business-plan.schema.js";

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

/** One option for an AI-generated "select" question — same shape as packages/types' QuestionOption. */
export const generatedQuestionOptionSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
});

/**
 * Shape we ask the model to produce for a single question. Deliberately
 * narrower than the public `Question` type from packages/types — we assign
 * stable `id`s ourselves rather than trusting the model to produce unique
 * ones, since downstream validation (POST /api/business-plans) relies on
 * question ids being unique and stable.
 *
 * `options` is nullable rather than optional: OpenAI's strict Structured
 * Outputs mode requires every property to appear in `required`, so "not
 * applicable to this question" has to be expressed as `null`, not omission.
 * It's only meaningful — and required to be non-null with 2-4 entries —
 * when type === "select".
 */
export const generatedQuestionSchema = z
  .object({
    label: z.string().min(1),
    type: z.enum(["boolean", "text", "select"]),
    options: z.array(generatedQuestionOptionSchema).nullable(),
  })
  .refine(
    (q) => q.type !== "select" || (q.options !== null && q.options.length >= 2 && q.options.length <= 4),
    { message: "select questions must include 2 to 4 options" },
  );

/** One AI-generated questionnaire page: a short title plus 5-6 tailored questions. */
export const generatedPageSchema = z.object({
  title: z.string().min(1),
  questions: z.array(generatedQuestionSchema).min(5).max(6),
});

export type GeneratedPage = z.infer<typeof generatedPageSchema>;

/**
 * POST /api/business-plans/:id/next-page request body: the answers for
 * whichever page the founder just completed (that page's question ids
 * only). Coverage against the specific pending page can't be expressed
 * here — it depends on the stored plan's current progress — so it lives in
 * questionnaire.service.ts.
 */
export const nextPageRequestSchema = z.object({
  answers: answersMapSchema,
});

export type NextPageRequestInput = z.infer<typeof nextPageRequestSchema>;
