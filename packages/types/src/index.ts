/**
 * Shared request/response types for the business-plan API.
 * Source of truth: docs/API.md — keep in sync with that document.
 */

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

/** A single questionnaire question returned by POST /api/questionnaire. */
export interface Question {
  id: string;
  label: string;
  type: "boolean" | "text";
}

/**
 * The generated business plan content, returned once a plan's status is
 * "completed" from GET /api/business-plans/:id.
 */
export interface PlanContent {
  executiveSummary: string;
  businessDescription: string;
  marketAnalysis: string;
  marketingStrategy: string;
  operationsPlan: string;
  financialPlan: string;
  startupCostEstimate: string;
  operatingCostEstimate: string;
  breakEvenEstimate: string;
  cashFlowProjection: string;
  regulatoryConsiderations: string;
  risks: string;
  recommendations: string;
}

/** A single questionnaire answer: booleans for boolean questions, strings for text questions. */
export type AnswerValue = boolean | string;

/** Map of question id -> answer value, covering every question id from the questionnaire. */
export type AnswersMap = Record<string, AnswerValue>;

// ---------------------------------------------------------------------------
// POST /api/questionnaire
// ---------------------------------------------------------------------------

export interface PostQuestionnaireRequest {
  businessIdea: string;
}

export interface PostQuestionnaireResponse {
  planId: string;
  questions: Question[];
}

// ---------------------------------------------------------------------------
// POST /api/business-plans
// ---------------------------------------------------------------------------

export interface PostBusinessPlanRequest {
  planId: string;
  answers: AnswersMap;
}

export interface PostBusinessPlanResponse {
  planId: string;
  status: "processing";
}

// ---------------------------------------------------------------------------
// GET /api/business-plans/:id
// ---------------------------------------------------------------------------

export interface GetBusinessPlanParams {
  id: string;
}

/** No request body for this endpoint. */
export type GetBusinessPlanRequest = undefined;

export interface GetBusinessPlanProcessingResponse {
  status: "processing";
}

export interface GetBusinessPlanCompletedResponse {
  status: "completed";
  content: PlanContent;
}

export interface GetBusinessPlanFailedResponse {
  status: "failed";
  error: string;
}

export type GetBusinessPlanResponse =
  | GetBusinessPlanProcessingResponse
  | GetBusinessPlanCompletedResponse
  | GetBusinessPlanFailedResponse;

// ---------------------------------------------------------------------------
// GET /api/business-plans/:id/export/pdf
// ---------------------------------------------------------------------------

export interface GetBusinessPlanExportPdfParams {
  id: string;
}

/** No request body for this endpoint. */
export type GetBusinessPlanExportPdfRequest = undefined;

/** Binary stream response; Content-Type: application/pdf. */
export type GetBusinessPlanExportPdfResponse = ArrayBuffer;

// ---------------------------------------------------------------------------
// GET /api/business-plans/:id/export/docx
// ---------------------------------------------------------------------------

export interface GetBusinessPlanExportDocxParams {
  id: string;
}

/** No request body for this endpoint. */
export type GetBusinessPlanExportDocxRequest = undefined;

/** Binary stream response; Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document. */
export type GetBusinessPlanExportDocxResponse = ArrayBuffer;
