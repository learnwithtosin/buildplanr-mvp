import { useQuery } from "@tanstack/react-query";
import type { GetBusinessPlanResponse } from "types";
import { getBusinessPlan } from "@/lib/api";

/** How often to poll while the plan is still processing (ms). */
const POLL_INTERVAL_MS = 3_000;

export interface UsePlanStatusResult {
  /** The latest response from GET /api/business-plans/:id, or undefined while loading. */
  data: GetBusinessPlanResponse | undefined;
  /** True on the very first fetch before any data has been received. */
  isLoading: boolean;
  /** Any error thrown by getBusinessPlan(). */
  error: Error | null;
  /** True once the plan has reached a terminal state (completed or failed). */
  isDone: boolean;
}

/**
 * Polls GET /api/business-plans/:id via TanStack Query until the plan
 * status is "completed" or "failed".
 *
 * refetchInterval returns false once the plan is done, stopping the poll.
 * The returned `data` object is ready for PlanView to consume once
 * `data.status === "completed"`.
 */
export function usePlanStatus(planId: string): UsePlanStatusResult {
  const { data, isLoading, error } = useQuery<GetBusinessPlanResponse, Error>({
    queryKey: ["plan-status", planId],
    queryFn: () => getBusinessPlan(planId),
    // Poll every POLL_INTERVAL_MS while the plan is still in progress.
    // Returning false stops the interval.
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "completed" || status === "failed") {
        return false;
      }
      return POLL_INTERVAL_MS;
    },
    // Keep showing stale data between refetches rather than flashing a
    // loading spinner on every poll tick.
    staleTime: 0,
    // Enable only when a planId is actually provided.
    enabled: Boolean(planId),
  });

  const isDone = data?.status === "completed" || data?.status === "failed";

  return { data, isLoading, error, isDone };
}
