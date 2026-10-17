"use client";

import { useState, type ReactNode } from "react";
import { Check, RefreshCw } from "lucide-react";

interface FlipCardProps {
  /** Step number, shown on the front. These cards are a real sequence. */
  step: number;
  title: string;
  description: string;
  /** Rendered illustration; the card positions and animates its wrapper. */
  illustration: ReactNode;
  /** Heading and bullet points shown on the back once flipped. */
  backTitle: string;
  backPoints: readonly string[];
}

/**
 * A step card that responds in two ways: hovering it darkens the card and
 * lifts the illustration to centre; pressing the flip button turns it over
 * in 3D to reveal what you actually get at that step.
 */
export default function FlipCard({
  step,
  title,
  description,
  illustration,
  backTitle,
  backPoints,
}: FlipCardProps) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="group h-[25rem] [perspective:1400px]">
      <div
        className={`relative h-full w-full transition-transform duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] [transform-style:preserve-3d] ${
          flipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* ── Front ─────────────────────────────────────────── */}
        <div
          aria-hidden={flipped}
          className="ink-card absolute inset-0 overflow-hidden rounded-3xl [backface-visibility:hidden]"
        >
          <div className="absolute inset-0 bg-deep opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="relative flex h-full flex-col p-6">
            <div className="flex items-start justify-between">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-mist font-display text-sm font-bold text-deep transition-colors duration-300 group-hover:bg-white">
                {step}
              </span>
              <button
                type="button"
                onClick={() => setFlipped(true)}
                tabIndex={flipped ? -1 : 0}
                aria-label={`Flip card: what happens at step ${step}`}
                className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-deep bg-white text-deep transition-transform hover:rotate-180 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-marigold"
              >
                <RefreshCw size={16} />
              </button>
            </div>

            <div className="mt-5 transition-opacity duration-200 group-hover:opacity-0">
              <h3 className="font-display text-xl font-bold text-deep">{title}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft">{description}</p>
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-3 mx-auto h-44 w-60 transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:-translate-y-[4.5rem] group-hover:scale-110 [&>svg]:h-full [&>svg]:w-full">
              {illustration}
            </div>
          </div>
        </div>

        {/* ── Back ──────────────────────────────────────────── */}
        <div
          aria-hidden={!flipped}
          className="absolute inset-0 overflow-hidden rounded-3xl border-2 border-deep bg-deep text-white shadow-[6px_6px_0_0_var(--color-teal-500)] [backface-visibility:hidden] [transform:rotateY(180deg)]"
        >
          <div className="flex h-full flex-col p-6">
            <div className="flex items-start justify-between">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white font-display text-sm font-bold text-deep">
                {step}
              </span>
              <button
                type="button"
                onClick={() => setFlipped(false)}
                tabIndex={flipped ? 0 : -1}
                aria-label="Flip card back"
                className="flex h-9 w-9 items-center justify-center rounded-lg border-2 border-white/70 bg-transparent text-white transition-transform hover:-rotate-180 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-marigold"
              >
                <RefreshCw size={16} />
              </button>
            </div>

            <h3 className="font-display mt-5 text-xl font-bold">{backTitle}</h3>
            <ul className="mt-4 flex flex-col gap-3">
              {backPoints.map((point) => (
                <li key={point} className="flex items-start gap-3 text-[0.95rem] leading-snug text-white/90">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-marigold text-deep">
                    <Check size={13} strokeWidth={3.5} />
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
