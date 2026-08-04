import type {
  PostQuestionnaireRequest,
  PostQuestionnaireResponse,
  PostBusinessPlanRequest,
  PostBusinessPlanResponse,
  GetBusinessPlanResponse,
} from "types";

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
        questions: [
          { id: "q1", label: "Do you already have a registered business name?", type: "boolean" },
          { id: "q2", label: "What city or state will you primarily operate in?", type: "text" },
          { id: "q3", label: "What is your estimated starting budget in Naira?", type: "text" },
          { id: "q4", label: "Will you sell online, in person, or both?", type: "text" },
        ],
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

/** --- end mock --------------------------------------------------------- */

/** Thrown when the backend responds with a non-2xx status. */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * POST /api/questionnaire — turn a free-text business idea into a
 * tailored questionnaire. See docs/API.md.
 */
export async function postQuestionnaire(
  body: PostQuestionnaireRequest,
): Promise<PostQuestionnaireResponse> {
  if (USE_MOCK_API) {
    return mockPostQuestionnaire();
  }

  const res = await fetch(`${API_BASE_URL}/questionnaire`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const message = await res
      .json()
      .then((data: { error?: string }) => data.error)
      .catch(() => undefined);
    throw new ApiError(message ?? "Failed to generate questionnaire.", res.status);
  }

  return (await res.json()) as PostQuestionnaireResponse;
}

/**
 * POST /api/business-plans — submit questionnaire answers and start
 * plan generation. See docs/API.md.
 */
export async function submitBusinessPlan(
  body: PostBusinessPlanRequest,
): Promise<PostBusinessPlanResponse> {
  if (USE_MOCK_API) {
    return mockSubmitBusinessPlan(body.planId);
  }

  const res = await fetch(`${API_BASE_URL}/business-plans`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const message = await res
      .json()
      .then((data: { error?: string }) => data.error)
      .catch(() => undefined);
    throw new ApiError(message ?? "Failed to submit business plan.", res.status);
  }

  return (await res.json()) as PostBusinessPlanResponse;
}

/**
 * GET /api/business-plans/:id — poll plan status; returns processing,
 * completed (with content), or failed. See docs/API.md.
 */
export async function getBusinessPlan(planId: string): Promise<GetBusinessPlanResponse> {
  const res = await fetch(`${API_BASE_URL}/business-plans/${encodeURIComponent(planId)}`);

  if (!res.ok) {
    const message = await res
      .json()
      .then((data: { error?: string }) => data.error)
      .catch(() => undefined);
    throw new ApiError(message ?? "Failed to fetch plan status.", res.status);
  }

  return (await res.json()) as GetBusinessPlanResponse;
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
    throw new ApiError(
      "Unable to reach the server. Please check your internet connection and try again.",
      0
    );
  }
}
