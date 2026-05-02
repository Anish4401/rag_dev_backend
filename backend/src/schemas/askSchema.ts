import { z } from "zod";

export const askSchema = z.object({
  videoId: z.string().min(3),
  question: z.string().min(3),
  topK: z.number().int().min(1).max(10).default(6)
});
