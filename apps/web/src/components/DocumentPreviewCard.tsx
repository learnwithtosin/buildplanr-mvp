"use client";

import { FileText, FileType, Download } from "lucide-react";
import type { ReactNode } from "react";

interface DocumentPreviewCardProps {
  type: "pdf" | "docx";
  title: string;
  description: string;
  action: ReactNode;
}

export default function DocumentPreviewCard({
  type,
  title,
  description,
  action,
}: DocumentPreviewCardProps) {
  const Icon = type === "pdf" ? FileType : FileText;

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* Card Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-cyan-50 p-3 text-cyan-600">
            <Icon size={26} />
          </div>

          <div>
            <h3 className="font-semibold text-zinc-900">{title}</h3>

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

      {/* Fake Document */}
      <div className="p-6">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          {/* Document heading */}
          <div className="mb-5">
            <p className="text-sm font-bold text-zinc-800">
              BuildPlan
            </p>

            <p className="text-xs text-zinc-500">
              Nigerian Business Plan
            </p>
          </div>

          {/* Fake text */}
          <div className="space-y-2">
            <div className="h-2 w-5/6 rounded bg-zinc-300" />
            <div className="h-2 rounded bg-zinc-200" />
            <div className="h-2 w-4/5 rounded bg-zinc-200" />
            <div className="h-2 w-3/4 rounded bg-zinc-200" />
            <div className="h-2 rounded bg-zinc-200" />
            <div className="h-2 w-2/3 rounded bg-zinc-200" />
          </div>

          {/* Preview Box */}
          <div className="mt-6 flex flex-col items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-50 py-8 text-zinc-400">
            <Icon size={48} />

            <span className="mt-3 text-xs font-medium">
              {type === "pdf"
                ? "Page 1 Preview"
                : "Editable Document"}
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