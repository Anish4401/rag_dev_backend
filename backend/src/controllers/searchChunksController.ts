import type { NextFunction, Request, Response } from "express";

import { searchRelevantChunks } from "../services/searchChunksService";

export async function searchChunksController(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await searchRelevantChunks(req.body);
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}
