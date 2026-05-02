import { z } from "zod";

export const searchChunksSchema = z.object({
  videoId: z.string().min(3),
  query: z.string().min(2),
  topK: z.number().int().min(1).max(12).default(6),
  mode: z.enum(["qa", "summary", "timestamp"]).optional()
});
