import type { TranscriptStatus, VideoRecord } from "@rag-tool/shared";

import { supabase } from "../providers/supabaseClient";

function mapRow(row: any): VideoRecord {
  return {
    videoId: row.video_id,
    title: row.title,
    sourceUrl: row.source_url,
    transcriptStatus: row.transcript_status as TranscriptStatus,
    transcriptHash: row.transcript_hash,
    summary: row.summary,
    language: row.language,
    durationSeconds: row.duration_seconds,
    chunkCount: row.chunk_count ?? 0,
    embeddingModel: row.embedding_model,
    processedAt: row.processed_at,
    lastAccessedAt: row.last_accessed_at,
    errorCode: row.error_code,
    errorMessage: row.error_message,
    retryAfter: row.retry_after
  };
}

export async function findVideoById(videoId: string): Promise<VideoRecord | null> {
  const { data, error } = await supabase.from("videos").select("*").eq("video_id", videoId).maybeSingle();

  if (error) {
    throw new Error(`Failed to load video record: ${error.message}`);
  }

  return data ? mapRow(data) : null;
}

export async function upsertVideo(row: Record<string, unknown>): Promise<VideoRecord> {
  const { data, error } = await supabase
    .from("videos")
    .upsert(row, { onConflict: "video_id" })
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to upsert video: ${error.message}`);
  }

  return mapRow(data);
}

export async function updateVideoAccess(videoId: string): Promise<void> {
  const { error } = await supabase
    .from("videos")
    .update({ last_accessed_at: new Date().toISOString() })
    .eq("video_id", videoId);

  if (error) {
    throw new Error(`Failed to update last access time: ${error.message}`);
  }
}

export async function replaceVideoChunks(videoId: string, rows: Record<string, unknown>[]): Promise<void> {
  const deleteResult = await supabase.from("transcript_chunks").delete().eq("video_id", videoId);

  if (deleteResult.error) {
    throw new Error(`Failed to clear old chunks: ${deleteResult.error.message}`);
  }

  if (rows.length === 0) {
    return;
  }

  const insertResult = await supabase.from("transcript_chunks").insert(rows);

  if (insertResult.error) {
    throw new Error(`Failed to insert transcript chunks: ${insertResult.error.message}`);
  }
}
