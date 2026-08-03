import { Router } from "express";
import { postQuestionnaire } from "../controllers/questionnaire.controller.js";
import { questionnaireRateLimiter } from "../middleware/rate-limit.js";

export const questionnaireRouter = Router();

questionnaireRouter.post("/", questionnaireRateLimiter, postQuestionnaire);
