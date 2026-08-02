import express from "express";
import cors from "cors";

import { env } from "./config/env";
import healthRouter from "./routes/health.route";

const app = express();

app.use(
  cors({
    origin: env.CORS_ORIGIN,
  })
);

app.use(express.json());

app.use("/health", healthRouter);

export default app;