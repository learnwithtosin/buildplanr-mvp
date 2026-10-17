"use client";

/**
 * /plan/[id]
 *
 * Polls GET /api/business-plans/:id via usePlanStatus until the plan
 * is completed or failed, showing LoadingState in the meantime.
 *
 * Once completed: a left column shows only the executive summary (clamped,
 * with a "Read more" toggle), and the right two-thirds shows the PDF/Word
 * download cards side by side. The full section-by-section plan is not
 * shown on this page — it lives in the downloaded documents.
 */

import Link from "next/link";
import { useParams } from "next/navigation";
import { Plus } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import Confetti from "@/components/Confetti";
import DocumentPreviewCard from "@/components/DocumentPreviewCard";
import DownloadDocxButton from "@/components/DownloadDocxButton";
import DownloadPdfButton from "@/components/DownloadPdfButton";
import ExecutiveSummaryPreview from "@/components/ExecutiveSummaryPreview";
import InlineError from "@/components/InlineError";
import { PlanIllustration } from "@/components/Illustrations";
import LoadingState from "@/components/LoadingState";
import { PLAN_SECTIONS } from "@/lib/planSections";
import { usePlanStatus } from "@/lib/usePlanStatus";

export default function PlanPage() {
  const params = useParams();
  const planId = Array.isArray(params.id) ? params.id[0] : (params.id ?? "");

  const { data, isLoading, error, isDone } = usePlanStatus(planId);

  const isProcessing = isLoading || data?.status === "processing";

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 pb-16 pt-28">
        {/* ── Loading / processing ────────────────────────── */}
        {isProcessing && <LoadingState />}

        {/* ── Error (network/fetch failure while polling) ───── */}
        {error && (
          <div className="ink-card flex max-w-md flex-col items-center gap-4 rounded-3xl p-8 text-center">
            <InlineError message={error.message} />
            <Link href="/" className="btn-ghost rounded-xl px-5 py-2.5 text-sm">
              Start over
            </Link>
          </div>
        )}

        {/* ── Generation failed (status: "failed" from the API) ───────────── */}
        {isDone && data?.status === "failed" && (
          <div className="ink-card flex max-w-md flex-col items-center gap-4 rounded-3xl p-8 text-center">
            <InlineError
              message={"error" in data ? data.error : "Plan generation failed. Please try again."}
            />
            <Link href="/" className="btn-ghost rounded-xl px-5 py-2.5 text-sm">
              Start over
            </Link>
          </div>
        )}

        {/* ── Completed ───────────────────────────────────────────── */}
        {isDone && data?.status === "completed" && (
          <div className="flex w-full flex-col gap-10">
            <Confetti />

            <div className="flex flex-col items-center gap-2 text-center">
              <PlanIllustration className="animate-pop h-40 w-52" />
              <h1 className="font-display animate-rise text-4xl font-bold tracking-tight text-deep">
                Your business plan is ready.
              </h1>
              <p
                className="animate-rise max-w-md text-lg leading-relaxed text-ink-soft"
                style={{ animationDelay: "120ms" }}
              >
                Read the summary here, then download the full plan in the format you need.
              </p>
            </div>

            <div className="grid w-full items-start gap-8 lg:grid-cols-3">
              <div className="animate-rise lg:col-span-1" style={{ animationDelay: "220ms" }}>
                <ExecutiveSummaryPreview text={data.content.executiveSummary} />
              </div>

              <div
                className="animate-rise grid gap-8 sm:grid-cols-2 lg:sticky lg:top-28 lg:col-span-2"
                style={{ animationDelay: "320ms" }}
              >
                <DocumentPreviewCard
                  type="pdf"
                  title="PDF version"
                  description="Best for printing and sharing."
                  sections={PLAN_SECTIONS}
                  action={<DownloadPdfButton planId={planId} />}
                />

                <DocumentPreviewCard
                  type="docx"
                  title="Word document"
                  description="Editable in Microsoft Word."
                  sections={PLAN_SECTIONS}
                  action={<DownloadDocxButton planId={planId} />}
                />
              </div>
            </div>

            <div className="flex justify-center">
              <Link href="/" className="btn-ghost rounded-xl px-5 py-2.5 text-sm">
                <Plus size={16} />
                Plan another idea
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
