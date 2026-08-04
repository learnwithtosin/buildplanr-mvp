
import type { PlanContent } from "types";

/**
 * Renders a completed business plan's content as a readable page: one
 * clearly labeled section per field of `PlanContent`, in a sensible reading
 * order (overview -> strategy -> numbers -> risk -> next steps).
 *
 * Loading/polling and PDF/Word export are handled elsewhere — this
 * component only knows how to display a already-completed `content` object.
 */

interface PlanSection {
  /** Key into PlanContent. */
  field: keyof PlanContent;
  /** Human-readable section heading. */
  label: string;
}

const SECTIONS: readonly PlanSection[] = [
  { field: "executiveSummary", label: "Executive Summary" },
  { field: "businessDescription", label: "Business Description" },
  { field: "marketAnalysis", label: "Market Analysis" },
  { field: "marketingStrategy", label: "Marketing Strategy" },
  { field: "operationsPlan", label: "Operations Plan" },
  { field: "financialPlan", label: "Financial Plan" },
  { field: "startupCostEstimate", label: "Startup Cost Estimate" },
  { field: "operatingCostEstimate", label: "Operating Cost Estimate" },
  { field: "breakEvenEstimate", label: "Break-Even Estimate" },
  { field: "cashFlowProjection", label: "Cash Flow Projection" },
  { field: "regulatoryConsiderations", label: "Regulatory Considerations" },
  { field: "risks", label: "Risks" },
  { field: "recommendations", label: "Recommendations" },
] as const;

export interface PlanViewProps {
  /** The completed plan's content, as returned by GET /api/business-plans/:id. */
  content: PlanContent;
}

export default function PlanView({ content }: PlanViewProps) {
  return (
    <article className="mx-auto w-full max-w-3xl px-6 py-12 sm:px-8">
      <header className="mb-10 border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Business Plan
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Generated plan, grounded in Nigerian market and regulatory context.
        </p>
      </header>

      <div className="flex flex-col gap-10">
        {SECTIONS.map(({ field, label }) => (
          <section key={field} aria-labelledby={`plan-section-${field}`}>
            <h2
              id={`plan-section-${field}`}
              className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50"
            >
              {label}
            </h2>
            <p className="mt-2 whitespace-pre-line text-base leading-7 text-zinc-700 dark:text-zinc-300">
              {content[field]}
            </p>
          </section>
        ))}
      </div>
    </article>
  );
}