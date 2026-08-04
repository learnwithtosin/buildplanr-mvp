import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";

/**
 * Per-IP rate limiter for POST /api/questionnaire.
 * docs/API.md lists 429 as a possible status for this endpoint.
 *
 * Keyed by IP (express-rate-limit's default keyGenerator uses req.ip),
 * window/limit are conservative defaults for an AI-backed endpoint and are
 * overridable via env vars without a code change.
 */
export const questionnaireRateLimiter = rateLimit({
  windowMs: Number(process.env["QUESTIONNAIRE_RATE_LIMIT_WINDOW_MS"] ?? 60_000),
  limit: Number(process.env["QUESTIONNAIRE_RATE_LIMIT_MAX"] ?? 10),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({ error: "Too many requests. Please try again later." });
  },
});

/**
 * Per-IP rate limiter for POST /api/business-plans.
 * docs/API.md lists 429 as a possible status for this endpoint.
 * Same pattern and defaults as the questionnaire limiter; overridable via
 * env vars without a code change. Not applied to the GET polling endpoint —
 * polling is expected to be frequent.
 */
export const businessPlanRateLimiter = rateLimit({
  windowMs: Number(process.env["BUSINESS_PLAN_RATE_LIMIT_WINDOW_MS"] ?? 60_000),
  limit: Number(process.env["BUSINESS_PLAN_RATE_LIMIT_MAX"] ?? 10),
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req: Request, res: Response) => {
    res.status(429).json({ error: "Too many requests. Please try again later." });
  },
});
