import type { StoredChunkInput } from "../ingest/embedAndStore";
import type { VectorStoreRetriever } from "../query/retrieveChunks";
import type { RetrievedChunk } from "../types/rag";

export interface SupabaseClientLike {
  from(table: string): any;
  rpc(fn: string, args: Record<string, unknown>): Promise<{ data: unknown; error: unknown }>;
}

export class SupabaseVectorStoreAdapter implements VectorStoreRetriever {
  constructor(private readonly supabase: SupabaseClientLike) {}

  async storeVideoChunks(videoId: string, chunks: StoredChunkInput[]): Promise<void> {
    const { error } = await this.supabase.from("transcript_chunks").insert(
      chunks.map((chunk) => ({
        video_id: videoId,
        chunk_index: chunk.chunkIndex,
        text: chunk.text,
        start_seconds: chunk.startSeconds,
        end_seconds: chunk.endSeconds,
        token_count: chunk.tokenCount,
        embedding: chunk.embedding
      }))
    );

    if (error) {
      throw new Error(`Failed to store chunks: ${String(error)}`);
    }
  }

  async similaritySearch(
    videoId: string,
    queryEmbedding: number[],
    topK: number
  ): Promise<RetrievedChunk[]> {
    const { data, error } = await this.supabase.rpc("match_transcript_chunks", {
      query_embedding: queryEmbedding,
      match_count: topK,
      target_video_id: videoId
    });

    if (error) {
      throw new Error(`Vector search failed: ${String(error)}`);
    }

    return (data as RetrievedChunk[]) ?? [];
  }
}
