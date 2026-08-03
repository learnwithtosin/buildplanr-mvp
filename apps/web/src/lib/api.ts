import type { PostQuestionnaireRequest, PostQuestionnaireResponse } from "types";

/**
 * Base URL for the backend API (see docs/API.md). Configured via
 * NEXT_PUBLIC_API_URL so it can differ between local dev, staging, prod.
 */
const API_BASE_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:5000/api";

/**
 * --- TEMPORARY MOCK -----------------------------------------------------
 * The backend's POST /api/questionnaire may not be deployed/ready yet.
 * While NEXT_PUBLIC_USE_MOCK_API=true, requests below are short-circuited
 * with a fake response matching packages/types, so frontend work isn't
 * blocked on the backend.
 *
 * TO REMOVE ONCE THE BACKEND IS READY:
 *   1. Delete the `if (USE_MOCK_API)` block in `postQuestionnaire` below.
 *   2. Delete `mockPostQuestionnaire`.
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
