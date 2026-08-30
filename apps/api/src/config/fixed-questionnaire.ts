import type { Question, QuestionnairePage } from "types";
import { FIXED_QUESTION_IDS } from "types";
import { INDUSTRY_CATEGORIES, NIGERIAN_STATES } from "./nigeria-taxonomy.js";

/**
 * Page 1 of the questionnaire: fixed, deterministic, never AI-generated.
 *
 * These four fields exist because plan-generation.service.ts and
 * rag.service.ts need reliable, closed-vocabulary values for
 * industryCategory/region (used as exact-match SQL filters) and because
 * "does this business have a name yet" drives the name-suggestion flow —
 * none of that can be left to an LLM's phrasing of a free-text question.
 *
 * Ids come from packages/types' FIXED_QUESTION_IDS (shared with the
 * frontend, which needs the exact same strings to special-case rendering)
 * — re-exported here under the name this backend already imports elsewhere
 * (plan-generation.service.ts) so no other backend file needs to change.
 */
export const FIXED_PAGE_1_QUESTION_IDS = FIXED_QUESTION_IDS;

export function buildFixedPage1(): QuestionnairePage {
  // industry_category and business_state come first so the name-suggestion
  // flow (business_name, below) has real context — a category and state —
  // by the time the founder can actually use it.
  const questions: Question[] = [
    {
      id: FIXED_PAGE_1_QUESTION_IDS.industryCategory,
      label: "Which category best fits your business?",
      type: "select",
      options: INDUSTRY_CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
    },
    {
      id: FIXED_PAGE_1_QUESTION_IDS.state,
      label: "Which Nigerian state will you primarily operate in?",
      type: "select",
      options: NIGERIAN_STATES.map((s) => ({ value: s.value, label: s.label })),
    },
    {
      id: FIXED_PAGE_1_QUESTION_IDS.hasName,
      label: "Does your business already have a name?",
      type: "boolean",
    },
    {
      id: FIXED_PAGE_1_QUESTION_IDS.name,
      label:
        "What's your business name? (No name yet? Use the \"Suggest names\" option.)",
      type: "text",
    },
  ];

  return {
    page: 1,
    title: "Business Basics",
    questions,
  };
}
