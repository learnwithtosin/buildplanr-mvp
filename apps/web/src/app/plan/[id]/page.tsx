"use client";

/**
 * /plan/[id]
 *
 * Polls GET /api/business-plans/:id via usePlanStatus until the plan
 * is completed or failed, showing LoadingState in the meantime.
 *
 * Once completed, the raw data is available for PlanView to consume
 * (rendered in a separate issue). This page intentionally does NOT
 * render plan content itself.
 */

import { useParams } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import LoadingState from "@/components/LoadingState";
import DownloadPdfButton from "@/components/DownloadPdfButton";
import InlineError from "@/components/InlineError";
import { usePlanStatus } from "@/lib/usePlanStatus";

export default function PlanPage() {
  const params = useParams();
  const planId = Array.isArray(params.id) ? params.id[0] : (params.id ?? "");

  const { data, isLoading, error, isDone } = usePlanStatus(planId);

  const isProcessing = isLoading || data?.status === "processing";

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <AppHeader />

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-6 py-12">
        {/* ── Loading / processing ────────────────────────── */}
        {isProcessing && <LoadingState planId={planId} />}

        {/* ── Error (network/fetch failure while polling) ───── */}
        {error && (
          <div className="flex flex-col items-center gap-4 text-center">
            <InlineError message={error.message} />
            <a
              href="/"
              className="text-sm font-medium text-green-700 underline underline-offset-2 hover:text-green-800 dark:text-green-400"
            >
              ← Start over
            </a>
          </div>
        )}

        {/* ── Generation failed (status: "failed" from the API) ───────────── */}
        {isDone && data?.status === "failed" && (
          <div className="flex flex-col items-center gap-4 text-center">
            <InlineError
              message={"error" in data ? data.error : "Plan generation failed. Please try again."}
            />
            <a
              href="/"
              className="text-sm font-medium text-green-700 underline underline-offset-2 hover:text-green-800 dark:text-green-400"
            >
              ← Start over
            </a>
          </div>
        )}

        {/* ── Completed — PlanView will be wired up here in a separate issue ── */}
        {isDone && data?.status === "completed" && (
          <div className="flex w-full flex-col gap-6">
            <div className="flex flex-col gap-1">
              <p className="text-base font-medium text-zinc-700 dark:text-zinc-300">
                Your plan is ready.
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-600">
                Plan ID: {planId}
              </p>
            </div>

            <DownloadPdfButton planId={planId} />
          </div>
        )}
      </main>
    </div>
  );
}