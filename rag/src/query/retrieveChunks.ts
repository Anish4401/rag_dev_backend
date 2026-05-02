import type { RetrievedChunk } from "../types/rag";

export interface VectorStoreRetriever {
  similaritySearch(
    videoId: string,
    queryEmbedding: number[],
    topK: number
  ): Promise<RetrievedChunk[]>;
}
