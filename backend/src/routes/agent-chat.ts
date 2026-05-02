import { Router } from "express";

import { agentChatController } from "../controllers/agentChatController";
import { validateRequest } from "../middleware/validateRequest";
import { agentChatSchema } from "../schemas/agentChatSchema";

export const agentChatRouter = Router();

agentChatRouter.post("/", validateRequest(agentChatSchema), agentChatController);
