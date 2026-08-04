import type { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma"; // ⚠️ confirm named export is `prisma`
import { buildPlanPdf } from "../services/export-pdf.service";
import { buildPlanDocx } from "../services/export-docx.service";
import { samplePlanContent } from "../fixtures/sample-plan-content";
import type { PlanContent } from "types";
import { z } from "zod";
import { businessPlanRequestSchema } from "../validation/business-plan.schema.js";
import {
  getBusinessPlanStatus,
  submitAnswersAndStartGeneration,
} from "../services/plan-generation.service.js";
import { NotFoundError, ValidationError } from "../errors/app-error.js";

/**
 * POST /api/business-plans
 * Submits questionnaire answers and starts plan generation. Responds 202
 * with { planId, status: "processing" }; the client polls the GET endpoint.
 */
export async function postBusinessPlan(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const parseResult = businessPlanRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    next(new ValidationError(parseResult.error.issues.map((i) => i.message).join("; ")));
    return;
  }

  try {
    const result = await submitAnswersAndStartGeneration(
      parseResult.data.planId,
      parseResult.data.answers,
    );
    res.status(202).json(result);
  } catch (error) {
    next(error);
  }
}

const planIdParamSchema = z.string().uuid();

/**
 * GET /api/business-plans/:id
 * Single polling endpoint (docs/API.md): { status } while processing,
 * { status, content } once completed, { status, error } on failure.
 * A non-UUID id maps to 404 — the endpoint only documents 200 and 404.
 */
export async function getBusinessPlan(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const idResult = planIdParamSchema.safeParse(req.params["id"]);
  if (!idResult.success) {
    next(new NotFoundError("Plan not found"));
    return;
  }

  try {
    const result = await getBusinessPlanStatus(idResult.data);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

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