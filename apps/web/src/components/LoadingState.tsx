"use client";

import { useEffect, useState } from "react";

interface Props {
  /** The plan ID being generated — shown as a subtle reference. */
  planId: string;
}

/**
 * Shown while GET /api/business-plans/:id returns { status: "processing" }.
 * Counts elapsed seconds from mount so the user knows work is happening.
 */
export default function LoadingState({ planId }: Props) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((s) => s + 1), 1_000);
    return () => clearInterval(timer);
  }, []);

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

      {/* Heading */}
      <div className="flex flex-col gap-1">
        <p className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
          Generating your business plan…
        </p>
        <p className="text-sm text-zinc-800 dark:text-zinc-400">
          We&apos;re researching the Nigerian market and building your plan.
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
