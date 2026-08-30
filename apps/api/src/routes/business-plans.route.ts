import { Router } from "express";
import {
  postBusinessPlan,
  getBusinessPlan,
  exportBusinessPlanPdf,
  exportBusinessPlanDocx,
  postNameSuggestions,
  postNextPage,
} from "../controllers/business-plans.controller";
import { businessPlanRateLimiter, questionnaireRateLimiter } from "../middleware/rate-limit.js";

const router = Router();

router.post("/", businessPlanRateLimiter, postBusinessPlan);
// Registered before "/:id" so the export/name-suggestions/next-page paths
// never fall through to the status handler (":id" only matches a single
// segment, but explicit ordering keeps intent obvious).
router.get("/:id/export/pdf", exportBusinessPlanPdf);
router.get("/:id/export/docx", exportBusinessPlanDocx);
// Same rate limiter as questionnaire generation — this is an AI call of
// similar cost/shape, not a plain CRUD write.
router.post("/:id/name-suggestions", questionnaireRateLimiter, postNameSuggestions);
router.post("/:id/next-page", questionnaireRateLimiter, postNextPage);
router.get("/:id", getBusinessPlan);

export default router;
