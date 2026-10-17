import Link from "next/link";
import { LogoMark } from "@/components/Illustrations";

export default function AppFooter() {
  return (
    <footer className="border-t-2 border-deep bg-white">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-6 py-8 text-center sm:flex-row sm:text-left">
        <Link href="/" className="flex items-center gap-2">
          <LogoMark className="h-7 w-7" />
          <span className="font-display font-bold text-deep">BuildPlanr</span>
        </Link>
        <p className="max-w-md text-sm leading-relaxed text-ink-soft">
          Plans are drafted with AI from your answers and public Nigerian sources. Check
          regulatory details with the agency before you act on them.
        </p>
      </div>
    </footer>
  );
}
