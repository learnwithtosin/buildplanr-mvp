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
