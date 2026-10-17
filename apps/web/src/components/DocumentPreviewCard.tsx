"use client";

import { useRef, type ReactNode } from "react";
import { FileText, FileType } from "lucide-react";
import { LogoMark } from "@/components/Illustrations";

interface DocumentPreviewCardProps {
  type: "pdf" | "docx";
  title: string;
  description: string;
  action: ReactNode;
  /** Names of the sections in the downloaded document, shown as its contents. */
  sections: readonly string[];
}

/** How many section names show on the mini page before collapsing to "+ N more". */
const VISIBLE_SECTIONS = 6;
/** Maximum tilt in degrees as the pointer moves across the card. */
const MAX_TILT = 7;

/**
 * A download option drawn as the document itself: a little page with the
 * plan's contents on it that leans toward the pointer, with the download
 * button underneath. The two formats are told apart by colour and shape,
 * not by repeating the same text twice.
 */
export default function DocumentPreviewCard({
  type,
  title,
  description,
  action,
  sections,
}: DocumentPreviewCardProps) {
  const pageRef = useRef<HTMLDivElement>(null);
  const isPdf = type === "pdf";
  const Icon = isPdf ? FileType : FileText;
  const shown = sections.slice(0, VISIBLE_SECTIONS);
  const hidden = Math.max(sections.length - shown.length, 0);

  function handleMove(event: React.PointerEvent<HTMLDivElement>) {
    const el = pageRef.current;
    if (!el || event.pointerType === "touch") return;
    const rect = el.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(900px) rotateX(${(-y * MAX_TILT).toFixed(2)}deg) rotateY(${(x * MAX_TILT).toFixed(2)}deg) translateY(-4px)`;
  }

  function handleLeave() {
    if (pageRef.current) pageRef.current.style.transform = "";
  }

  return (
    <div className="flex flex-col gap-4">
      <div onPointerMove={handleMove} onPointerLeave={handleLeave} className="relative">
        {/* the page */}
        <div
          ref={pageRef}
          className="ink-card relative overflow-hidden rounded-2xl transition-transform duration-200 ease-out will-change-transform"
        >
          <div className={`flex items-center justify-between px-5 py-3 ${isPdf ? "bg-teal-500" : "bg-marigold"}`}>
            <div className="flex items-center gap-2">
              <LogoMark className="h-6 w-6" />
              <span className="font-display text-sm font-bold text-deep">Business plan</span>
            </div>
            <span className="rounded-full border-2 border-deep bg-white px-2.5 py-0.5 text-xs font-bold text-deep">
              {isPdf ? "PDF" : "DOCX"}
            </span>
          </div>

          <div className="px-5 pb-5 pt-4">
            <p className="text-xs font-semibold text-ink-soft">Contents</p>
            <ol className="mt-2 flex flex-col gap-2">
              {shown.map((name, i) => (
                <li key={name} className="flex items-center gap-2.5 text-sm font-medium text-deep">
                  <span className="w-4 text-right text-xs tabular-nums text-ink-soft">{i + 1}</span>
                  <span className="h-px flex-1 border-t-2 border-dotted border-line" aria-hidden="true" />
                  <span className="shrink-0">{name}</span>
                </li>
              ))}
            </ol>
            {hidden > 0 && (
              <p className="mt-3 text-xs font-semibold text-ink-soft">+ {hidden} more sections</p>
            )}
          </div>

          {/* folded corner */}
          <span
            aria-hidden="true"
            className="absolute bottom-0 right-0 h-8 w-8 bg-gradient-to-tl from-kraft-deep via-kraft to-transparent [clip-path:polygon(100%_0,100%_100%,0_100%)]"
          />
        </div>
      </div>

      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-deep bg-kraft">
          <Icon size={20} className="text-deep" />
        </span>
        <div>
          <h3 className="font-display font-bold text-deep">{title}</h3>
          <p className="text-sm leading-snug text-ink-soft">{description}</p>
        </div>
      </div>

      {action}
    </div>
  );
}
