"use client";

/**
 * /questionnaire/[id]
 *
 * Reads the questionnaire state (planId + questions array) that was
 * stored in sessionStorage by the idea-intake page under the key
 * `questionnaire:<planId>`.  If no state is found (e.g. direct URL
 * hit or session expired) a friendly error is shown with a link back
 * to the home page.
 *
 * On successful submission, navigates to /plan/[planId].
 */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Question } from "types";
import AppHeader from "@/components/AppHeader";
import QuestionnaireForm from "@/components/QuestionnaireForm";

interface StoredQuestionnaire {
  planId: string;
  questions: Question[];
}

type PageState =
  | { status: "loading" }
  | { status: "ready"; planId: string; questions: Question[] }
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

      if (
        !parsed.planId ||
        !Array.isArray(parsed.questions) ||
        parsed.questions.length === 0
      ) {
        setState({
          status: "error",
          message: "Questionnaire data is invalid. Please start over.",
        });
        return;
      }

      setState({ status: "ready", planId: parsed.planId, questions: parsed.questions });
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
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <AppHeader />

      {/* ── Main ─────────────────────────────────────────────── */}
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
        {state.status === "loading" && (
          <div className="flex items-center justify-center py-24">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              Loading your questionnaire…
            </span>
          </div>
        )}

        {state.status === "error" && (
          <div className="flex flex-col gap-4">
            <p
              role="alert"
              className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400"
            >
              {state.message}
            </p>
            <a
              href="/"
              className="self-start text-sm font-medium text-green-700 underline underline-offset-2 hover:text-green-800 dark:text-green-400"
            >
              ← Back to home
            </a>
          </div>
        )}

        {state.status === "ready" && (
          <>
            <div className="mb-10">
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                Tell us about your business
              </h1>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                Answer the questions below so we can tailor your Nigerian
                business plan.
              </p>
            </div>

            <QuestionnaireForm
              planId={state.planId}
              questions={state.questions}
              onSuccess={handleSuccess}
            />
          </>
        )}
      </main>
    </div>
  );
}
