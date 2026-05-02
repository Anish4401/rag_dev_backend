import { createHash } from "node:crypto";

import { chunkTranscript, normalizeTranscript } from "@rag-tool/rag";

import { env } from "../config/env";
import { embeddingsProvider } from "../providers/embeddingsProvider";
import {
  NoCaptionsError,
  TranscriptBlockedError,
  fetchTranscriptForVideo
} from "../providers/transcriptProvider";
import { replaceVideoChunks } from "../repositories/videoRepository";
import {
  getVideoStatus,
  markBlocked,
  markFailed,
  markNoCaptions,
  markProcessing,
  markReady
} from "./videoStatusService";

function buildTranscriptHash(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

async function buildSummary(chunks: string[]): Promise<string> {
  return chunks.slice(0, 3).join(" ").slice(0, 500);
}

export async function processVideo(input: { videoId: string; title: string; url: string }) {
  const existing = await getVideoStatus(input.videoId);

  if (existing?.transcriptStatus === "ready") {
    return {
      status: "ready" as const,
      videoId: input.videoId,
      cached: true,
      chunkCount: existing.chunkCount,
      summary: existing.summary ?? undefined
    };
  }

  if (existing?.transcriptStatus === "processing") {
    return {
      status: "processing" as const,
      videoId: input.videoId
    };
  }

  if (
    existing?.transcriptStatus === "blocked" &&
    existing.retryAfter &&
    new Date(existing.retryAfter).getTime() > Date.now()
  ) {
    return {
      status: "error" as const,
      videoId: input.videoId,
      code: "TRANSCRIPT_BLOCKED" as const,
      message: "Transcript source is temporarily unavailable."
    };
  }

  await markProcessing(input.videoId, input.title, input.url);

  try {
    const transcript = await fetchTranscriptForVideo(input.videoId);
    const normalized = normalizeTranscript(transcript);
    const chunks = await chunkTranscript(normalized);
    const embeddings = await embeddingsProvider.embedDocuments(chunks.map((chunk) => chunk.text));
    const transcriptHash = buildTranscriptHash(normalized.map((segment) => segment.text).join("\n"));
    const summary = await buildSummary(chunks.map((chunk) => chunk.text));

    await replaceVideoChunks(
      input.videoId,
      chunks.map((chunk, index) => ({
        video_id: input.videoId,
        chunk_index: chunk.chunkIndex,
        text: chunk.text,
        start_seconds: chunk.startSeconds,
        end_seconds: chunk.endSeconds,
        token_count: chunk.tokenCount,
        embedding: embeddings[index]
      }))
    );

    await markReady({
      videoId: input.videoId,
      title: input.title,
      url: input.url,
      transcriptHash,
      summary,
      language: normalized[0]?.language ?? null,
      durationSeconds:
        normalized.length > 0
          ? normalized[normalized.length - 1].startSeconds +
            normalized[normalized.length - 1].durationSeconds
          : null,
      chunkCount: chunks.length,
      embeddingModel: env.EMBEDDING_MODEL
    });

    return {
      status: "ready" as const,
      videoId: input.videoId,
      cached: false,
      chunkCount: chunks.length,
      summary
    };
  } catch (error) {
    if (error instanceof NoCaptionsError) {
      await markNoCaptions(input.videoId, input.title, input.url);
      return {
        status: "error" as const,
        videoId: input.videoId,
        code: "NO_CAPTIONS" as const,
        message: error.message
      };
    }

    if (error instanceof TranscriptBlockedError) {
      await markBlocked(input.videoId, input.title, input.url);
      return {
        status: "error" as const,
        videoId: input.videoId,
        code: "TRANSCRIPT_BLOCKED" as const,
        message: error.message
      };
    }

    const message = error instanceof Error ? error.message : "Transcript ingestion failed.";
    await markFailed(input.videoId, input.title, input.url, message);
    return {
      status: "error" as const,
      videoId: input.videoId,
      code: "FETCH_FAILED" as const,
      message
    };
  }
}
