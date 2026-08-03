// import express from "express";
// import cors from "cors";

// import { env } from "./config/env";
// import healthRouter from "./routes/health.route";

// const app = express();

// app.use(
//   cors({
//     origin: env.CORS_ORIGIN,
//   })
// );

// app.use(express.json());

// app.use("/health", healthRouter);

// export default app;


import express, { type Express } from "express";
import cors from "cors";
import { questionnaireRouter } from "./routes/questionnaire.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";

export function createApp(): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use("/api/questionnaire", questionnaireRouter);

  // Plan generation, status polling, and export endpoints are not
  // implemented yet — only the questionnaire endpoint above is wired up.

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}