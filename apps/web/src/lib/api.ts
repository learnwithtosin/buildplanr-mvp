import type {
  PostQuestionnaireRequest,
  PostQuestionnaireResponse,
  PostNextPageRequest,
  PostNextPageResponse,
  PostBusinessPlanRequest,
  PostBusinessPlanResponse,
  GetBusinessPlanResponse,
  PostNameSuggestionsRequest,
  PostNameSuggestionsResponse,
} from "types";
import { FIXED_QUESTION_IDS } from "types";

/**
 * Base URL for the backend API (see docs/API.md). Configured via
 * NEXT_PUBLIC_API_URL so it can differ between local dev, staging, prod.
 */
const API_BASE_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:5000/api";

/**
 * --- TEMPORARY MOCK -----------------------------------------------------
 * While NEXT_PUBLIC_USE_MOCK_API=true, requests below are short-circuited
 * with a fake response matching packages/types, so frontend work isn't
 * blocked on the backend.
 *
 * TO REMOVE ONCE THE BACKEND IS READY:
 *   1. Delete every `if (USE_MOCK_API)` block below.
 *   2. Delete all `mock*` functions.
 *   3. Delete NEXT_PUBLIC_USE_MOCK_API from .env.example / .env.local.
 * -------------------------------------------------------------------------
 */
const USE_MOCK_API = process.env["NEXT_PUBLIC_USE_MOCK_API"] === "true";

const MOCK_LATENCY_MS = 600;

function mockPostQuestionnaire(): Promise<PostQuestionnaireResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        planId: "00000000-0000-4000-8000-000000000000",
        page: {
          page: 1,
          title: "Business Basics",
          questions: [
            {
              id: FIXED_QUESTION_IDS.industryCategory,
              label: "Which category best fits your business?",
              type: "select",
              options: [
                { value: "food", label: "Food & Beverage" },
                { value: "retail", label: "Retail & Trading" },
                { value: "beauty", label: "Beauty, Salon & Personal Care" },
              ],
            },
            {
              id: FIXED_QUESTION_IDS.state,
              label: "Which Nigerian state will you primarily operate in?",
              type: "select",
              options: [
                { value: "plateau", label: "Plateau" },
                { value: "lagos", label: "Lagos" },
                { value: "fct", label: "FCT (Abuja)" },
              ],
            },
            { id: FIXED_QUESTION_IDS.hasName, label: "Does your business already have a name?", type: "boolean" },
            { id: FIXED_QUESTION_IDS.name, label: "What's your business name?", type: "text" },
          ],
        },
      });
    }, MOCK_LATENCY_MS);
  });
}

/** Tracks which mock page to return next — reset once a questionnaire's mock run completes. */
let mockNextPageCallCount = 0;

function mockFetchNextQuestionnairePage(): Promise<PostNextPageResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      mockNextPageCallCount += 1;

      if (mockNextPageCallCount === 1) {
        resolve({
          page: {
            page: 2,
            title: "Operations & Funding",
            questions: [
              { id: "p2q1", label: "What is your estimated starting budget in Naira?", type: "text" },
              {
                id: "p2q2",
                label: "Will you sell online, in person, or both?",
                type: "select",
                options: [
                  { value: "online", label: "Online-only" },
                  { value: "in_person", label: "In person" },
                  { value: "both", label: "Both" },
                ],
              },
              { id: "p2q3", label: "Do you already have a physical location?", type: "boolean" },
              { id: "p2q4", label: "Will you hire staff in the first 6 months?", type: "boolean" },
              { id: "p2q5", label: "Who are your main suppliers, if known?", type: "text" },
            ],
          },
          isLastPage: false,
        });
        return;
      }

      mockNextPageCallCount = 0;
      resolve({
        page: {
          page: 3,
          title: "Goals & Risk",
          questions: [
            { id: "p3q1", label: "What is your growth goal for year one?", type: "text" },
            { id: "p3q2", label: "Who do you see as your biggest competitor?", type: "text" },
            { id: "p3q3", label: "What's your target launch timeline?", type: "text" },
            { id: "p3q4", label: "Are you aware of any licenses you'll need?", type: "boolean" },
            { id: "p3q5", label: "What's your biggest concern about starting this business?", type: "text" },
          ],
        },
        isLastPage: true,
      });
    }, MOCK_LATENCY_MS);
  });
}

function mockSubmitBusinessPlan(
  planId: string
): Promise<PostBusinessPlanResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ planId, status: "processing" });
    }, MOCK_LATENCY_MS);
  });
}

