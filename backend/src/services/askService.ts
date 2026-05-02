import type { AskResponse, Citation } from "@rag-tool/shared";
import { buildPrompt } from "@rag-tool/rag";

import { llmProvider } from "../providers/llmProvider";
import { updateVideoAccess } from "../repositories/videoRepository";
import { cacheAnswer, getCachedAnswer } from "./questionCacheService";
import { searchRelevantChunks } from "./searchChunksService";
import { getVideoStatus } from "./videoStatusService";

function toCitations(
  chunks: Array<{ chunkId: string; text: string; startSeconds: number; endSeconds: number }>
): Citation[] {
  return chunks.map((chunk) => ({
    chunkId: chunk.chunkId,
    startSeconds: chunk.startSeconds,
    endSeconds: chunk.endSeconds,
    text: chunk.text
  }));
}

export async function askQuestion(input: {
  videoId: string;
  question: string;
  topK: number;
}): Promise<AskResponse> {
  const video = await getVideoStatus(input.videoId);

  if (!video || video.transcriptStatus !== "ready") {
    throw new Error("Video is not ready. Process the video before asking questions.");
  }

  const cachedAnswer = await getCachedAnswer(input.videoId, input.question);

  if (cachedAnswer) {
    await updateVideoAccess(input.videoId);
    return {
      answer: cachedAnswer.answer,
      citations: cachedAnswer.citations,
      cached: true
    };
  }

  const chunkSearch = await searchRelevantChunks({
    videoId: input.videoId,
    query: input.question,
    topK: input.topK
  });
  const citations = toCitations(chunkSearch.chunks);
  const prompt = buildPrompt(
    input.question,
    chunkSearch.chunks.map((chunk) => ({
      id: chunk.chunkId,
      text: chunk.text,
      startSeconds: chunk.startSeconds,
      endSeconds: chunk.endSeconds,
      similarity: chunk.similarity
    })),
    {
      mode: chunkSearch.mode === "summary" ? "summary" : "qa",
      transcriptLanguage: video.language
    }
  );
  const response = await llmProvider.invoke(prompt);
  const answer = typeof response.content === "string" ? response.content : JSON.stringify(response.content);

  await cacheAnswer(input.videoId, input.question, answer, citations);
  await updateVideoAccess(input.videoId);

  return {
    answer,
    citations,
    cached: false
  };
}
