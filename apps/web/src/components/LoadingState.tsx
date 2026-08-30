"use client";

import { useEffect, useState } from "react";

interface Props {
  /** The plan ID being generated — shown as a subtle reference. */
  planId: string;
}

/**
 * Short status messages cycled while the plan generates, each naming a real
 * step of plan-generation.service.ts's pipeline (RAG retrieval, then the
 * PlanContent sections in roughly the order the model writes them) rather
 * than generic "loading…" text.
 */
const STATUS_MESSAGES = [
  "Reading your business idea",
  "Checking Nigerian regulatory requirements",
  "Researching your market and competitors",
  "Structuring your executive summary",
  "Estimating startup and operating costs",
  "Projecting cash flow and break-even",
  "Weighing risks and recommendations",
  "Finalizing your plan",
] as const;

const MESSAGE_INTERVAL_MS = 3_000;

/**
 * Shown while GET /api/business-plans/:id returns { status: "processing" }.
 * Cycles through STATUS_MESSAGES so the wait feels alive rather than static,
 * and still counts elapsed seconds from mount so the user knows how long
 * it's been.
 */
export default function LoadingState({ planId }: Props) {
  const [elapsed, setElapsed] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((s) => s + 1), 1_000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Stops on the last message ("Finalizing your plan") instead of looping
    // back to the start — generation is normally done by then anyway.
    if (messageIndex >= STATUS_MESSAGES.length - 1) return;
    const timer = setTimeout(() => setMessageIndex((i) => i + 1), MESSAGE_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [messageIndex]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const elapsedLabel =
    minutes > 0
      ? `${minutes}m ${seconds.toString().padStart(2, "0")}s`
      : `${seconds}s`;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Generating your business plan"
      className="flex flex-col items-center gap-6 text-center"
    >
      {/* Spinner */}
      <div
        aria-hidden="true"
        className="h-12 w-12 animate-spin rounded-full border-4 border-[#122625] border-t-[#12a8b0] dark:border-[#122625] dark:border-t-[#12a8b0]"
      />

      {/* Rotating status message */}
      <div className="flex min-h-14 flex-col items-center justify-center gap-1">
        <p
          key={messageIndex}
          className="font-display animate-fade-in text-lg font-semibold text-zinc-800 dark:text-zinc-100"
        >
          {STATUS_MESSAGES[messageIndex]}…
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          This usually takes 30–60 seconds.
        </p>
      </div>

      {/* Elapsed time */}
      <div className="rounded-full bg-zinc-100 px-4 py-1.5 dark:bg-zinc-800">
        <span className="text-sm font-medium tabular-nums text-zinc-600 dark:text-zinc-300">
          {elapsedLabel} elapsed
        </span>
      </div>

      {/* Subtle plan ID reference */}
      <p className="text-xs text-zinc-400 dark:text-zinc-600">
        Plan ID: {planId}
      </p>
    </div>
  );
}
