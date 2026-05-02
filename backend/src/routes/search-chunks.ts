import { Router } from "express";

import { searchChunksController } from "../controllers/searchChunksController";
import { validateRequest } from "../middleware/validateRequest";
import { searchChunksSchema } from "../schemas/searchChunksSchema";

export const searchChunksRouter = Router();

searchChunksRouter.post("/", validateRequest(searchChunksSchema), searchChunksController);
