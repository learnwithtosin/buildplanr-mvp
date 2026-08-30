import AppHeader from "@/components/AppHeader";
import IdeaForm from "@/components/IdeaForm";
import { FileText, ListChecks, Sparkles } from "lucide-react";

/**
 * The actual 3-step flow (idea -> questionnaire -> generated plan), shown
 * on the landing page so founders know what to expect before they start.
 */
const STEPS = [
  {
    icon: Sparkles,
    title: "Describe your idea",
    description: "Tell us what you want to build, in your own words — one paragraph is enough.",
  },
  {
    icon: ListChecks,
    title: "Answer a few questions",
    description: "We ask a handful of questions tailored to your specific idea, one page at a time.",
  },
  {
    icon: FileText,
    title: "Download your plan",
    description: "Get a full business plan grounded in Nigerian market and regulatory context, as PDF or Word.",
  },
] as const;

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <AppHeader />

      <main className="flex flex-1 flex-col items-center px-6 pb-24 pt-32">
        <div className="grid w-full max-w-5xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* ── Hero copy + form ─────────────────────────────── */}
          <div className="flex flex-col items-center gap-8 text-center lg:items-start lg:text-left">
            <div className="flex flex-col items-center gap-4 lg:items-start">
              <span className="inline-flex items-center rounded-full border border-[#bfecef] bg-white px-5 py-2 shadow-sm">
                <span className="text-base">🇳🇬</span>
                <span className="ml-2 text-sm font-semibold italic tracking-wide text-[#129ba4]">
                  Made for Nigerian founders
                </span>
              </span>

              <h1 className="font-display text-5xl font-bold leading-[1.1] tracking-tight text-[#122625]">
                Turn your business idea into{" "}
                <span className="text-[#16bfcc]">a plan</span>
              </h1>

              <p className="max-w-lg text-lg font-medium leading-relaxed text-[#6d7f7d]">
                Describe what you want to build. We&apos;ll ask a few quick
                questions, then generate a business plan grounded in Nigerian
                market and regulatory context.
              </p>
            </div>

            <div className="w-full max-w-xl rounded-3xl border border-[#c1edf0] bg-transparent p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_40px_-20px_rgba(0,0,0,0.18)]">
              <IdeaForm />
            </div>

            <p className="text-sm font-medium text-[#122625]">
              No wahala — free to start, no card required.
            </p>
          </div>

          {/* ── Document preview illustration ────────────────── */}
          <div className="hidden lg:flex lg:justify-center">
            <div className="relative w-full max-w-sm">
              <div
                aria-hidden="true"
                className="absolute -bottom-4 -right-4 h-full w-full rounded-2xl border border-[#c1edf0] bg-[#effbfa]"
              />
              <div className="relative rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl">
                <div className="mb-4 flex items-center gap-3 border-b border-zinc-100 pb-4">
                  <span className="rounded-lg bg-cyan-50 p-2 text-cyan-600">
                    <FileText size={20} />
                  </span>
                  <div>
                    <p className="font-display text-sm font-semibold text-zinc-900">
                      Business Plan
                    </p>
                    <p className="text-xs text-zinc-500">Executive Summary</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2.5">
                  <div className="h-2.5 w-full rounded-full bg-zinc-100" />
                  <div className="h-2.5 w-11/12 rounded-full bg-zinc-100" />
                  <div className="h-2.5 w-full rounded-full bg-zinc-100" />
                  <div className="h-2.5 w-4/5 rounded-full bg-zinc-100" />
                  <div className="mt-2 h-2.5 w-1/2 rounded-full bg-[#c1edf0]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── How it works ─────────────────────────────────── */}
        <div className="mt-24 w-full max-w-5xl">
          <h2 className="font-display text-center text-2xl font-bold tracking-tight text-[#122625]">
            How it works
          </h2>

          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="flex flex-col items-center gap-3 text-center sm:items-start sm:text-left"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#effbfa] text-[#0ca7b2]">
                  <step.icon size={20} />
                </span>
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#6d7f7d]">
                    Step {i + 1}
                  </p>
                  <h3 className="font-display text-lg font-semibold text-[#122625]">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[#6d7f7d]">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
