import type {
  PostBusinessPlanRequest,
  PostBusinessPlanResponse,
} from "types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

/**
 * Submit questionnaire answers to POST /api/business-plans.
 * Falls back to a mock response when NEXT_PUBLIC_API_URL is not set,
 * so the frontend can be developed without a running backend.
 */
export async function submitBusinessPlan(
  body: PostBusinessPlanRequest
): Promise<PostBusinessPlanResponse> {
  // Mock fallback — remove once the real backend endpoint is live.
  if (!API_BASE) {
    return new Promise((resolve) =>
      setTimeout(
        () => resolve({ planId: body.planId, status: "processing" }),
        600
      )
    );
  }

  const res = await fetch(`${API_BASE}/api/business-plans`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`POST /api/business-plans failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<PostBusinessPlanResponse>;
}
