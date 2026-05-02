import type { SearchChunksResponse } from "@rag-tool/shared";

import {
  findChunkContainingSecond,
  listChunksForVideo,
  matchChunks
} from "../repositories/chunkRepository";
import { getVideoStatus } from "./videoStatusService";
import { embeddingsProvider } from "../providers/embeddingsProvider";

function parseRequestedSecond(question: string): number | null {
  const match =
    question.match(/\b(\d+)\s*(?:sec|secs|second|seconds)\b/i) ??
    question.match(/\b(\d{1,2}):(\d{2})\b/);

  if (!match) {
    return null;
  }

  if (match.length === 3 && match[2]) {
    return Number(match[1]) * 60 + Number(match[2]);
  }

  return Number(match[1]);
}

function inferMode(
  query: string,
  explicitMode?: "qa" | "summary" | "timestamp"
): "qa" | "summary" | "timestamp" {
  if (explicitMode) {
    return explicitMode;
  }

  if (/\b(\d+)\s*(?:sec|secs|second|seconds)\b/i.test(query) || /\b\d{1,2}:\d{2}\b/.test(query)) {
    return "timestamp";
  }

  if (/\b(summary|summarize|brief|overview|gist|main points?|what is (this|the video) about)\b/i.test(query)) {
    return "summary";
  }

  return "qa";
}

function pickTimelineChunks(
  chunks: Awaited<ReturnType<typeof listChunksForVideo>>,
  desiredCount: number
) {
  if (chunks.length <= desiredCount) {
    return chunks;
  }

  const selected: typeof chunks = [];
  const step = (chunks.length - 1) / Math.max(1, desiredCount - 1);

  for (let index = 0; index < desiredCount; index += 1) {
    const chunk = chunks[Math.round(index * step)];
    if (chunk && !selected.some((item) => item.id === chunk.id)) {
      selected.push(chunk);
    }
  }

  return selected;
}

function mergeAndSortChunks<T extends { id: string; startSeconds: number }>(chunks: T[]) {
  const unique = new Map<string, T>();

  for (const chunk of chunks) {
    if (!unique.has(chunk.id)) {
      unique.set(chunk.id, chunk);
    }
  }

  return Array.from(unique.values()).sort((left, right) => left.startSeconds - right.startSeconds);
}

export async function searchRelevantChunks(input: {
  videoId: string;
  query: string;
  topK: number;
  mode?: "qa" | "summary" | "timestamp";
}): Promise<SearchChunksResponse> {
  const video = await getVideoStatus(input.videoId);

  if (!video || video.transcriptStatus !== "ready") {
    throw new Error("Video is not ready. Process the video before searching chunks.");
  }

  const [queryEmbedding] = await embeddingsProvider.embedDocuments([input.query]);
  const mode = inferMode(input.query, input.mode);
  const requestedSecond = mode === "timestamp" ? parseRequestedSecond(input.query) : null;

  const [semanticChunks, timestampChunk, allChunks] = await Promise.all([
    matchChunks(input.videoId, queryEmbedding, input.topK),
    requestedSecond === null ? Promise.resolve(null) : findChunkContainingSecond(input.videoId, requestedSecond),
    mode === "summary" ? listChunksForVideo(input.videoId) : Promise.resolve([])
  ]);

  const timelineChunks = mode === "summary" ? pickTimelineChunks(allChunks, Math.max(4, Math.min(input.topK, 6))) : [];
  const merged =
    mode === "summary"
      ? mergeAndSortChunks([...timelineChunks, ...semanticChunks])
      : mergeAndSortChunks([...(timestampChunk ? [timestampChunk] : []), ...semanticChunks]);

  return {
    videoId: input.videoId,
    mode,
    videoStatus: video.transcriptStatus,
    chunks: merged.map((chunk) => ({
      chunkId: chunk.id,
      startSeconds: chunk.startSeconds,
      endSeconds: chunk.endSeconds,
      text: chunk.text,
      similarity: chunk.similarity
    }))
  };
}
