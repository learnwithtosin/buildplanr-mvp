"use client";

import { useState, FormEvent } from "react";
import type { Question, QuestionnairePage, AnswersMap } from "types";
import { FIXED_QUESTION_IDS } from "types";
import { ApiError, fetchNextQuestionnairePage, submitBusinessPlan, suggestBusinessNames } from "@/lib/api";
import InlineError from "@/components/InlineError";

interface Props {
  planId: string;
  /** Only page 1 is known upfront — pages 2-3 are fetched one at a time as each prior page is answered. */
  initialPage: QuestionnairePage;
  onSuccess: (planId: string) => void;
}

/** True for the answer types that must be a non-empty string before advancing. */
function requiresNonEmptyString(type: Question["type"]): boolean {
  return type === "text" || type === "select";
}

/** Seeds default answer values (false for boolean, "" for text/select) for a page's questions. */
function defaultAnswersFor(page: QuestionnairePage): AnswersMap {
  return Object.fromEntries(page.questions.map((q) => [q.id, q.type === "boolean" ? false : ""]));
}

/** Extracts just the given page's question id -> answer entries from the full answers map — that's all the next-page endpoint wants. */
function answersForPage(page: QuestionnairePage, answers: AnswersMap): AnswersMap {
  return Object.fromEntries(page.questions.map((q) => [q.id, answers[q.id]]));
}

/**
 * Total pages the questionnaire always ends up with (1 fixed + 2
 * AI-generated) — used only for the progress display. Completion is
 * driven by the next-page endpoint's `isLastPage` flag, not this constant.
 */
const DISPLAYED_TOTAL_PAGES = 3;

