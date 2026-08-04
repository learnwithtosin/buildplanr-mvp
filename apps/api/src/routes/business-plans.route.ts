import { Router } from "express";
import {
  postBusinessPlan,
  getBusinessPlan,
  exportBusinessPlanPdf,
  exportBusinessPlanDocx,
} from "../controllers/business-plans.controller";
import { businessPlanRateLimiter } from "../middleware/rate-limit.js";

const router = Router();

router.post("/", businessPlanRateLimiter, postBusinessPlan);
// Registered before "/:id" so the export paths never fall through to the
// status handler (":id" only matches a single segment, but explicit ordering
// keeps intent obvious).
router.get("/:id/export/pdf", exportBusinessPlanPdf);
router.get("/:id/export/docx", exportBusinessPlanDocx);
router.get("/:id", getBusinessPlan);

export default router;
