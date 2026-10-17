import Link from "next/link";
import { LogoMark } from "@/components/Illustrations";

export default function AppHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-30 px-4 pt-4">
      <div className="mx-auto flex max-w-5xl items-center justify-between rounded-full border-2 border-deep bg-white/90 py-2 pl-3 pr-3 shadow-[3px_3px_0_0_var(--color-deep)] backdrop-blur sm:pl-4">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-full focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-marigold"
        >
          <LogoMark className="h-8 w-8" />
          <span className="font-display text-lg font-bold text-deep">
            BuildPlanr
          </span>
        </Link>

        <Link
          href="/#start"
          className="btn-chunk rounded-full px-4 py-1.5 text-sm shadow-[2px_2px_0_0_var(--color-deep)]"
        >
          Start a plan
        </Link>
      </div>
    </header>
  );
}
