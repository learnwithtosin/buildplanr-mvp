import Link from "next/link";
import { ArrowUp, Landmark, Receipt, Banknote } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import IdeaForm from "@/components/IdeaForm";
import LivePlanDoc from "@/components/LivePlanDoc";
import FlipCard from "@/components/FlipCard";
import { PLAN_SECTIONS } from "@/lib/planSections";
import { IdeaIllustration, QuestionsIllustration, PlanIllustration } from "@/components/Illustrations";

/**
 * The real 3-step flow (idea -> questionnaire -> generated plan). Each card
 * flips over to show what happens at that step.
 */
const STEPS = [
  {
    title: "Describe your idea.",
    description: "One paragraph in your own words is enough. Rough is fine; we ask for the details next.",
    illustration: <IdeaIllustration />,
    backTitle: "What to write",
    backPoints: [
      "What you want to sell, and to whom",
      "Where you plan to operate, even just a town",
      "Anything you've already started",
    ],
  },
  {
    title: "Answer a few questions.",
    description: "They're written for your idea and arrive one page at a time, so each page builds on the last.",
    illustration: <QuestionsIllustration />,
    backTitle: "What we ask",
    backPoints: [
      "Your business name, or ideas for one",
      "Your category and state",
      "Whether you're registered with the CAC",
    ],
  },
  {
    title: "Download your plan.",
    description: "A full business plan grounded in Nigerian market and regulatory context.",
    illustration: <PlanIllustration />,
    backTitle: "What you get",
    backPoints: [
      "13 sections, from summary to risks",
      "Startup costs, cash flow and break-even",
      "A print-ready PDF and an editable Word file",
    ],
  },
] as const;


const NIGERIA_NOTES = [
  {
    icon: Landmark,
    title: "Registration, spelled out",
    body: "What registering with the CAC involves for your kind of business, before you spend a naira.",
  },
  {
    icon: Receipt,
    title: "Tax and permits",
    body: "FIRS obligations, plus agency approvals such as NAFDAC or SON where they apply to you.",
  },
  {
    icon: Banknote,
    title: "Numbers in naira",
    body: "Startup and running costs, cash flow and break-even, framed for the local market.",
  },
] as const;

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      <main className="flex flex-1 flex-col items-center">
        {/* ── Hero ───────────────────────────────────────────── */}
        <section id="start" className="w-full scroll-mt-4 px-6 pb-20 pt-32 lg:pb-28">
          <div className="mx-auto grid max-w-5xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
            <div className="flex flex-col gap-7">
              <div className="flex flex-col gap-4">
                <h1 className="font-display text-4xl font-bold leading-[1.08] tracking-tight text-deep sm:text-5xl">
                  Your business idea, written up as a real plan.
                </h1>
                <p className="max-w-lg text-lg leading-relaxed text-ink-soft">
                  Tell us what you want to start. We ask a few questions, then write a plan built around
                  Nigerian rules, costs and customers.
                </p>
              </div>

              <div className="ink-card rounded-3xl p-5 sm:p-6">
                <IdeaForm />
              </div>

              <p className="text-sm font-medium text-ink-soft">
                No wahala: it&apos;s free to start and needs no card.
              </p>
            </div>

            <LivePlanDoc />
          </div>
        </section>

        {/* ── How it works: flip cards ───────────────────────── */}
        <section className="w-full px-6 pb-24">
          <div className="mx-auto max-w-5xl">
            <div className="mx-auto max-w-xl text-center">
              <h2 className="font-display text-3xl font-bold leading-tight tracking-tight text-deep sm:text-4xl">
                From &ldquo;where do I start?&rdquo; to a plan you can act on.
              </h2>
              <p className="mt-3 text-lg leading-relaxed text-ink-soft">
                Three steps. Flip a card to see what happens in each.
              </p>
            </div>

            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <FlipCard
                  key={step.title}
                  step={i + 1}
                  title={step.title}
                  description={step.description}
                  illustration={step.illustration}
                  backTitle={step.backTitle}
                  backPoints={step.backPoints}
                />
              ))}
            </div>
          </div>
        </section>

        {/* ── What's inside ──────────────────────────────────── */}
        <section className="w-full border-y-2 border-deep bg-white px-6 py-20">
          <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <h2 className="font-display text-3xl font-bold leading-tight tracking-tight text-deep">
                Thirteen sections, written for how business works here.
              </h2>
              <div className="mt-6 flex flex-wrap gap-2">
                {PLAN_SECTIONS.map((name) => (
                  <span
                    key={name}
                    className="rounded-full border-2 border-line bg-paper px-3 py-1 text-sm font-medium text-deep transition-colors hover:border-deep hover:bg-mist"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>

            <ul className="flex flex-col gap-5">
              {NIGERIA_NOTES.map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-deep bg-kraft shadow-[3px_3px_0_0_var(--color-deep)]">
                    <Icon size={22} className="text-deep" />
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-bold text-deep">{title}</h3>
                    <p className="mt-1 leading-relaxed text-ink-soft">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Closing call to action ─────────────────────────── */}
        <section className="w-full px-6 py-20">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 rounded-[2rem] border-2 border-deep bg-deep px-8 py-14 text-center shadow-[8px_8px_0_0_var(--color-teal-500)]">
            <h2 className="font-display text-3xl font-bold leading-tight text-white sm:text-4xl">
              Got an idea? Put it on paper today.
            </h2>
            <p className="max-w-md text-lg leading-relaxed text-white/80">
              It takes a few minutes to answer the questions, and about a minute for the plan to be written.
            </p>
            <Link href="#start" className="btn-chunk rounded-xl bg-marigold px-7 py-3 text-base hover:bg-marigold">
              <ArrowUp size={18} strokeWidth={2.5} />
              Start my plan
            </Link>
          </div>
        </section>
      </main>

      <AppFooter />
    </div>
  );
}
