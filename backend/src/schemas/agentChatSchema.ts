import { z } from "zod";

export const agentChatSchema = z.object({
  sessionId: z.string().min(1),
  videoId: z.string().min(3),
  title: z.string().optional(),
  url: z.string().url().optional(),
  message: z.string().min(2)
});
