import type { Request, Response } from "express";
import { prisma } from "../config/prisma"; // ⚠️ confirm named export is `prisma`
import { buildPlanPdf } from "../services/export-pdf.service";
import { samplePlanContent } from "../fixtures/sample-plan-content";
import type { PlanContent } from "types"; // ⚠️ confirm this matches packages/types' actual name

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
  const id = String(req.params.id);;

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
    // No centralized error-handling middleware exists in app.ts yet, and
    // API.md requires a JSON 500 here — next() would fall through to
    // Express's default HTML error page instead. Swap this for shared
    // middleware if one gets added later.
    res.status(500).json({ error: "Failed to generate PDF" });
  }
}