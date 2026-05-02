import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { config } from "dotenv";
import { z } from "zod";

const __dirname = dirname(fileURLToPath(import.meta.url));

config({ path: resolve(__dirname, "../../../.env") });

const envInput = {
  ...process.env,
  LLM_API_KEY: process.env.LLM_API_KEY ?? process.env.OPENAI_API_KEY,
  LLM_BASE_URL: process.env.LLM_BASE_URL ?? process.env.OPENAI_BASE_URL,
  LLM_MODEL: process.env.LLM_MODEL ?? process.env.EMBEDDING_CHAT_MODEL,
  EMBEDDING_API_KEY:
    process.env.EMBEDDING_API_KEY ?? process.env.GOOGLE_API_KEY ?? process.env.OPENAI_API_KEY,
  EMBEDDING_BASE_URL: process.env.EMBEDDING_BASE_URL ?? process.env.OPENAI_BASE_URL,
  EMBEDDING_MODEL:
    process.env.EMBEDDING_MODEL ??
    process.env.GOOGLE_EMBEDDING_MODEL ??
    process.env.OPENAI_EMBEDDING_MODEL
};

const envSchema = z.object({
  BACKEND_PORT: z.coerce.number().default(4000),
  LLM_API_KEY: z.string().min(1),
  LLM_BASE_URL: z.string().url().default("https://api.groq.com/openai/v1"),
  LLM_MODEL: z.string().default("llama-3.1-8b-instant"),
  LLM_MAX_TOKENS: z.coerce.number().int().min(64).max(4096).default(512),
  EMBEDDING_PROVIDER: z.enum(["google", "openai"]).default("openai"),
  EMBEDDING_API_KEY: z.string().min(1),
  EMBEDDING_BASE_URL: z.string().url().default("https://api.openai.com/v1"),
  EMBEDDING_MODEL: z.string().default("text-embedding-3-small"),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  TRANSCRIPT_BLOCK_COOLDOWN_MINUTES: z.coerce.number().default(30),
  QUESTION_CACHE_ENABLED: z.string().default("true")
});

export const env = envSchema.parse(envInput);
