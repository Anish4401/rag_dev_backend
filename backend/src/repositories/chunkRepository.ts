import type { RetrievedChunk } from "@rag-tool/rag";

import { supabase } from "../providers/supabaseClient";

function mapChunk(row: {
  id: string;
  text: string;
  start_seconds: number;
  end_seconds: number;
  similarity?: number;
}): RetrievedChunk {
  return {
    id: row.id,
    text: row.text,
    startSeconds: row.start_seconds,
    endSeconds: row.end_seconds,
    similarity: row.similarity
  };
}

export async function matchChunks(
  videoId: string,
  queryEmbedding: number[],
  topK: number
): Promise<RetrievedChunk[]> {
  const { data, error } = await supabase.rpc("match_transcript_chunks", {
    query_embedding: queryEmbedding,
    match_count: topK,
    target_video_id: videoId
  });

  if (error) {
    throw new Error(`Failed to match transcript chunks: ${error.message}`);
  }

  return ((data as Array<{
    id: string;
    text: string;
    start_seconds: number;
    end_seconds: number;
    similarity?: number;
  }> | null) ?? []).map(mapChunk);
}

export async function findChunkContainingSecond(
  videoId: string,
  second: number
): Promise<RetrievedChunk | null> {
  const { data, error } = await supabase
    .from("transcript_chunks")
    .select("id, text, start_seconds, end_seconds")
    .eq("video_id", videoId)
    .lte("start_seconds", second)
    .gte("end_seconds", second)
    .order("chunk_index", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load timestamp chunk: ${error.message}`);
  }

  return data
    ? mapChunk(data as { id: string; text: string; start_seconds: number; end_seconds: number })
    : null;
}

export async function listChunksForVideo(videoId: string): Promise<RetrievedChunk[]> {
  const { data, error } = await supabase
    .from("transcript_chunks")
    .select("id, text, start_seconds, end_seconds")
    .eq("video_id", videoId)
    .order("chunk_index", { ascending: true });

  if (error) {
    throw new Error(`Failed to list transcript chunks: ${error.message}`);
  }

  return ((data as Array<{
    id: string;
    text: string;
    start_seconds: number;
    end_seconds: number;
  }> | null) ?? []).map(mapChunk);
}
