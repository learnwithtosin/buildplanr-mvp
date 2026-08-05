/**
 * Shared inline error message, used near the form/action it relates to
 * (idea intake, questionnaire submission, plan-status polling, etc.) —
 * not a global/page-level error boundary. Next.js's default `error.tsx`
 * already covers truly unexpected crashes; this is for expected,
 * recoverable failures the user can act on (fix input, retry, wait).
 */

export interface InlineErrorProps {
  /** User-facing error message. */
  message: string;
  /** Optional extra classes, e.g. to adjust spacing in a specific layout. */
  className?: string;
}

export default function InlineError({ message, className }: InlineErrorProps) {
  return (
    <p
      role="alert"
      className={`rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-white/20 dark:text-red-700 ${className ?? ""}`}
    >
      {message}
    </p>
  );
}