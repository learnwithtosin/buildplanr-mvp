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
  pages: QuestionnairePage[];
}

type PageState =
  | { status: "loading" }
  | { status: "ready"; planId: string; pages: QuestionnairePage[] }
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
        !Array.isArray(parsed.pages) ||
        parsed.pages.length === 0
      ) {
        setState({
          status: "error",
          message: "Questionnaire data is invalid. Please start over.",
        });
        return;
      }

      setState({ status: "ready", planId: parsed.planId, pages: parsed.pages });
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
    <div className="flex min-h-screen flex-col bg-[#ffffff]">
      <AppHeader />

      {/* ── Main ─────────────────────────────────────────────── */}
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12 mt-10">
        {state.status === "loading" && (
          <div className="flex items-center justify-center py-24">
            <span className="text-sm text-[#122625]">
              Loading your questionnaire…
            </span>
          </div>
        )}

        {state.status === "error" && (
          <div className="flex flex-col gap-4">
            <InlineError message={state.message} />
            <Link
              href="/"
              className="self-start text-sm font-medium text-[#122625] underline underline-offset-2"
            >
              ← Back to home
            </Link>
          </div>
        )}

        {state.status === "ready" && (
          <>
            <div className="mb-10">
              <h1 className="text-2xl font-semibold tracking-tight text-[#122625]">
                Tell us about your business
              </h1>
              <p className="mt-2 text-sm text-zinc-500">
                Answer the questions below so we can tailor your Nigerian
                business plan.
              </p>
            </div>

            <QuestionnaireForm
              planId={state.planId}
              pages={state.pages}
              onSuccess={handleSuccess}
            />
          </>
        )}
      </main>
    </div>
  );
}
