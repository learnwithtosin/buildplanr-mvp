import type { PlanContent } from "types"; // ⚠️ confirm this matches packages/types' actual name

/**
 * TEMPORARY fixture — only used as a fallback until BE-C3 (real plan
 * generation) exists and every completed BusinessPlan has real content.
 * Safe to delete once BE-C3 lands.
 */
export const samplePlanContent: PlanContent = {
  executiveSummary: "BuildPlanr Sample Bakery is a home-based bakery serving Jos North with fresh bread and pastries.",
  businessDescription: "A small-scale bakery producing bread, meat pies, and cakes for local retail and pre-orders.",
  marketAnalysis: "Demand for fresh baked goods in Jos North is strong, with limited direct competition in the immediate area.",
  marketingStrategy: "Word-of-mouth, WhatsApp Business catalog, and local market stall presence on weekends.",
  operationsPlan: "Baking done at a home kitchen initially, scaling to a rented space once order volume justifies it.",
  financialPlan: "Bootstrapped with founder savings; break-even expected within the first four months of operation.",
  startupCostEstimate: "Approximately ₦350,000 covering an oven, baking equipment, initial ingredients, and CAC registration.",
  operatingCostEstimate: "Approximately ₦80,000 per month in ingredients, gas, and packaging.",
  breakEvenEstimate: "Break-even at roughly 450 units sold per month at current pricing.",
  cashFlowProjection: "Positive cash flow expected from month two, assuming consistent weekend market sales.",
  regulatoryConsiderations: "Requires CAC business name registration and NAFDAC food handling compliance for packaged goods.",
  risks: "Ingredient price volatility and inconsistent power supply affecting baking schedules.",
  recommendations: "Register with CAC early and secure a backup power source before scaling production.",
};