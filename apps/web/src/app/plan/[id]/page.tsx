"use client";

/**
 * /plan/[id]
 *
 * Shell page for the plan review route. Reads the planId from the
 * dynamic segment and renders a placeholder loading message.
 *
 * Polling and PlanView rendering are implemented in separate issues.
 */

import { useParams } from "next/navigation";

export default function PlanPage() {
  const params = useParams();
  const planId = Array.isArray(params.id) ? params.id[0] : params.id;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      {/* ── Header ───────────────────────────────────────── */}
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <span className="text-lg font-semibold text-green-700 dark:text-green-400">
          BuildPlanr
        </span>
      </header>

      {/* ── Main ─────────────────────────────────────────── */}
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-6 py-12">
        <p className="text-base font-medium text-zinc-700 dark:text-zinc-300">
          Loading your plan…
        </p>
        {planId && (
          <p className="text-xs text-zinc-400 dark:text-zinc-600">
            Plan ID: {planId}
          </p>
        )}
      </main>
    </div>
  );
}
