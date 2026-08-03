"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ApiError, postQuestionnaire } from "@/lib/api";

const MIN_LENGTH = 10;
const MAX_LENGTH = 500;

export default function IdeaForm() {
  const router = useRouter();
  const [businessIdea, setBusinessIdea] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const length = businessIdea.trim().length;
  const isTooShort = length > 0 && length < MIN_LENGTH;
  const isTooLong = length > MAX_LENGTH;
  const isValid = length >= MIN_LENGTH && length <= MAX_LENGTH;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValid) {
      setError(
        isTooShort
          ? `Tell us a bit more — at least ${MIN_LENGTH} characters.`
          : `That's a lot! Keep it under ${MAX_LENGTH} characters.`,
      );
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const { planId } = await postQuestionnaire({ businessIdea: businessIdea.trim() });
      router.push(`/questionnaire/${planId}`);
    } catch (err) {
      setIsSubmitting(false);
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-xl flex-col gap-3">
      <label htmlFor="businessIdea" className="text-sm font-medium text-zinc-700">
        Describe your business idea
      </label>

      <textarea
        id="businessIdea"
        name="businessIdea"
        rows={6}
        value={businessIdea}
        onChange={(event) => setBusinessIdea(event.target.value)}
        disabled={isSubmitting}
        placeholder="e.g. A mobile car wash service for busy professionals in Lagos..."
        className="w-full rounded-lg border border-zinc-300 p-3 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none disabled:opacity-60"
      />

      <div className="flex items-center justify-between text-sm text-zinc-500">
        <span className={isTooLong ? "text-red-600" : undefined}>
          {length}/{MAX_LENGTH} characters
        </span>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting || !isValid}
        className="w-full rounded-lg bg-zinc-900 px-5 py-3 text-base font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Generating your questionnaire…" : "Get started"}
      </button>
    </form>
  );
}
