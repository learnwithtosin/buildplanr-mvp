"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { PlanIllustration } from "@/components/Illustrations";
import { PLAN_SECTIONS } from "@/lib/planSections";

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

const SECTIONS = PLAN_SECTIONS;

const MESSAGE_INTERVAL_MS = 3_000;
/** How long each section stays "being written" before the next one starts (an estimate, not a live signal). */
const SECTION_INTERVAL_S = 3.6;

/**
 * Shown while GET /api/business-plans/:id returns { status: "processing" }.
 * The server doesn't report per-section progress, so the section list advances
 * on a steady estimate and always keeps the final sections pending until the
 * plan really arrives. Messages and the elapsed timer keep the wait alive.
 */
export default function LoadingState() {
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

  // Never mark the last two sections done: only a finished plan does that.
  const doneCount = Math.min(Math.floor(elapsed / SECTION_INTERVAL_S), SECTIONS.length - 2);
  const progress = Math.round(((doneCount + 0.5) / SECTIONS.length) * 100);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Generating your business plan"
      className="grid w-full items-center gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16"
    >
      {/* ── Left: what's happening now ─────────────────────── */}
      <div className="flex flex-col items-center gap-6 text-center lg:items-start lg:text-left">
        <div className="relative">
          {/* orbiting sparks */}
          <div aria-hidden="true" className="animate-orbit absolute left-1/2 top-1/2 h-60 w-60 -translate-x-1/2 -translate-y-1/2">
            <span className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-deep bg-marigold" />
            <span className="absolute bottom-6 left-3 h-2.5 w-2.5 rounded-full border-2 border-deep bg-teal-500" />
            <span className="absolute bottom-10 right-1 h-2 w-2 rounded-full bg-deep" />
          </div>
          <PlanIllustration className="relative h-52 w-64" />
        </div>

        <div className="flex min-h-24 flex-col gap-2">
          <h1
            key={messageIndex}
            className="font-display animate-fade-in text-3xl font-bold leading-tight tracking-tight text-deep"
          >
            {STATUS_MESSAGES[messageIndex]}
            <span aria-hidden="true" className="animate-blink ml-0.5 inline-block text-teal-600">
              |
            </span>
          </h1>
          <p className="text-ink-soft">
            This usually takes 30–60 seconds. Keep this page open and your plan will appear here.
          </p>
        </div>

        <span className="rounded-full border-2 border-deep bg-white px-4 py-1.5 text-sm font-bold tabular-nums text-deep shadow-[3px_3px_0_0_var(--color-deep)]">
          {elapsedLabel} elapsed
        </span>
      </div>

      {/* ── Right: the plan, being assembled ───────────────── */}
      <div className="relative mx-auto w-full max-w-md">
        <div
          aria-hidden="true"
          className="absolute inset-0 translate-x-3 translate-y-3 rotate-2 rounded-3xl border-2 border-deep bg-kraft"
        />
        <div className="ink-card relative rounded-3xl p-5">
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm font-bold text-deep">
              <span>Your business plan</span>
              <span className="tabular-nums text-ink-soft">{doneCount} of {SECTIONS.length} sections</span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full border-2 border-deep bg-mist">
              <div
                className="relative h-full rounded-full bg-teal-500 transition-[width] duration-700 ease-out"
                style={{ width: `${progress}%` }}
              >
                <span className="shimmer absolute inset-0 opacity-60" />
              </div>
            </div>
          </div>

          <ul className="flex flex-col gap-1.5">
            {SECTIONS.map((name, i) => {
              const done = i < doneCount;
              const writing = i === doneCount;
              return (
                <li
                  key={name}
                  className={`flex items-center gap-3 rounded-lg px-2.5 py-1.5 transition-colors duration-300 ${
                    writing ? "bg-mist" : ""
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-300 ${
                      done
                        ? "border-deep bg-teal-500 text-deep"
                        : writing
                          ? "border-deep bg-marigold"
                          : "border-line bg-white"
                    }`}
                  >
                    {done && <Check size={11} strokeWidth={4} className="animate-pop" />}
                    {writing && <span className="h-1.5 w-1.5 animate-ping rounded-full bg-deep" />}
                  </span>
                  <span
                    className={`text-sm font-semibold transition-colors duration-300 ${
                      done || writing ? "text-deep" : "text-ink-soft/55"
                    }`}
                  >
                    {name}
                  </span>
                  {writing && <span className="shimmer ml-auto h-2 w-16 rounded-full" />}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
