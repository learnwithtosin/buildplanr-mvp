"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ApiError, postQuestionnaire } from "@/lib/api";
import InlineError from "@/components/InlineError";

const MIN_LENGTH = 10;
const MAX_LENGTH = 500;
const ERROR_DISMISS_MS = 5000;

/** True when the trimmed input has no letters at all — e.g. "1234567890" or "!!!@@@###". */
function hasNoLetters(value: string): boolean {
  return value.trim().length > 0 && !/[a-zA-Z]/.test(value);
}

export default function IdeaForm() {
  const router = useRouter();
  const [businessIdea, setBusinessIdea] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = businessIdea.trim();
  const length = trimmed.length;
  const isTooShort = length > 0 && length < MIN_LENGTH;
  const isTooLong = length > MAX_LENGTH;
  const isMeaningless = hasNoLetters(trimmed);
  const isValid = length >= MIN_LENGTH && length <= MAX_LENGTH && !isMeaningless;

  // Auto-dismiss the error a few seconds after it appears. Re-runs whenever
  // `error` changes, so a fresh error always gets its own full countdown
  // instead of being cut short by a timer left over from a previous one.
  useEffect(() => {
    if (!error) return;

    const timeoutId = setTimeout(() => {
      setError(null);
    }, ERROR_DISMISS_MS);

    return () => clearTimeout(timeoutId);
  }, [error]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValid) {
      setError(
        isTooShort
          ? `Tell us a bit more at least ${MIN_LENGTH} characters not just numbers or symbols.`
          : isTooLong
            ? `That's a lot! Keep it under ${MAX_LENGTH} characters.`
            : "Please describe your idea in words not just numbers or symbols.",
      );
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await postQuestionnaire({
        businessIdea: trimmed,
      });

      // Store the questionnaire so the next page can read it.
      sessionStorage.setItem(
        `questionnaire:${response.planId}`,
        JSON.stringify({
          planId: response.planId,
          page: response.page,
        }),
      );

      router.push(`/questionnaire/${response.planId}`);
    } catch (err) {
      setIsSubmitting(false);
      // postQuestionnaire always throws ApiError (network failures included),
      // but guard for any truly unexpected throw anyway.
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again.",
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-xl flex-col gap-3">
      <label htmlFor="businessIdea" className="text-sm font-bold text-[#6d7f7d] uppercase">
        Describe your business idea
      </label>

      <textarea
        id="businessIdea"
        name="businessIdea"
        rows={4}
        value={businessIdea}
        onChange={(event) => setBusinessIdea(event.target.value)}
        disabled={isSubmitting}
        placeholder="e.g. A mobile car wash service for busy professionals in Lagos..."
        className="w-full rounded-lg border border-[#c1edf0] p-3 text-base text-[#122625] placeholder:text-[#aeb9b8] focus:border-[#16bfcc] focus:ring-1 focus:ring-[#16bfcc] focus:outline-none disabled:opacity-60 bg-[#effbfa]"
      />
      {error && <InlineError message={error} />}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className={`text-sm font-semibold text-[#6d7f7d] ${isTooLong || isMeaningless ? "text-red-600" : ""}`}>
          {length}/{MAX_LENGTH} characters
        </span>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-[#0ca7b2] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#12a8b0] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? "Generating your questionnaire…" : "Get started"}
          {!isSubmitting && (
            <svg
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          )}
        </button>
      </div>
    </form>
  );
}