import { z } from "zod";

/**
 * POST /api/business-plans request body.
 * docs/API.md: "planId required, must reference an existing plan with status
 * awaiting_answers. answers required, must cover every question id from the
 * questionnaire."
 *
 * Coverage against the actual questionnaire (every id answered, correct
 * answer type per question) can't be expressed here — it depends on the
 * stored plan — so it lives in plan-generation.service.ts.
 */
export const businessPlanRequestSchema = z.object({
  planId: z
    .string({ error: "planId is required and must be a string" })
    .uuid("planId must be a valid UUID"),
  answers: z.record(
    z.string(),
    z.union([z.boolean(), z.string()], {
      error: "each answer must be a boolean or a string",
    }),
    { error: "answers is required and must be an object of question id -> answer" },
  ),
});

export type BusinessPlanRequestInput = z.infer<typeof businessPlanRequestSchema>;

/**
 * Shape of the questionnaire stored on BusinessPlan.questionnaire (written
 * by questionnaire.service.ts). Parsed defensively because it round-trips
 * through a Prisma Json column.
 */
export const storedQuestionnaireSchema = z.array(
  z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    type: z.enum(["boolean", "text"]),
  }),
);

export type StoredQuestionnaire = z.infer<typeof storedQuestionnaireSchema>;

/**
 * The generated plan content, validated after the OpenAI call before it is
 * persisted. Mirrors PlanContent in packages/types / docs/API.md.
 */
export const planContentSchema = z.object({
  executiveSummary: z.string().min(1),
  businessDescription: z.string().min(1),
  marketAnalysis: z.string().min(1),
  marketingStrategy: z.string().min(1),
  operationsPlan: z.string().min(1),
  financialPlan: z.string().min(1),
  startupCostEstimate: z.string().min(1),
  operatingCostEstimate: z.string().min(1),
  breakEvenEstimate: z.string().min(1),
  cashFlowProjection: z.string().min(1),
  regulatoryConsiderations: z.string().min(1),
  risks: z.string().min(1),
  recommendations: z.string().min(1),
});
