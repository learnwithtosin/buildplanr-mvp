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

/**
 * Mock for GET /api/business-plans/:id.
 * Returns "processing" for the first 4 calls (tracked per planId), then
 * "completed" with a sample plan so the polling flow can be tested end-to-end
 * without a running backend.
 */
const mockPollCounts: Record<string, number> = {};

function mockGetBusinessPlan(planId: string): Promise<GetBusinessPlanResponse> {
  return new Promise((resolve) => {
    setTimeout(() => {
      mockPollCounts[planId] = (mockPollCounts[planId] ?? 0) + 1;

      if (mockPollCounts[planId] < 5) {
        resolve({ status: "processing" });
        return;
      }

      resolve({
        status: "completed",
        content: {
          executiveSummary:
            "A Lagos-based buka restaurant serving authentic Nigerian cuisine to office workers and families in Lekki Phase 1.",
          businessDescription:
            "The business will operate a dine-in and takeaway restaurant focusing on regional Nigerian dishes prepared fresh daily.",
          marketAnalysis:
            "The Lekki Phase 1 area has a large population of middle-income workers with limited quality local food options during lunch hours.",
          marketingStrategy:
            "Social media marketing on Instagram and WhatsApp Business, with loyalty cards and referral discounts for repeat customers.",
          operationsPlan:
            "Operating hours 7am–9pm Monday to Saturday. Staff of 8: 2 cooks, 4 servers, 1 cashier, 1 manager.",
          financialPlan:
            "Revenue target of ₦2.5M/month by month 6 based on 150 covers/day at an average spend of ₦1,800.",
          startupCostEstimate:
            "₦4.2M: kitchen equipment ₦1.8M, rent deposit ₦900k, initial stock ₦600k, fit-out ₦900k.",
          operatingCostEstimate:
            "₦1.1M/month: rent ₦350k, salaries ₦480k, utilities ₦120k, stock replenishment ₦150k.",
          breakEvenEstimate:
            "Estimated break-even at month 4 assuming 70% capacity utilisation.",
          cashFlowProjection:
            "Negative in months 1–3 (−₦600k avg), break-even month 4, positive from month 5 onward.",
          regulatoryConsiderations:
            "CAC business name registration, NAFDAC food handler certification, Lagos State Environmental Health permit, fire safety certificate.",
          risks:
            "Rising food prices, generator fuel costs, staff turnover, and competition from new entrants in the Lekki corridor.",
          recommendations:
            "Negotiate a 2-year lease to lock in rent, invest in a 10KVA generator from day one, and build a WhatsApp broadcast list before opening.",
        },
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
  if (USE_MOCK_API) {
    return mockGetBusinessPlan(planId);
  }

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
