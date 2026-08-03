import type { Request, Response } from "express";
import { prisma } from "../config/prisma"; // ⚠️ confirm named export is `prisma`
import { buildPlanPdf } from "../services/export-pdf.service";
import { buildPlanDocx } from "../services/export-docx.service";
import { samplePlanContent } from "../fixtures/sample-plan-content";
import type { PlanContent } from "types";

/**
 * GET /api/business-plans/:id/export/pdf
 *
 * TEMPORARY fallback: BE-C3 (real plan generation) isn't implemented yet,
 * so a completed plan without stored content falls back to
 * samplePlanContent. Real content always wins when present. Once BE-C3
 * lands, every completed plan will have real content and this fallback
 * becomes dead code — safe to delete along with the fixture file.
 */
export async function exportBusinessPlanPdf(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);

  try {
    const plan = await prisma.businessPlan.findUnique({
      where: { id },
      select: { status: true, content: true },
    });

    if (!plan) {
      res.status(404).json({ error: "Plan not found" });
      return;
    }

    if (plan.status !== "completed") {
      res.status(409).json({ error: "Plan is not completed yet" });
      return;
    }

    const content = (plan.content as PlanContent | null) ?? samplePlanContent;
    const doc = buildPlanPdf(content);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=business-plan.pdf");
    res.setHeader("Cache-Control", "no-store");
    doc.pipe(res);
  } catch {
    res.status(500).json({ error: "Failed to generate PDF" });
  }
}

/**
 * GET /api/business-plans/:id/export/docx
 * Same TEMPORARY fallback pattern as the PDF export above.
 */
export async function exportBusinessPlanDocx(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id);

  try {
    const plan = await prisma.businessPlan.findUnique({
      where: { id },
      select: { status: true, content: true },
    });

    if (!plan) {
      res.status(404).json({ error: "Plan not found" });
      return;
    }

    if (plan.status !== "completed") {
      res.status(409).json({ error: "Plan is not completed yet" });
      return;
    }

    const content = (plan.content as PlanContent | null) ?? samplePlanContent;
    const buffer = await buildPlanDocx(content);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.setHeader("Content-Disposition", "attachment; filename=business-plan.docx");
    res.setHeader("Cache-Control", "no-store");
    res.send(buffer);
  } catch (error) {
    console.error("DOCX export failed:", error);
    res.status(500).json({ error: "Failed to generate DOCX" });
  }

}