"use client";

/**
 * /plan/[id]
 *
 * Polls GET /api/business-plans/:id via usePlanStatus until the plan
 * is completed or failed, showing LoadingState in the meantime.
 *
 * Once completed: a left column shows only the executive summary (clamped,
 * with a "View more" toggle), and the right two-thirds shows the PDF/Word
 * download cards side by side. The full section-by-section plan is no
 * longer shown on this page — it lives in the downloaded documents.
 */

import DocumentPreviewCard from "@/components/DocumentPreviewCard";
import Link from "next/link";
import { useParams } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import LoadingState from "@/components/LoadingState";
import DownloadPdfButton from "@/components/DownloadPdfButton";
import DownloadDocxButton from "@/components/DownloadDocxButton";
import InlineError from "@/components/InlineError";
import ExecutiveSummaryPreview from "@/components/ExecutiveSummaryPreview";
import { usePlanStatus } from "@/lib/usePlanStatus";

export default function PlanPage() {
  const params = useParams();
  const planId = Array.isArray(params.id) ? params.id[0] : (params.id ?? "");

  const { data, isLoading, error, isDone } = usePlanStatus(planId);

  const isProcessing = isLoading || data?.status === "processing";

  return (
    <div className="flex min-h-screen flex-col bg-[#ffffff]">
      <AppHeader />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 pb-12 pt-28">
        {/* ── Loading / processing ────────────────────────── */}
        {isProcessing && <LoadingState planId={planId} />}

        {/* ── Error (network/fetch failure while polling) ───── */}
        {error && (
          <div className="flex flex-col items-center gap-4 text-center">
            <InlineError message={error.message} />
            <Link
              href="/"
              className="text-sm font-medium text-[#12a8b0] underline underline-offset-2"
            >
              ← Start over
            </Link>
          </div>
        )}

        {/* ── Generation failed (status: "failed" from the API) ───────────── */}
        {isDone && data?.status === "failed" && (
          <div className="flex flex-col items-center gap-4 text-center">
            <InlineError
              message={"error" in data ? data.error : "Plan generation failed. Please try again."}
            />
            <Link
              href="/"
              className="text-sm font-medium text-[#12a8b0] underline underline-offset-2"
            >
              ← Start over
            </Link>
          </div>
        )}

        {/* ── Completed ───────────────────────────────────────────── */}
        {isDone && data?.status === "completed" && (
          <div className="flex w-full flex-col gap-8 pb-12">
            <div className="text-center">
              <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-950">
                Your business plan is ready
              </h1>
              <p className="mt-1 text-sm text-zinc-500">Plan ID: {planId}</p>
            </div>

            <div className="grid w-full gap-8 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <ExecutiveSummaryPreview text={data.content.executiveSummary} />
              </div>

              <div className="grid gap-8 sm:grid-cols-2 lg:col-span-2">
                <DocumentPreviewCard
                  type="pdf"
                  title="PDF Version"
                  description="Perfect for printing and sharing."
                  excerpt={data.content.executiveSummary}
                  sectionCount={Object.keys(data.content).length}
                  action={<DownloadPdfButton planId={planId} />}
                />

                <DocumentPreviewCard
                  type="docx"
                  title="Word Document"
                  description="Editable Microsoft Word format."
                  excerpt={data.content.executiveSummary}
                  sectionCount={Object.keys(data.content).length}
                  action={<DownloadDocxButton planId={planId} />}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
