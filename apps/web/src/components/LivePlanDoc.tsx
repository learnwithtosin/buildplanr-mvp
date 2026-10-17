"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";

/** Sample ideas the demo page cycles through. Purely illustrative. */
const SAMPLE_IDEAS = [
  "Mobile car wash, Lagos",
  "Bakery and cake orders, Jos",
  "POS and airtime agent, Kano",
  "Poultry farm, Ibadan",
] as const;

const SECTIONS = [
  { name: "Executive summary", lines: [100, 92, 64] },
  { name: "Market analysis", lines: [96, 78] },
  { name: "Startup costs in ₦", lines: [88, 100, 52] },
  { name: "CAC and tax checklist", lines: [94, 70] },
  { name: "Cash flow and break-even", lines: [100, 84] },
] as const;

const STEP_MS = 1100;
/** How many extra ticks the finished page stays on screen before it restarts. */
const HOLD_TICKS = 4;

/**
 * The landing page's centrepiece: a plan document that writes itself, section
 * by section, then starts over on a different sample idea. It shows what the
 * product produces before anyone has typed a word.
 */
export default function LivePlanDoc() {
  // One state object so the "restart on the next idea" step stays a pure update.
  const [{ tick, ideaIndex }, setState] = useState({ tick: 0, ideaIndex: 0 });

  useEffect(() => {
    const id = setInterval(() => {
      setState((s) =>
        s.tick >= SECTIONS.length + HOLD_TICKS
          ? { tick: 0, ideaIndex: (s.ideaIndex + 1) % SAMPLE_IDEAS.length }
          : { ...s, tick: s.tick + 1 },
      );
    }, STEP_MS);
    return () => clearInterval(id);
  }, []);

  const complete = tick >= SECTIONS.length;

  return (
    <div className="relative mx-auto w-full max-w-sm">
      {/* floating chips */}
      <span
        className="animate-bob absolute -left-5 -top-5 z-10 hidden rounded-full border-2 border-deep bg-marigold px-3 py-1 text-xs font-bold text-deep shadow-[3px_3px_0_0_var(--color-deep)] sm:block"
        style={{ ["--bob-rot" as string]: "-6deg" }}
      >
        Built for Nigeria
      </span>
      <span
        className="animate-bob absolute -right-4 bottom-16 z-10 hidden rounded-full border-2 border-deep bg-white px-3 py-1 text-xs font-bold text-deep shadow-[3px_3px_0_0_var(--color-deep)] sm:block"
        style={{ ["--bob-rot" as string]: "5deg", animationDelay: "-2s" }}
      >
        PDF and Word
      </span>

      {/* back sheet */}
      <div
        aria-hidden="true"
        className="absolute inset-0 translate-x-4 translate-y-4 rotate-3 rounded-3xl border-2 border-deep bg-kraft"
      />

      <div
        className="ink-card relative rounded-3xl p-5"
        role="img"
        aria-label="A sample business plan being written section by section"
      >
        <div className="flex items-center justify-between border-b-2 border-dashed border-line pb-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-ink-soft">Sample plan</p>
            <p key={ideaIndex} className="font-display animate-fade-in truncate text-base font-bold text-deep">
              {SAMPLE_IDEAS[ideaIndex]}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full border-2 border-deep px-3 py-1 text-xs font-bold transition-colors duration-500 ${
              complete ? "bg-teal-500 text-deep" : "bg-mist text-ink-soft"
            }`}
          >
            {complete ? "Ready" : "Writing…"}
          </span>
        </div>

        <ul className="mt-4 flex flex-col gap-4">
          {SECTIONS.map((section, i) => {
            const done = tick > i;
            const writing = tick === i;
            return (
              <li key={section.name}>
                <div className="flex items-center gap-2.5">
                  <span className="relative flex h-5 w-5 items-center justify-center">
                    {writing && (
                      <span className="pulse-ring absolute inset-0 rounded-full bg-teal-500/50" />
                    )}
                    <span
                      className={`relative flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors duration-300 ${
                        done
                          ? "border-deep bg-teal-500 text-deep"
                          : writing
                            ? "border-deep bg-marigold"
                            : "border-line bg-white"
                      }`}
                    >
                      {done && <Check size={11} strokeWidth={4} />}
                    </span>
                  </span>
                  <span
                    className={`text-sm font-semibold transition-colors duration-300 ${
                      done || writing ? "text-deep" : "text-ink-soft/60"
                    }`}
                  >
                    {section.name}
                  </span>
                </div>

                <div className="mt-2 flex flex-col gap-1.5 pl-[1.9rem]">
                  {section.lines.map((width, li) => (
                    <div key={li} className="h-2 rounded-full bg-ink/[0.06]" style={{ width: `${width}%` }}>
                      <div
                        className={`h-full origin-left rounded-full bg-teal-500/70 transition-transform duration-[700ms] ease-out ${
                          done || writing ? "scale-x-100" : "scale-x-0"
                        }`}
                        style={{ transitionDelay: `${li * 160}ms` }}
                      />
                    </div>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
