import { Router } from "express";
import { exportBusinessPlanPdf, exportBusinessPlanDocx } from "../controllers/business-plans.controller";

const router = Router();

router.get("/:id/export/pdf", exportBusinessPlanPdf);
router.get("/:id/export/docx", exportBusinessPlanDocx);

export default router;