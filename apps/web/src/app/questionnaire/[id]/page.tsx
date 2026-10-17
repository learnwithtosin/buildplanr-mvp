"use client";

/**
 * /questionnaire/[id]
 *
 * Reads the questionnaire state (planId + 3 pages) that was stored in
 * sessionStorage by the idea-intake page under the key
 * `questionnaire:<planId>`.  If no state is found (e.g. direct URL
 * hit or session expired) a friendly error is shown with a link back
 * to the home page.
 *
 * On successful submission, navigates to /plan/[planId].
 */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { QuestionnairePage } from "types";
import AppHeader from "@/components/AppHeader";
import QuestionnaireForm from "@/components/QuestionnaireForm";
import InlineError from "@/components/InlineError";

interface StoredQuestionnaire {
  planId: string;
  page: QuestionnairePage;
}

type PageState =
  | { status: "loading" }
  | { status: "ready"; planId: string; page: QuestionnairePage }
  | { status: "error"; message: string };

const SESSION_KEY_PREFIX = "questionnaire:";

export default function QuestionnairePage() {
  const params = useParams();
  const router = useRouter();
  const planId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [state, setState] = useState<PageState>({ status: "loading" });

  useEffect(() => {
    if (!planId) {
      setState({ status: "error", message: "No plan ID found in the URL." });
      return;
    }

    try {
      const raw = sessionStorage.getItem(`${SESSION_KEY_PREFIX}${planId}`);
      if (!raw) {
        setState({
          status: "error",
          message: "Questionnaire session not found. Please start over.",
        });
        return;
      }

      const parsed: StoredQuestionnaire = JSON.parse(raw);

      if (!parsed.planId || !parsed.page) {
        setState({
          status: "error",
          message: "Questionnaire data is invalid. Please start over.",
        });
        return;
      }

      setState({ status: "ready", planId: parsed.planId, page: parsed.page });
    } catch {
      setState({
        status: "error",
        message: "Could not load the questionnaire. Please start over.",
      });
    }
  }, [planId]);

  function handleSuccess(resultPlanId: string) {
    // Clean up session storage after a successful submission.
    if (planId) {
      sessionStorage.removeItem(`${SESSION_KEY_PREFIX}${planId}`);
    }
    router.push(`/plan/${resultPlanId}`);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />

      {/* ── Main ─────────────────────────────────────────────── */}
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-28 sm:px-6">
        {state.status === "loading" && (
          <div role="status" className="ink-card flex flex-col gap-4 rounded-3xl p-8">
            <p className="font-display font-bold text-deep">Loading your questionnaire…</p>
            <div className="shimmer h-3 w-full rounded-full" />
            <div className="shimmer h-3 w-4/5 rounded-full" />
            <div className="shimmer h-3 w-3/5 rounded-full" />
          </div>
        )}

        {state.status === "error" && (
          <div className="ink-card flex flex-col gap-4 rounded-3xl p-8">
            <InlineError message={state.message} />
            <Link href="/" className="btn-ghost self-start rounded-xl px-5 py-2.5 text-sm">
              Back to home
            </Link>
          </div>
        )}

        {state.status === "ready" && (
          <>
            <div className="mb-8">
              <h1 className="font-display text-3xl font-bold tracking-tight text-deep">
                Tell us about your business
              </h1>
              <p className="mt-2 leading-relaxed text-ink-soft">
                Your answers shape the plan, so be as specific as you can.
              </p>
            </div>

            <div className="ink-card rounded-3xl p-6 sm:p-8">
              <QuestionnaireForm
                planId={state.planId}
                initialPage={state.page}
                onSuccess={handleSuccess}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
