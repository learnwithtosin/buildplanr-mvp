"use client";

import { useState } from "react";
import { downloadPlanPdf, ApiError } from "@/lib/api";

interface Props {
  /** The plan ID to download. */
  planId: string;
}

/**
 * "Download PDF" button for a completed business plan.
 *
 * Flow:
 *  1. Calls GET /api/business-plans/:id/export/pdf via downloadPlanPdf().
 *  2. Receives a Blob, creates an object URL, clicks a hidden <a> to trigger
 *     a real browser download, then immediately revokes the URL.
 *  3. Shows a loading/disabled state while the server renders the PDF.
 *  4. Displays a clear per-status error message on failure.
 *
 * No new dependencies — plain fetch + Blob API only.
 */
export default function DownloadPdfButton({ planId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setError(null);
    setLoading(true);

    try {
      const blob = await downloadPlanPdf(planId);

      // Build a sensible filename: business-plan-<planId-prefix>.pdf
      const shortId = planId.slice(0, 8);
      const filename = `business-plan-${shortId}.pdf`;

      // Trigger the browser download without navigating away.
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 0);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleDownload}
        disabled={loading}
        aria-busy={loading}
        className="inline-flex items-center gap-2 rounded-full bg-green-700 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-green-600 dark:hover:bg-green-700"
      >
        {loading ? (
          <>
            <span
              aria-hidden="true"
              className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
            />
            Preparing PDF…
          </>
        ) : (
          <>
            <svg
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"
              />
            </svg>
            Download PDF
          </>
        )}
      </button>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
