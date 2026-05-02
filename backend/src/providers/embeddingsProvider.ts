import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { OpenAIEmbeddings } from "@langchain/openai";

import { env } from "../config/env";

export const embeddingsProvider =
  env.EMBEDDING_PROVIDER === "google"
    ? new GoogleGenerativeAIEmbeddings({
        apiKey: env.EMBEDDING_API_KEY,
        model: env.EMBEDDING_MODEL
      })
    : new OpenAIEmbeddings({
        apiKey: env.EMBEDDING_API_KEY,
        model: env.EMBEDDING_MODEL,
        configuration: {
          baseURL: env.EMBEDDING_BASE_URL
        }
      });
