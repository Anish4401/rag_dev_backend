import type { NextFunction, Request, Response } from "express";

import { askQuestion } from "../services/askService";

export async function askController(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await askQuestion(req.body);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}