export default function QuestionnaireForm({ planId, initialPage, onSuccess }: Props) {
  // Pages are discovered one at a time — this grows as the founder answers
  // each page and the next one is generated, instead of holding all 3
  // upfront.
  const [pages, setPages] = useState<QuestionnairePage[]>([initialPage]);
  const [answers, setAnswers] = useState<AnswersMap>(() => defaultAnswersFor(initialPage));
  const [pageIndex, setPageIndex] = useState(0);
  // True once the last-known page has been confirmed (by the API) to be
  // page 3 — the point at which "Next" becomes "Generate Business Plan".
  const [lastPageReached, setLastPageReached] = useState(false);
  const [fetchingNextPage, setFetchingNextPage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Name-suggestion state, scoped to the business_name field on page 1.
  const [suggesting, setSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[] | null>(null);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  const currentPage = pages[pageIndex];
  const isFirstPage = pageIndex === 0;
  const onLastKnownPage = pageIndex === pages.length - 1;
  const isFinalStep = onLastKnownPage && lastPageReached;

  function handleBoolean(id: string, value: boolean) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function handleText(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  /** Validates every question on the given page has a value. Returns the first missing question's label, or null if all answered. */
  function findMissingAnswerLabel(page: QuestionnairePage): string | null {
    const missing = page.questions.find(
      (q) => requiresNonEmptyString(q.type) && (answers[q.id] as string).trim() === ""
    );
    return missing?.label ?? null;
  }

  async function handleNext() {
    const missingLabel = findMissingAnswerLabel(currentPage);
    if (missingLabel !== null) {
      setError(`Please answer "${missingLabel}" before continuing.`);
      return;
    }
    setError(null);

    if (!onLastKnownPage) {
      // Already have this page cached from an earlier visit (e.g. the
      // founder went Back) — just advance, no need to regenerate it.
      setPageIndex((i) => i + 1);
      return;
    }

    setFetchingNextPage(true);
    try {
      const res = await fetchNextQuestionnairePage(planId, {
        answers: answersForPage(currentPage, answers),
      });
      setPages((prev) => [...prev, res.page]);
      setAnswers((prev) => ({ ...prev, ...defaultAnswersFor(res.page) }));
      setLastPageReached(res.isLastPage);
      setPageIndex((i) => i + 1);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Couldn't load the next page. Please try again.",
      );
    } finally {
      setFetchingNextPage(false);
    }
  }

  function handleBack() {
    setError(null);
    setPageIndex((i) => Math.max(i - 1, 0));
  }

  async function handleSuggestNames() {
    setSuggestionError(null);
    setSuggesting(true);
    try {
      const categoryAnswer = answers[FIXED_QUESTION_IDS.industryCategory];
      const stateAnswer = answers[FIXED_QUESTION_IDS.state];

      const res = await suggestBusinessNames(planId, {
        ...(typeof categoryAnswer === "string" && categoryAnswer !== ""
          ? { industryCategory: categoryAnswer }
          : {}),
        ...(typeof stateAnswer === "string" && stateAnswer !== "" ? { region: stateAnswer } : {}),
      });
      setSuggestions(res.suggestions);
    } catch (err) {
      setSuggestionError(
        err instanceof ApiError ? err.message : "Couldn't generate name suggestions. Please try again.",
      );
    } finally {
      setSuggesting(false);
    }
  }

  function handlePickSuggestion(name: string) {
    handleText(FIXED_QUESTION_IDS.name, name);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    // Defensive full-questionnaire check, in case a page was somehow
    // skipped — the Next/Back flow above already validates page-by-page.
    for (const page of pages) {
      const missingLabel = findMissingAnswerLabel(page);
      if (missingLabel !== null) {
        setError(`Please answer "${missingLabel}" before submitting.`);
        setPageIndex(pages.indexOf(page));
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await submitBusinessPlan({ planId, answers });
      onSuccess(res.planId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-8">
      {/* ── Progress ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#6d7f7d]">
            Page {pageIndex + 1} of {DISPLAYED_TOTAL_PAGES}
          </span>
          <span className="text-sm font-semibold text-[#122625]">{currentPage.title}</span>
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: DISPLAYED_TOTAL_PAGES }, (_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= pageIndex ? "bg-[#16bfcc]" : "bg-zinc-200"
              }`}
            />
          ))}
        </div>
      </div>

      {/* ── Current page's questions ─────────────────────────── */}
      {currentPage.questions.map((question, index) => (
        <div key={question.id} className="flex flex-col gap-3">
          <label className="text-base font-medium text-[#122625]">
            <span className="mr-2 text-sm font-semibold text-[#122625]">
              {index + 1}.
            </span>
            {question.label}
          </label>

          {question.type === "boolean" && (
            <div className="flex gap-3">
              {(["Yes", "No"] as const).map((opt) => {
                const val = opt === "Yes";
                const selected = answers[question.id] === val;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleBoolean(question.id, val)}
                    className={`rounded-full border px-6 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#12a8b0] ${
                      selected
                        ? "border-[#16bfcc] bg-[#16bfcc] text-white"
                        : "border-zinc-300 bg-white text-zinc-700 hover:border-[#16bfcc] hover:text-[#16bfcc] dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
                    }`}
                    aria-pressed={selected}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {question.type === "text" && (
            <textarea
              id={question.id}
              value={answers[question.id] as string}
              onChange={(e) => handleText(question.id, e.target.value)}
              rows={3}
              placeholder="Your answer…"
              required
              className="w-full rounded-lg border border-[#c1edf0] bg-[#effbfa] px-4 py-3 text-sm text-zinc-800 placeholder-zinc-400 transition-colors focus:border-[#16bfcc] focus:outline-none focus:ring-1 focus:ring-[#16bfcc]"
            />
          )}

          {question.type === "select" && (
            <select
              id={question.id}
              value={answers[question.id] as string}
              onChange={(e) => handleText(question.id, e.target.value)}
              required
              className="w-full rounded-lg border border-[#c1edf0] bg-[#effbfa] px-4 py-3 text-sm text-zinc-800 transition-colors focus:border-[#16bfcc] focus:outline-none focus:ring-1 focus:ring-[#16bfcc]"
            >
              <option value="" disabled>
                Select an option…
              </option>
              {(question.options ?? []).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}

          {/* Name-suggestion action — only on the fixed business_name field,
              and only offered while the founder hasn't said "Yes" to
              already having a name. */}
          {question.id === FIXED_QUESTION_IDS.name &&
            answers[FIXED_QUESTION_IDS.hasName] !== true && (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleSuggestNames}
                  disabled={suggesting}
                  className="self-start rounded-full border border-[#16bfcc] px-4 py-1.5 text-xs font-semibold text-[#0ca7b2] transition-colors hover:bg-[#effbfa] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#12a8b0] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {suggesting ? "Thinking of names…" : "✨ Suggest names for me"}
                </button>

                {suggestionError && <InlineError message={suggestionError} />}

                {suggestions !== null && (
                  <div className="flex flex-wrap gap-2">
                    {suggestions.map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => handlePickSuggestion(name)}
                        className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#12a8b0] ${
                          answers[FIXED_QUESTION_IDS.name] === name
                            ? "border-[#16bfcc] bg-[#16bfcc] text-white"
                            : "border-zinc-300 bg-white text-zinc-700 hover:border-[#16bfcc] hover:text-[#16bfcc]"
                        }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
        </div>
      ))}

      {error && <InlineError message={error} />}

      {/* ── Navigation ───────────────────────────────────────── */}
      <div className="mt-2 flex items-center gap-3">
        {!isFirstPage && (
          <button
            type="button"
            onClick={handleBack}
            disabled={submitting || fetchingNextPage}
            className="self-start rounded-full border border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-700 transition-colors hover:border-[#16bfcc] hover:text-[#16bfcc] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#12a8b0] disabled:cursor-not-allowed disabled:opacity-60"
          >
            ← Back
          </button>
        )}

        {!isFinalStep && (
          <button
            type="button"
            onClick={handleNext}
            disabled={fetchingNextPage}
            className="self-start rounded-full bg-[#0ca7b2] px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#12a8b0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#12a8b0] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {fetchingNextPage ? "Generating your next questions…" : "Next →"}
          </button>
        )}

        {isFinalStep && (
          <button
            type="submit"
            disabled={submitting}
            className="self-start rounded-full bg-[#0ca7b2] px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#12a8b0] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#12a8b0] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Generating your plan…" : "Generate Business Plan"}
          </button>
        )}
      </div>
    </form>
  );
}
