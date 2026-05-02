import { Router } from "express";

import { processVideoController } from "../controllers/processVideoController";
import { validateRequest } from "../middleware/validateRequest";
import { processVideoSchema } from "../schemas/processVideoSchema";

export const processVideoRouter = Router();

processVideoRouter.post("/", validateRequest(processVideoSchema), processVideoController);
