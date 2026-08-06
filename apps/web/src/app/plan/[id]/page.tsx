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

import DocumentPreviewCard from "@/components/DocumentPreviewCard";
import { useParams } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import LoadingState from "@/components/LoadingState";
import DownloadPdfButton from "@/components/DownloadPdfButton";
import DownloadDocxButton from "@/components/DownloadDocxButton";
import InlineError from "@/components/InlineError";
import { usePlanStatus } from "@/lib/usePlanStatus";

export default function PlanPage() {
  const params = useParams();
  const planId = Array.isArray(params.id) ? params.id[0] : (params.id ?? "");

  const { data, isLoading, error, isDone } = usePlanStatus(planId);

  const isProcessing = isLoading || data?.status === "processing";

  return (
    <div className="flex min-h-screen flex-col bg-[#ffffff]">
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
              className="text-sm font-medium text-[#12a8b0] underline underline-offset-2"
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
              className="text-sm font-medium text-[#12a8b0] underline underline-offset-2"
            >
              ← Start over
            </a>
          </div>
        )}

        {/* ── Completed ───────────────────────────────────────────── */}
        {isDone && data?.status === "completed" && (
          <div className="flex w-full flex-col gap-10">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-zinc-900">
                🎉 Your Business Plan is Ready
              </h1>

              <p className="mt-2 text-zinc-500">
                Review the available formats before downloading.
              </p>

              <p className="mt-3 text-xs text-zinc-400">
                Plan ID: {planId}
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              <DocumentPreviewCard
                type="pdf"
                title="PDF Version"
                description="Perfect for printing and sharing."
                action={<DownloadPdfButton planId={planId} />}
              />

              <DocumentPreviewCard
                type="docx"
                title="Word Document"
                description="Editable Microsoft Word format."
                action={<DownloadDocxButton planId={planId} />}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}