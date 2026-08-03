import type { NextFunction, Request, Response } from "express";
import { questionnaireRequestSchema } from "../validation/questionnaire.schema.js";
import { createQuestionnaire } from "../services/questionnaire.service.js";
import { ValidationError } from "../errors/app-error.js";

export async function postQuestionnaire(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const parseResult = questionnaireRequestSchema.safeParse(req.body);
  if (!parseResult.success) {
    next(new ValidationError(parseResult.error.issues.map((i) => i.message).join("; ")));
    return;
  }

  try {
    const result = await createQuestionnaire(parseResult.data.businessIdea);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}
