"use client";

import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { ApiError, postQuestionnaire } from "@/lib/api";
import InlineError from "@/components/InlineError";

const MIN_LENGTH = 10;
const MAX_LENGTH = 500;
const ERROR_DISMISS_MS = 5000;

/** Ideas typed into the empty box as a placeholder, and offered as one-tap starters. */
const EXAMPLES = [
  "A mobile car wash for busy professionals in Lagos",
  "A bakery taking cake and small-chops orders in Jos",
  "A POS and airtime shop near a university campus",
  "A poultry farm supplying eggs to restaurants in Ibadan",
  "A fashion brand selling ankara pieces on Instagram",
] as const;

const STARTERS = [
  { label: "Car wash", idea: EXAMPLES[0] },
  { label: "Bakery", idea: EXAMPLES[1] },
  { label: "POS shop", idea: EXAMPLES[2] },
  { label: "Poultry farm", idea: EXAMPLES[3] },
  { label: "Fashion brand", idea: EXAMPLES[4] },
] as const;

/** True when the trimmed input has no letters at all — e.g. "1234567890" or "!!!@@@###". */
function hasNoLetters(value: string): boolean {
  return value.trim().length > 0 && !/[a-zA-Z]/.test(value);
}

/**
 * Types the examples into the placeholder, one after another, while the box
 * is empty and unfocused. Falls back to a still placeholder for people who
 * prefer reduced motion.
 */
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const mql = window.matchMedia(REDUCED_MOTION_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function useTypedPlaceholder(active: boolean): string {
  const [text, setText] = useState<string>(EXAMPLES[0]);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => true,
  );

  useEffect(() => {
    if (!active || reducedMotion) return;

    let exampleIndex = 0;
    let charIndex = 0;
    let deleting = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    function step() {
      const full = EXAMPLES[exampleIndex];
      if (!deleting) {
        charIndex += 1;
        setText(full.slice(0, charIndex));
        if (charIndex === full.length) {
          deleting = true;
          timeoutId = setTimeout(step, 1800);
          return;
        }
        timeoutId = setTimeout(step, 38);
      } else {
        charIndex -= 2;
        if (charIndex <= 0) {
          charIndex = 0;
          deleting = false;
          exampleIndex = (exampleIndex + 1) % EXAMPLES.length;
          setText("");
          timeoutId = setTimeout(step, 350);
          return;
        }
        setText(full.slice(0, charIndex));
        timeoutId = setTimeout(step, 16);
      }
    }

    timeoutId = setTimeout(step, 600);
    return () => clearTimeout(timeoutId);
  }, [active, reducedMotion]);

  return reducedMotion ? `e.g. ${EXAMPLES[0]}` : text;
}

export default function IdeaForm() {
  const router = useRouter();
  const [businessIdea, setBusinessIdea] = useState("");
  const [focused, setFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = businessIdea.trim();
  const length = trimmed.length;
  const isTooShort = length > 0 && length < MIN_LENGTH;
  const isTooLong = length > MAX_LENGTH;
  const isMeaningless = hasNoLetters(trimmed);
  const isValid = length >= MIN_LENGTH && length <= MAX_LENGTH && !isMeaningless;

  const placeholder = useTypedPlaceholder(businessIdea === "" && !focused);

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
          ? `Tell us a bit more: at least ${MIN_LENGTH} characters, not just numbers or symbols.`
          : isTooLong
            ? `That's a lot! Keep it under ${MAX_LENGTH} characters.`
            : "Please describe your idea in words, not just numbers or symbols.",
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
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3 text-left">
      <label htmlFor="businessIdea" className="font-display text-base font-bold text-deep">
        What do you want to start?
      </label>

      <textarea
        id="businessIdea"
        name="businessIdea"
        rows={4}
        value={businessIdea}
        onChange={(event) => setBusinessIdea(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={isSubmitting}
        placeholder={placeholder}
        className="field resize-none text-base leading-relaxed"
      />

      {/* One-tap starters, so nobody faces a blank box. */}
      <div className="flex flex-wrap items-center gap-2" aria-label="Example ideas">
        <span className="text-sm text-ink-soft">Or start from:</span>
        {STARTERS.map((starter) => (
          <button
            key={starter.label}
            type="button"
            disabled={isSubmitting}
            onClick={() => setBusinessIdea(starter.idea)}
            className="rounded-full border-2 border-line bg-white px-3 py-1 text-sm font-medium text-deep transition-all hover:-translate-y-0.5 hover:border-deep hover:bg-mist focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-marigold disabled:opacity-50"
          >
            {starter.label}
          </button>
        ))}
      </div>

      {error && <InlineError message={error} className="animate-pop" />}

      <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
        <span
          className={`text-sm font-medium tabular-nums ${
            isTooLong || isMeaningless ? "text-red-700" : "text-ink-soft"
          }`}
        >
          {length}/{MAX_LENGTH}
        </span>

        <button type="submit" disabled={isSubmitting} className="btn-chunk rounded-xl px-6 py-3 text-base">
          {isSubmitting ? (
            <>
              <span
                aria-hidden="true"
                className="h-4 w-4 animate-spin rounded-full border-2 border-deep/30 border-t-deep"
              />
              Writing your questions…
            </>
          ) : (
            <>
              Start my plan
              <ArrowRight size={18} strokeWidth={2.5} />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
