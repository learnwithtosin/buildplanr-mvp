"use client";

/**
 * /plan/[id]
 *
 * Polls GET /api/business-plans/:id via usePlanStatus until the plan
 * is completed or failed, showing LoadingState in the meantime.
 *
 * Once completed, PlanView renders the full generated content as the
 * primary, real preview. DocumentPreviewCard is used only for the two
 * export tiles below it, and now shows a genuine excerpt pulled from
 * the completed plan rather than placeholder content.
 */

import DocumentPreviewCard from "@/components/DocumentPreviewCard";
import Link from "next/link";
import { useParams } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import LoadingState from "@/components/LoadingState";
import DownloadPdfButton from "@/components/DownloadPdfButton";
import DownloadDocxButton from "@/components/DownloadDocxButton";
import InlineError from "@/components/InlineError";
import PlanView from "@/components/PlanView";
import { usePlanStatus } from "@/lib/usePlanStatus";

export default function PlanPage() {
  const params = useParams();
  const planId = Array.isArray(params.id) ? params.id[0] : (params.id ?? "");

  const { data, isLoading, error, isDone } = usePlanStatus(planId);

  const isProcessing = isLoading || data?.status === "processing";

  return (
    <div className="flex min-h-screen flex-col bg-[#ffffff]">
      <AppHeader />

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-6 py-12">
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
          <div className="flex w-full flex-col gap-4">
            {/* Real preview: the full generated plan, not a placeholder */}
            <PlanView content={data.content} />

            <div className="text-center">
              <h2 className="text-xl font-semibold text-zinc-900">
                Export your plan
              </h2>
              <p className="mt-1 text-sm text-zinc-500">
                Download the same content you just read above.
              </p>
              <p className="mt-3 text-xs text-zinc-400">Plan ID: {planId}</p>
            </div>

            <div className="grid gap-8 pb-12 md:grid-cols-2">
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
        )}
      </main>
    </div>
  );
}
