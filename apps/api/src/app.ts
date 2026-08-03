import express, { type Express } from "express";
import cors from "cors";

import { env } from "./config/env";
import healthRouter from "./routes/health.route";
import { questionnaireRouter } from "./routes/questionnaire.routes.js";
import businessPlansRouter from "./routes/business-plans.route";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";

export function createApp(): Express {
  const app = express();

  app.use(
    cors({
      origin: env.CORS_ORIGIN,
    }),
  );

  app.use(express.json());

  app.use("/health", healthRouter);
  app.use("/api/questionnaire", questionnaireRouter);
  app.use("/api/business-plans", businessPlansRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}