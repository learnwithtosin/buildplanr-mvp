/**
 * Shared top navigation header used across all app pages.
 * Keeps the BuildPlanr brand mark consistent in one place.
 */
export default function AppHeader() {
  return (
    <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
      <a
        href="/"
        className="text-lg font-semibold text-green-700 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
      >
        BuildPlanr
      </a>
    </header>
  );
}
