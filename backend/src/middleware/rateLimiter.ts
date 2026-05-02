import type { NextFunction, Request, Response } from "express";

const requestLog = new Map<string, { count: number; windowStart: number }>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;

export function rateLimiter(req: Request, res: Response, next: NextFunction) {
  const key = req.ip ?? "unknown";
  const entry = requestLog.get(key);
  const now = Date.now();

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    requestLog.set(key, { count: 1, windowStart: now });
    return next();
  }

  if (entry.count >= MAX_REQUESTS) {
    return res.status(429).json({ message: "Too many requests. Please try again shortly." });
  }

  entry.count += 1;
  return next();
}