function mockSuggestBusinessNames(): Promise<PostNameSuggestionsResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ suggestions: ["Zenith Cuts", "Northline Barbers", "Fresh Fade Studio"] });
    }, MOCK_LATENCY_MS);
  });
}

/** --- end mock --------------------------------------------------------- */

/** Thrown when the backend responds with a non-2xx status, or the request never reached it. */
export class ApiError extends Error {
  /** HTTP status code, or 0 when the request never reached the server (network/offline). */
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Shared error copy — used across every request helper below so the same
 * kind of failure reads the same way no matter which page/action triggered
 * it. Each page surfaces these inline (near the relevant form/action), not
 * via a global error boundary.
 */
const NETWORK_ERROR_MESSAGE =
  "Unable to reach the server. Please check your internet connection and try again.";

/** Fallback messages by HTTP status, used only when the server didn't send its own `error` string. */
const DEFAULT_STATUS_MESSAGES: Record<number, string> = {
  400: "That request wasn't valid. Please check your input and try again.",
  404: "We couldn't find that. It may have been deleted, or the link is incorrect.",
  409: "That can't be done right now — please refresh and try again.",
  429: "You're sending requests a little too fast. Please wait a moment and try again.",
  500: "Something went wrong on our end. Please try again in a moment.",
};

function defaultMessageForStatus(status: number, fallback: string): string {
  return DEFAULT_STATUS_MESSAGES[status] ?? fallback;
}

/**
 * Shared fetch + JSON helper for every JSON-returning endpoint below.
 * Normalizes every failure mode into an `ApiError`:
 *   - the request never reaching the server (offline, DNS, CORS, etc.) →
 *     status 0, NETWORK_ERROR_MESSAGE
 *   - a non-2xx response → the server's `{ error: string }` message if
 *     present, else a sensible default for that status code (rate limiting,
 *     validation, not found, etc.)
 */
async function requestJson<T>(
  url: string,
  init: RequestInit | undefined,
  fallbackMessage: string,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    throw new ApiError(NETWORK_ERROR_MESSAGE, 0);
  }

  if (!res.ok) {
    const serverMessage = isJsonResponse(res)
      ? await res
          .json()
          .then((data: { error?: string }) => data.error)
          .catch(() => undefined)
      : undefined;
    throw new ApiError(serverMessage ?? defaultMessageForStatus(res.status, fallbackMessage), res.status);
  }

  return (await res.json()) as T;
}

/** True when the response body is actually JSON (e.g. not an HTML error page from a proxy/gateway). */
function isJsonResponse(res: Response): boolean {
  const contentType = res.headers.get("content-type");
  return contentType !== null && contentType.includes("application/json");
}

/**
 * POST /api/questionnaire — turn a free-text business idea into a
 * tailored questionnaire. See docs/API.md.
 *
 * Possible failures surfaced to the caller (all as ApiError):
 *   400 — businessIdea missing or outside the 10–500 character range
 *   429 — rate limited
 *   500 — upstream AI failure
 *   0   — network/fetch failure (request never reached the server)
 */
export async function postQuestionnaire(
  body: PostQuestionnaireRequest,
): Promise<PostQuestionnaireResponse> {
  if (USE_MOCK_API) {
    return mockPostQuestionnaire();
  }

  return requestJson<PostQuestionnaireResponse>(
    `${API_BASE_URL}/questionnaire`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    "Failed to generate questionnaire.",
  );
}

/**
 * POST /api/business-plans/:id/next-page — submit the answers for the page
 * the founder just completed and get back the next AI-generated page,
 * grounded in the business idea plus every answer given so far. Called
 * between pages instead of generating the whole questionnaire upfront.
 *
 * Possible failures surfaced to the caller (all as ApiError):
 *   400 — missing/invalid answers for the currently-pending page
 *   404 — plan not found
 *   409 — plan already fully answered or already processed
 *   429 — rate limited
 *   500 — upstream AI failure
 *   0   — network/fetch failure (request never reached the server)
 */
export async function fetchNextQuestionnairePage(
  planId: string,
  body: PostNextPageRequest,
): Promise<PostNextPageResponse> {
  if (USE_MOCK_API) {
    return mockFetchNextQuestionnairePage();
  }

  return requestJson<PostNextPageResponse>(
    `${API_BASE_URL}/business-plans/${encodeURIComponent(planId)}/next-page`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    "Failed to generate the next page.",
  );
}

