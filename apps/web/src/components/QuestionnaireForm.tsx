"use client";

import { useState, FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, ChevronDown, Sparkles, X } from "lucide-react";
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
  const busy = fetchingNextPage || submitting;

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
      <nav aria-label="Questionnaire progress" className="flex flex-col gap-3">
        <ol className="flex items-center">
          {Array.from({ length: DISPLAYED_TOTAL_PAGES }, (_, i) => {
            const reached = i <= pageIndex;
            const completed = i < pageIndex;
            return (
              <li key={i} className="flex flex-1 items-center last:flex-none">
                <span
                  aria-current={i === pageIndex ? "step" : undefined}
                  className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 font-display text-sm font-bold transition-all duration-300 ${
                    completed
                      ? "border-deep bg-deep text-white"
                      : reached
                        ? "border-deep bg-teal-500 text-deep shadow-[3px_3px_0_0_var(--color-deep)]"
                        : "border-line bg-white text-ink-soft"
                  }`}
                >
                  {completed ? <Check size={16} strokeWidth={3.5} /> : i + 1}
                  {i === pageIndex && (
                    <span className="pulse-ring pointer-events-none absolute inset-0 rounded-full border-2 border-teal-500" />
                  )}
                </span>
                {i < DISPLAYED_TOTAL_PAGES - 1 && (
                  <span className="mx-2 h-1 flex-1 overflow-hidden rounded-full bg-line">
                    <span
                      className={`block h-full origin-left rounded-full bg-deep transition-transform duration-500 ${
                        completed ? "scale-x-100" : "scale-x-0"
                      }`}
                    />
                  </span>
                )}
              </li>
            );
          })}
        </ol>
        <p className="text-sm text-ink-soft">
          Page {pageIndex + 1} of {DISPLAYED_TOTAL_PAGES}
          <span className="mx-2 text-line">|</span>
          <span className="font-semibold text-deep">{currentPage.title}</span>
        </p>
      </nav>

      {/* ── Current page's questions ─────────────────────────── */}
      <div key={pageIndex} className="animate-rise flex flex-col gap-7">
        {currentPage.questions.map((question, index) => (
          <div key={question.id} className="flex flex-col gap-3">
            <label htmlFor={question.id} className="flex gap-3 text-base font-semibold leading-snug text-deep">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-kraft text-xs font-bold">
                {index + 1}
              </span>
              <span>{question.label}</span>
            </label>

            {question.type === "boolean" && (
              <div className="grid grid-cols-2 gap-3 sm:max-w-sm" role="group" aria-label={question.label}>
                {(["Yes", "No"] as const).map((opt) => {
                  const val = opt === "Yes";
                  const selected = answers[question.id] === val;
                  const Icon = val ? Check : X;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleBoolean(question.id, val)}
                      aria-pressed={selected}
                      className={`flex items-center justify-center gap-2 rounded-xl border-2 px-5 py-3 text-base font-bold transition-all duration-200 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-marigold ${
                        selected
                          ? "border-deep bg-deep text-white shadow-[4px_4px_0_0_var(--color-teal-500)]"
                          : "border-line bg-white text-deep hover:-translate-y-0.5 hover:border-deep"
                      }`}
                    >
                      <Icon size={16} strokeWidth={3.5} className={selected ? "animate-pop" : "opacity-40"} />
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
                className="field resize-none"
              />
            )}

            {question.type === "select" && (
              <div className="relative">
                <select
                  id={question.id}
                  value={answers[question.id] as string}
                  onChange={(e) => handleText(question.id, e.target.value)}
                  required
                  className="field cursor-pointer appearance-none pr-11"
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
                <ChevronDown
                  size={18}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-deep"
                />
              </div>
            )}

            {/* Name-suggestion action — only on the fixed business_name field,
                and only offered while the founder hasn't said "Yes" to
                already having a name. */}
            {question.id === FIXED_QUESTION_IDS.name &&
              answers[FIXED_QUESTION_IDS.hasName] !== true && (
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={handleSuggestNames}
                    disabled={suggesting}
                    className="btn-ghost self-start rounded-full px-4 py-1.5 text-sm"
                  >
                    <Sparkles size={15} className={suggesting ? "animate-spin" : ""} />
                    {suggesting ? "Thinking of names…" : "Suggest names for me"}
                  </button>

                  {suggestionError && <InlineError message={suggestionError} />}

                  {suggestions !== null && (
                    <div className="flex flex-wrap gap-2">
                      {suggestions.map((name, i) => {
                        const picked = answers[FIXED_QUESTION_IDS.name] === name;
                        return (
                          <button
                            key={name}
                            type="button"
                            onClick={() => handlePickSuggestion(name)}
                            aria-pressed={picked}
                            style={{ animationDelay: `${i * 70}ms` }}
                            className={`animate-pop rounded-full border-2 px-4 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-marigold ${
                              picked
                                ? "border-deep bg-teal-500 text-deep"
                                : "border-line bg-white text-deep hover:border-deep hover:bg-mist"
                            }`}
                          >
                            {name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
          </div>
        ))}
      </div>

      {error && <InlineError message={error} className="animate-pop" />}

      {/* While the next page is being written from the answers just given. */}
      {fetchingNextPage && (
        <div role="status" className="flex flex-col gap-2 rounded-xl border-2 border-dashed border-teal-500 bg-mist p-4">
          <p className="text-sm font-semibold text-deep">Writing your next questions from what you just told us…</p>
          <div className="shimmer h-2.5 w-full rounded-full" />
          <div className="shimmer h-2.5 w-2/3 rounded-full" />
        </div>
      )}

      {/* ── Navigation ───────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        {!isFirstPage ? (
          <button
            type="button"
            onClick={handleBack}
            disabled={busy}
            className="btn-ghost rounded-xl px-5 py-3 text-sm"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        ) : (
          <span />
        )}

        {!isFinalStep && (
          <button
            type="button"
            onClick={handleNext}
            disabled={fetchingNextPage}
            className="btn-chunk rounded-xl px-7 py-3 text-base"
          >
            {fetchingNextPage ? (
              <>
                <span
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin rounded-full border-2 border-deep/30 border-t-deep"
                />
                Writing…
              </>
            ) : (
              <>
                Next
                <ArrowRight size={18} strokeWidth={2.5} />
              </>
            )}
          </button>
        )}

        {isFinalStep && (
          <button type="submit" disabled={submitting} className="btn-chunk rounded-xl bg-marigold px-7 py-3 text-base hover:bg-marigold">
            {submitting ? (
              <>
                <span
                  aria-hidden="true"
                  className="h-4 w-4 animate-spin rounded-full border-2 border-deep/30 border-t-deep"
                />
                Starting your plan…
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Generate my plan
              </>
            )}
          </button>
        )}
      </div>
    </form>
  );
}
