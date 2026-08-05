import Link from "next/link";

/**
 * Shared top navigation header used across all app pages.
 * Keeps the BuildPlanr brand mark consistent in one place.
 */
export default function AppHeader() {
  return (
    <header className="border-b border-zinc-200 bg-transparent px-6 py-4">
      <Link
        href="/"
        className="text-lg font-semibold text-white"
      >
        BuildPlanr
      </Link>
    </header>
  );
}
