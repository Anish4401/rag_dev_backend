import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

export function validateRequest<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        message: "Invalid request payload.",
        issues: result.error.flatten()
      });
    }

    req.body = result.data;
    return next();
  };
}
