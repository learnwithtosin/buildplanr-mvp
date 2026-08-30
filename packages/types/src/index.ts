/**
 * Shared request/response types for the business-plan API.
 * Source of truth: docs/API.md — keep in sync with that document.
 */

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

/** A single selectable option for a "select" question. */
export interface QuestionOption {
  value: string;
  label: string;
}

/** A single questionnaire question returned by POST /api/questionnaire. */
export interface Question {
  id: string;
  label: string;
  type: "boolean" | "text" | "select";
  /** Present only when type === "select" — the closed set of choices. */
  options?: QuestionOption[];
}

/**
 * A labeled group of questions shown together as one step of the
 * questionnaire. Page 1 is always the fixed "Business Basics" page
 * (deterministic, not AI-generated); pages 2+ are AI-generated from the
 * founder's idea.
 */
export interface QuestionnairePage {
  page: number;
  title: string;
  questions: Question[];
}

/**
 * Stable ids for the four fixed page-1 questions. Single source of truth
 * for both sides: apps/api/src/config/fixed-questionnaire.ts (which builds
 * the actual page-1 Question objects) and apps/web's QuestionnaireForm
 * (which needs these exact ids to special-case rendering — e.g. showing the
 * "Suggest names" action next to the business_name field). Never hardcode
 * these strings anywhere else; import from here.
 */
export const FIXED_QUESTION_IDS = {
  hasName: "business_has_name",
  name: "business_name",
  industryCategory: "industry_category",
  state: "business_state",
} as const;

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

/** A single questionnaire answer: booleans for boolean questions, strings for text/select questions. */
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
  /** Only the fixed page 1 — pages 2-3 are generated one at a time via POST /api/business-plans/:id/next-page, once the prior page's answers are known. */
  page: QuestionnairePage;
}

// ---------------------------------------------------------------------------
// POST /api/business-plans/:id/next-page
// ---------------------------------------------------------------------------

export interface PostNextPageRequest {
  /** Answers for the page the founder just completed — that page's question ids only. */
  answers: AnswersMap;
}

export interface PostNextPageResponse {
  /** The next AI-generated questionnaire page, grounded in every answer given so far. */
  page: QuestionnairePage;
  /** True once this is the last page — the founder should submit via POST /api/business-plans next, not call this endpoint again. */
  isLastPage: boolean;
}

// ---------------------------------------------------------------------------
// POST /api/business-plans/:id/name-suggestions
// ---------------------------------------------------------------------------

export interface PostNameSuggestionsRequest {
  /** The founder's chosen industry category (page-1 answer), for a more targeted suggestion. */
  industryCategory?: string;
  /** The founder's chosen state (page-1 answer), for a more targeted suggestion. */
  region?: string;
}

export interface PostNameSuggestionsResponse {
  suggestions: string[];
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
