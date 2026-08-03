import { Router } from "express";
import { exportBusinessPlanPdf } from "../controllers/business-plans.controller";

const router = Router();

router.get("/:id/export/pdf", exportBusinessPlanPdf);

export default router;