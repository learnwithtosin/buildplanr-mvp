"use client";

import { useState, FormEvent } from "react";
import type { Question, AnswersMap } from "types";
import { ApiError, submitBusinessPlan } from "@/lib/api";
import InlineError from "@/components/InlineError";

interface Props {
  planId: string;
  questions: Question[];
  onSuccess: (planId: string) => void;
}

export default function QuestionnaireForm({ planId, questions, onSuccess }: Props) {
  // Seed initial answers: "" for text, false for boolean.
  const [answers, setAnswers] = useState<AnswersMap>(() =>
    Object.fromEntries(
      questions.map((q) => [q.id, q.type === "boolean" ? false : ""])
    )
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleBoolean(id: string, value: boolean) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function handleText(id: string, value: string) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    // Guard: every text answer must be non-empty.
    const missing = questions.filter(
      (q) => q.type === "text" && (answers[q.id] as string).trim() === ""
    );
    if (missing.length > 0) {
      setError("Please answer all questions before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitBusinessPlan({ planId, answers });
      onSuccess(res.planId);
    } catch (err) {
      // submitBusinessPlan always throws ApiError (network failures included),
      // but guard for any truly unexpected throw anyway.
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-8">
      {questions.map((question, index) => (
        <div key={question.id} className="flex flex-col gap-3">
          <label className="text-base font-medium text-zinc-800 dark:text-zinc-100">
            <span className="mr-2 text-sm font-semibold text-green-700 dark:text-green-400">
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
                    className={`rounded-full border px-6 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 ${
                      selected
                        ? "border-green-700 bg-green-700 text-white"
                        : "border-zinc-300 bg-white text-zinc-700 hover:border-green-600 hover:text-green-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
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
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-800 placeholder-zinc-400 transition-colors focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder-zinc-500"
            />
          )}
        </div>
      ))}

      {error && <InlineError message={error} />}

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 self-start rounded-full bg-green-700 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-green-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Generating your plan…" : "Generate Business Plan"}
      </button>
    </form>
  );
}