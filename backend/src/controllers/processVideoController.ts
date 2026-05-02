import type { NextFunction, Request, Response } from "express";

import { processVideo } from "../services/transcriptIngestionService";

export async function processVideoController(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await processVideo(req.body);
    const statusCode = result.status === "error" ? 422 : 200;
    return res.status(statusCode).json(result);
  } catch (error) {
    return next(error);
  }
}
