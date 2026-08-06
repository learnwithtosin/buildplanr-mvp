import Link from "next/link";

export default function AppHeader() {
  return (
    <header className="fixed z-20 w-full border-b border-zinc-200 bg-white/80 px-6 py-4 pl-10 backdrop-blur">
      <Link href="/" className="text-xl font-semibold text-[#122625]">
        Build<span className="text-[#16bfcc]">Planr</span>
      </Link>
    </header>
  );
}