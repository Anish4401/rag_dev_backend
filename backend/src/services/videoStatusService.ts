import { env } from "../config/env";
import { findVideoById, upsertVideo } from "../repositories/videoRepository";

export async function getVideoStatus(videoId: string) {
  return findVideoById(videoId);
}

export async function markProcessing(videoId: string, title: string, url: string) {
  return upsertVideo({
    video_id: videoId,
    title,
    source_url: url,
    transcript_status: "processing",
    error_code: null,
    error_message: null,
    retry_after: null
  });
}

export async function markReady(input: {
  videoId: string;
  title: string;
  url: string;
  transcriptHash: string;
  summary: string;
  language: string | null;
  durationSeconds: number | null;
  chunkCount: number;
  embeddingModel: string;
}) {
  return upsertVideo({
    video_id: input.videoId,
    title: input.title,
    source_url: input.url,
    transcript_status: "ready",
    transcript_hash: input.transcriptHash,
    summary: input.summary,
    language: input.language,
    duration_seconds: input.durationSeconds,
    chunk_count: input.chunkCount,
    embedding_model: input.embeddingModel,
    processed_at: new Date().toISOString(),
    last_accessed_at: new Date().toISOString(),
    error_code: null,
    error_message: null,
    retry_after: null
  });
}

export async function markNoCaptions(videoId: string, title: string, url: string) {
  return upsertVideo({
    video_id: videoId,
    title,
    source_url: url,
    transcript_status: "no_captions",
    error_code: "NO_CAPTIONS",
    error_message: "No captions are available for this video."
  });
}

export async function markBlocked(videoId: string, title: string, url: string) {
  const retryAfter = new Date(
    Date.now() + env.TRANSCRIPT_BLOCK_COOLDOWN_MINUTES * 60 * 1000
  ).toISOString();

  return upsertVideo({
    video_id: videoId,
    title,
    source_url: url,
    transcript_status: "blocked",
    error_code: "TRANSCRIPT_BLOCKED",
    error_message: "Transcript source is temporarily unavailable.",
    retry_after: retryAfter
  });
}

export async function markFailed(videoId: string, title: string, url: string, message: string) {
  return upsertVideo({
    video_id: videoId,
    title,
    source_url: url,
    transcript_status: "failed",
    error_code: "FETCH_FAILED",
    error_message: message
  });
}
