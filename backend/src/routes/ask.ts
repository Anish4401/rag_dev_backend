import { Router } from "express";

import { askController } from "../controllers/askController";
import { validateRequest } from "../middleware/validateRequest";
import { askSchema } from "../schemas/askSchema";

export const askRouter = Router();

askRouter.post("/", validateRequest(askSchema), askController);