/**
 * POST /api/business-plans — submit questionnaire answers and start
 * plan generation. See docs/API.md.
 *
 * Possible failures surfaced to the caller (all as ApiError):
 *   400 — missing/invalid answers
 *   404 — plan not found
 *   409 — already processed
 *   429 — rate limited
 *   0   — network/fetch failure (request never reached the server)
 */
export async function submitBusinessPlan(
  body: PostBusinessPlanRequest,
): Promise<PostBusinessPlanResponse> {
  if (USE_MOCK_API) {
    return mockSubmitBusinessPlan(body.planId);
  }

  return requestJson<PostBusinessPlanResponse>(
    `${API_BASE_URL}/business-plans`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    "Failed to submit business plan.",
  );
}

/**
 * POST /api/business-plans/:id/name-suggestions — generate 3 candidate
 * business names from the plan's stored idea plus whatever industryCategory/
 * region have been picked so far. Called mid-page-1, before the rest of the
 * questionnaire is submitted. See docs/API.md.
 *
 * Possible failures surfaced to the caller (all as ApiError):
 *   404 — plan not found
 *   429 — rate limited
 *   500 — upstream AI failure
 *   0   — network/fetch failure (request never reached the server)
 */
export async function suggestBusinessNames(
  planId: string,
  body: PostNameSuggestionsRequest,
): Promise<PostNameSuggestionsResponse> {
  if (USE_MOCK_API) {
    return mockSuggestBusinessNames();
  }

  return requestJson<PostNameSuggestionsResponse>(
    `${API_BASE_URL}/business-plans/${encodeURIComponent(planId)}/name-suggestions`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    "Failed to generate name suggestions.",
  );
}

/**
 * GET /api/business-plans/:id — poll plan status; returns processing,
 * completed (with content), or failed. See docs/API.md.
 *
 * Note: a "failed" status is a *successful* 200 response with
 * `{ status: "failed", error: string }` in the body — that's a distinct
 * error state the caller checks on the returned data, not an ApiError.
 * ApiError here only covers network failure or an unexpected non-2xx.
 */
export async function getBusinessPlan(planId: string): Promise<GetBusinessPlanResponse> {
  return requestJson<GetBusinessPlanResponse>(
    `${API_BASE_URL}/business-plans/${encodeURIComponent(planId)}`,
    undefined,
    "Failed to fetch plan status.",
  );
}

/**
 * GET /api/business-plans/:id/export/pdf — render and stream the plan as PDF.
 * Returns the raw Blob so the caller can trigger a browser download.
 *
 * Throws ApiError with the appropriate status on:
 *   404 — unknown plan id
 *   409 — plan not yet completed
 *   500 — server-side rendering failure
 *
 * See docs/API.md.
 */
export async function downloadPlanPdf(planId: string): Promise<Blob> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/business-plans/${encodeURIComponent(planId)}/export/pdf`
    );

    if (!res.ok) {
      const errorMessages: Record<number, string> = {
        404: "Plan not found. It may have been deleted.",
        409: "Your plan is still being generated. Please wait until it is complete before downloading.",
        500: "The PDF could not be rendered. Please try again.",
      };
      const message =
        errorMessages[res.status] ??
        `Could not download PDF (${res.status}). Please try again.`;
      throw new ApiError(message, res.status);
    }

    return res.blob();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(NETWORK_ERROR_MESSAGE, 0);
  }
}

/**
 * GET /api/business-plans/:id/export/docx — render and stream the plan as
 * an editable Word document. Returns the raw Blob so the caller can trigger
 * a browser download.
 *
 * Throws ApiError with the appropriate status on:
 *   404 — unknown plan id
 *   409 — plan not yet completed
 *   500 — server-side rendering failure
 *
 * See docs/API.md.
 */
export async function downloadPlanDocx(planId: string): Promise<Blob> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/business-plans/${encodeURIComponent(planId)}/export/docx`
    );

    if (!res.ok) {
      const errorMessages: Record<number, string> = {
        404: "Plan not found. It may have been deleted.",
        409: "Your plan is still being generated. Please wait until it is complete before downloading.",
        500: "The Word document could not be generated. Please try again.",
      };
      const message =
        errorMessages[res.status] ??
        `Could not download Word document (${res.status}). Please try again.`;
      throw new ApiError(message, res.status);
    }

    return res.blob();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      "Unable to reach the server. Please check your internet connection and try again.",
      0
    );
  }
}