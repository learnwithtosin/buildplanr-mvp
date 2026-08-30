import type { NextFunction, Request, Response } from "express";
import { prisma } from "../config/prisma"; // ⚠️ confirm named export is `prisma`
import { buildPlanPdf } from "../services/export-pdf.service";
import { buildPlanDocx } from "../services/export-docx.service";
import type { PlanContent } from "types";
import { z } from "zod";
import { businessPlanRequestSchema, nameSuggestionsRequestSchema } from "../validation/business-plan.schema.js";
import {
  getBusinessPlanStatus,
  submitAnswersAndStartGeneration,
} from "../services/plan-generation.service.js";
import { suggestBusinessNames } from "../services/name-suggestions.service.js";
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
 * Requires the plan to be completed AND to have real stored content —
 * a completed plan without content is a data-integrity bug (generation
 * always writes content before marking a plan "completed"; see
 * plan-generation.service.ts), so it's surfaced as a 500 rather than
 * silently served as fabricated sample content.
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

    if (plan.content === null) {
      res.status(500).json({ error: "Plan is marked completed but has no stored content" });
      return;
    }

    const content = plan.content as PlanContent;
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
 * Same real-content-required behavior as the PDF export above.
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

    if (plan.content === null) {
      res.status(500).json({ error: "Plan is marked completed but has no stored content" });
      return;
    }

    const content = plan.content as PlanContent;
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

const nameSuggestionsPlanIdParamSchema = z.string().uuid();

/**
 * POST /api/business-plans/:id/name-suggestions
 * Generates 3 candidate business names from the plan's stored businessIdea
 * plus whatever industryCategory/region the founder has already picked on
 * page 1 (both optional in the body — this can be called before either is
 * answered). A non-UUID id maps to 404, matching the GET endpoint above.
 */
export async function postNameSuggestions(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const idResult = nameSuggestionsPlanIdParamSchema.safeParse(req.params["id"]);
  if (!idResult.success) {
    next(new NotFoundError("Plan not found"));
    return;
  }

  const parseResult = nameSuggestionsRequestSchema.safeParse(req.body ?? {});
  if (!parseResult.success) {
    next(new ValidationError(parseResult.error.issues.map((i) => i.message).join("; ")));
    return;
  }

  try {
    const result = await suggestBusinessNames(
      idResult.data,
      parseResult.data.industryCategory,
      parseResult.data.region,
    );
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}