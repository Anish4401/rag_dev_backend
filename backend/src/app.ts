import cors from "cors";
import express from "express";

import { agentChatRouter } from "./routes/agent-chat";
import { errorHandler } from "./middleware/errorHandler";
import { rateLimiter } from "./middleware/rateLimiter";
import { askRouter } from "./routes/ask";
import { healthRouter } from "./routes/health";
import { processVideoRouter } from "./routes/process-video";
import { searchChunksRouter } from "./routes/search-chunks";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "1mb" }));
  app.use(rateLimiter);

  app.use("/health", healthRouter);
  app.use("/process-video", processVideoRouter);
  app.use("/ask", askRouter);
  app.use("/search-chunks", searchChunksRouter);
  app.use("/agent/chat", agentChatRouter);
  app.use(errorHandler);

  return app;
}
