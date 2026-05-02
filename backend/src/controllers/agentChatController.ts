import type { NextFunction, Request, Response } from "express";

import { runAgentChat } from "../services/agentService";

export async function agentChatController(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await runAgentChat(req.body);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}
