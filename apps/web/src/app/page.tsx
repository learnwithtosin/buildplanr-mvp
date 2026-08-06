import AppHeader from "@/components/AppHeader";
import IdeaForm from "@/components/IdeaForm";

const BUBBLES = [
  { size: 18, left: "8%", duration: 16, delay: -3, opacity: 0.5, drift: 14 },
  { size: 10, left: "18%", duration: 12, delay: -8, opacity: 0.4, drift: -10 },
  { size: 26, left: "28%", duration: 20, delay: -1, opacity: 0.35, drift: 18 },
  { size: 14, left: "42%", duration: 14, delay: -6, opacity: 0.5, drift: -8 },
  { size: 22, left: "58%", duration: 18, delay: -10, opacity: 0.4, drift: 12 },
  { size: 12, left: "70%", duration: 13, delay: -4, opacity: 0.45, drift: -14 },
  { size: 30, left: "82%", duration: 22, delay: -12, opacity: 0.3, drift: 10 },
  { size: 16, left: "92%", duration: 15, delay: -7, opacity: 0.4, drift: -6 },
];

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col bg-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(55%_45%_at_50%_0%,rgba(21,128,61,0.07),transparent_70%)] dark:bg-[radial-gradient(55%_45%_at_50%_0%,rgba(74,222,128,0.06),transparent_70%)]"
      />

      <AppHeader />

      <main className="relative z-10 flex flex-col items-center justify-center overflow-hidden px-6 pb-20 pt-28">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          {BUBBLES.map((b, i) => (
            <span
              key={i}
              className="bubble absolute bottom-0 rounded-full bg-[#16bfcc]"
              style={{
                width: b.size,
                height: b.size,
                left: b.left,
                animationDuration: `${b.duration}s`,
                animationDelay: `${b.delay}s`,
                ["--bubble-opacity" as string]: b.opacity,
                ["--bubble-drift" as string]: `${b.drift}px`,
              }}
            />
          ))}
        </div>

        <div className="relative flex w-full max-w-xl flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-4 text-center">

            <span className="inline-flex items-center rounded-full border border-[#bfecef] bg-white px-5 py-2 shadow-sm">
              <span className="text-base">
                🇳🇬
              </span>

              <span className="ml-2 text-sm font-semibold italic tracking-wide text-[#129ba4]">
                Made for Nigerian founders
              </span>
            </span>

            <h1 className="text-5xl font-bold leading-[1.15] tracking-tight text-[#122625]">
              Turn your business idea into{" "}
              <span className="text-[#16bfcc]">a plan</span>
            </h1>

            <p className="max-w-lg text-lg font-medium leading-relaxed text-[#6d7f7d]">
              Describe what you want to build. We&apos;ll ask a few quick
              questions, then generate a business plan grounded in Nigerian
              market and regulatory context.
            </p>
          </div>

          <div className="w-full rounded-3xl border border-[#c1edf0] bg-transparent p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_40px_-20px_rgba(0,0,0,0.18)]">
            <IdeaForm />
          </div>
        </div>

        <div className="pt-4 text-sm font-medium text-[#122625]">
          Free to start, No card required.
        </div>
      </main>
    </div>
  );
}