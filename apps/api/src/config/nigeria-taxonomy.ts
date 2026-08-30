/**
 * Shared closed vocabularies for the fixed page-1 questionnaire fields
 * (industry category, state) and for KnowledgeChunk metadata (checkpoint 2's
 * ingestion pipeline tags chunks against this same CATEGORY list).
 *
 * Both sides of rag.service.ts's WHERE filters (BusinessPlan.industryCategory /
 * BusinessPlan.region, and KnowledgeChunk.category / KnowledgeChunk.region)
 * MUST draw from these same value sets, or filtering silently returns
 * nothing. This is the single source of truth for both.
 *
 * Provisional: the category list below covers the businesses we can
 * currently reason about (barbing/salon, food, retail, services, etc.).
 * Once the real Nigerian-market source material for checkpoint 2 is in
 * hand, revisit this list against what that material actually covers —
 * a category with zero KnowledgeChunk rows behind it just means retrieval
 * silently returns fewer chunks for it, not an error.
 */

export interface TaxonomyOption {
  value: string;
  label: string;
}

export const INDUSTRY_CATEGORIES: readonly TaxonomyOption[] = [
  { value: "food", label: "Food & Beverage" },
  { value: "retail", label: "Retail & Trading" },
  { value: "services", label: "Professional Services & Consulting" },
  { value: "beauty", label: "Beauty, Salon & Personal Care" },
  { value: "fashion", label: "Fashion & Tailoring" },
  { value: "agriculture", label: "Agriculture & Agro-processing" },
  { value: "tech", label: "Tech & Digital Services" },
  { value: "logistics", label: "Logistics & Transport" },
  { value: "education", label: "Education & Training" },
  { value: "health", label: "Health & Wellness" },
  { value: "construction", label: "Construction & Real Estate" },
  { value: "manufacturing", label: "Manufacturing & Production" },
  { value: "events", label: "Entertainment & Events" },
  { value: "other", label: "Other" },
] as const;

const INDUSTRY_CATEGORY_VALUES = new Set(INDUSTRY_CATEGORIES.map((c) => c.value));

export function isValidIndustryCategory(value: string): boolean {
  return INDUSTRY_CATEGORY_VALUES.has(value);
}

/** All 36 states + FCT. Values are lowercase-hyphenated slugs (e.g. "cross-river"). */
export const NIGERIAN_STATES: readonly TaxonomyOption[] = [
  { value: "abia", label: "Abia" },
  { value: "adamawa", label: "Adamawa" },
  { value: "akwa-ibom", label: "Akwa Ibom" },
  { value: "anambra", label: "Anambra" },
  { value: "bauchi", label: "Bauchi" },
  { value: "bayelsa", label: "Bayelsa" },
  { value: "benue", label: "Benue" },
  { value: "borno", label: "Borno" },
  { value: "cross-river", label: "Cross River" },
  { value: "delta", label: "Delta" },
  { value: "ebonyi", label: "Ebonyi" },
  { value: "edo", label: "Edo" },
  { value: "ekiti", label: "Ekiti" },
  { value: "enugu", label: "Enugu" },
  { value: "fct", label: "FCT (Abuja)" },
  { value: "gombe", label: "Gombe" },
  { value: "imo", label: "Imo" },
  { value: "jigawa", label: "Jigawa" },
  { value: "kaduna", label: "Kaduna" },
  { value: "kano", label: "Kano" },
  { value: "katsina", label: "Katsina" },
  { value: "kebbi", label: "Kebbi" },
  { value: "kogi", label: "Kogi" },
  { value: "kwara", label: "Kwara" },
  { value: "lagos", label: "Lagos" },
  { value: "nasarawa", label: "Nasarawa" },
  { value: "niger", label: "Niger" },
  { value: "ogun", label: "Ogun" },
  { value: "ondo", label: "Ondo" },
  { value: "osun", label: "Osun" },
  { value: "oyo", label: "Oyo" },
  { value: "plateau", label: "Plateau" },
  { value: "rivers", label: "Rivers" },
  { value: "sokoto", label: "Sokoto" },
  { value: "taraba", label: "Taraba" },
  { value: "yobe", label: "Yobe" },
  { value: "zamfara", label: "Zamfara" },
] as const;

const NIGERIAN_STATE_VALUES = new Set(NIGERIAN_STATES.map((s) => s.value));

export function isValidNigerianState(value: string): boolean {
  return NIGERIAN_STATE_VALUES.has(value);
}
