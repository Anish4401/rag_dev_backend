import { createHash } from "node:crypto";

import { env } from "../config/env";
import { findCachedAnswer, saveCachedAnswer } from "../repositories/questionCacheRepository";

function normalizeQuestion(question: string): string {
  return question.trim().toLowerCase().replace(/\s+/g, " ");
}

function hashQuestion(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export async function getCachedAnswer(videoId: string, question: string) {
  if (env.QUESTION_CACHE_ENABLED !== "true") {
    return null;
  }

  return findCachedAnswer(videoId, hashQuestion(normalizeQuestion(question)));
}

export async function cacheAnswer(
  videoId: string,
  question: string,
  answer: string,
  citations: { chunkId: string; startSeconds: number; endSeconds: number; text: string }[]
) {
  if (env.QUESTION_CACHE_ENABLED !== "true") {
    return;
  }

  await saveCachedAnswer({
    videoId,
    questionHash: hashQuestion(normalizeQuestion(question)),
    questionText: question,
    answer,
    citations
  });
}
