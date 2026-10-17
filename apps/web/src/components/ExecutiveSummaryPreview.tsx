"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface ExecutiveSummaryPreviewProps {
  /** The completed plan's executive summary — the only section shown on this page; the full 13-section plan lives in the downloaded PDF/Word documents. */
  text: string;
}

/**
 * Left-column summary panel for the completed-plan page: the executive
 * summary only, clamped to roughly 20-25 lines with a toggle to read the
 * rest without leaving the page. Drawn as a sheet of paper with a tab.
 */
export default function ExecutiveSummaryPreview({ text }: ExecutiveSummaryPreviewProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="relative h-full pt-4">
      {/* tab */}
      <span className="font-display absolute left-5 top-0 z-10 rounded-t-xl border-2 border-b-0 border-deep bg-marigold px-4 py-1 text-sm font-bold text-deep">
        Executive summary
      </span>

      <div className="ink-card flex h-full flex-col gap-4 rounded-2xl rounded-tl-none p-6">
        <div className="relative">
          <p
            className={`whitespace-pre-line text-[0.95rem] leading-7 text-ink ${
              expanded ? "" : "line-clamp-[24]"
            }`}
          >
            {text}
          </p>
          {!expanded && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent"
            />
          )}
        </div>

        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          className="btn-ghost self-start rounded-full px-4 py-1.5 text-sm"
        >
          {expanded ? "Show less" : "Read more"}
          <ChevronDown size={16} className={`transition-transform duration-300 ${expanded ? "rotate-180" : ""}`} />
        </button>

        <p className="border-t-2 border-dashed border-line pt-4 text-sm leading-relaxed text-ink-soft">
          The other twelve sections, from market analysis to risks, are in your downloaded files.
        </p>
      </div>
    </div>
  );
}
