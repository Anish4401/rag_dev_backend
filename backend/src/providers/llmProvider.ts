import { ChatOpenAI } from "@langchain/openai";

import { env } from "../config/env";

export const llmProvider = new ChatOpenAI({
  apiKey: env.LLM_API_KEY,
  model: env.LLM_MODEL,
  maxTokens: env.LLM_MAX_TOKENS,
  configuration: {
    baseURL: env.LLM_BASE_URL
  }
});
