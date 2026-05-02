import { z } from "zod";

export const processVideoSchema = z.object({
  videoId: z.string().min(3),
  url: z.string().url(),
  title: z.string().min(1)
});
