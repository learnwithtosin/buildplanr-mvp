"use client";

import { useState } from "react";

interface ExecutiveSummaryPreviewProps {
  /** The completed plan's executive summary — the only section shown on this page; the full 13-section plan lives in the downloaded PDF/Word documents. */
  text: string;
}

/**
 * Left-column summary panel for the completed-plan page: the executive
 * summary only, clamped to roughly 20-25 lines with a toggle to read the
 * rest without leaving the page.
 */
export default function ExecutiveSummaryPreview({ text }: ExecutiveSummaryPreviewProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex h-full flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-zinc-950">Executive Summary</h2>
        <p className="mt-1 text-xs text-zinc-500">
          The full plan — all 13 sections — is in your downloaded PDF or Word document.
        </p>
      </div>

      <p
        className={`whitespace-pre-line text-sm leading-6 text-zinc-700 ${
          expanded ? "" : "line-clamp-[24]"
        }`}
      >
        {text}
      </p>

      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="self-start text-sm font-semibold text-[#0ca7b2] underline underline-offset-2 hover:text-[#12a8b0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#12a8b0]"
      >
        {expanded ? "View less" : "View more"}
      </button>
    </div>
  );
}
