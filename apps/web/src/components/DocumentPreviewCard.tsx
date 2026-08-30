"use client";

import { FileText, FileType, Download } from "lucide-react";
import type { ReactNode } from "react";

const EXCERPT_MAX_CHARS = 220;

/**
 * Truncates `text` to a whole-word boundary at or before `maxChars`,
 * appending an ellipsis. Never cuts mid-word, since this is shown as a
 * genuine excerpt of the generated plan (not a decorative placeholder).
 */
function truncateToWord(text: string, maxChars: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) return trimmed;

  const slice = trimmed.slice(0, maxChars);
  const lastSpace = slice.lastIndexOf(" ");
  const safeSlice = lastSpace > 0 ? slice.slice(0, lastSpace) : slice;
  return `${safeSlice}…`;
}

interface DocumentPreviewCardProps {
  type: "pdf" | "docx";
  title: string;
  description: string;
  action: ReactNode;
  /**
   * Real text pulled from the generated plan (e.g. content.executiveSummary)
   * used to render a genuine excerpt. Required — this card no longer shows
   * placeholder content, so callers must have completed plan content before
   * rendering it.
   */
  excerpt: string;
  /** Rough total page/section count, shown as "~N sections" under the excerpt. */
  sectionCount: number;
}

export default function DocumentPreviewCard({
  type,
  title,
  description,
  action,
  excerpt,
  sectionCount,
}: DocumentPreviewCardProps) {
  const Icon = type === "pdf" ? FileType : FileText;
  const displayExcerpt = truncateToWord(excerpt, EXCERPT_MAX_CHARS);

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-cyan-50 p-3 text-cyan-600">
            <Icon size={26} />
          </div>

          <div>
            <h3 className="font-display font-semibold text-zinc-900">{title}</h3>

            <p className="text-sm text-zinc-500">
              {description}
            </p>
          </div>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-[10px] font-semibold tracking-wide ${
            type === "pdf"
              ? "bg-red-100 text-red-600"
              : "bg-blue-100 text-blue-600"
          }`}
        >
          {type === "pdf" ? "PDF" : "DOCX"}
        </span>
      </div>

      {/* Real excerpt from the generated plan */}
      <div className="p-6">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="mb-3">
            <p className="text-sm font-bold text-zinc-800">
              BuildPlan
            </p>

            <p className="text-xs text-zinc-500">
              Nigerian Business Plan — Executive Summary
            </p>
          </div>

          <p className="text-sm leading-6 text-zinc-600">{displayExcerpt}</p>

          <div className="mt-5 flex items-center gap-2 border-t border-dashed border-zinc-200 pt-4 text-zinc-400">
            <Icon size={18} />
            <span className="text-xs font-medium">
              {sectionCount} section{sectionCount === 1 ? "" : "s"} in the full document
            </span>
          </div>
        </div>
      </div>

      {/* Download */}
      <div className="mt-auto border-t border-zinc-100 bg-zinc-50 px-5 py-4">
        <div className="flex items-center justify-center gap-2">
          <Download size={18} />
          {action}
        </div>
      </div>
    </div>
  );
}