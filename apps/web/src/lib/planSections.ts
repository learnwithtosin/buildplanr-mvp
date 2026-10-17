/**
 * Display names for the 13 sections of a generated plan, in document order.
 * Mirrors the keys of PlanContent in packages/types; one list so the landing
 * page, the generating screen and the plan page never drift apart.
 */
export const PLAN_SECTIONS = [
  "Executive summary",
  "Business description",
  "Market analysis",
  "Marketing strategy",
  "Operations plan",
  "Financial plan",
  "Startup costs",
  "Operating costs",
  "Break-even",
  "Cash flow",
  "Regulatory",
  "Risks",
  "Recommendations",
] as const;
