import type { ChunkedTranscript } from "../types/rag";

export interface StoredChunkInput extends ChunkedTranscript {
  embedding: number[];
}

export interface VectorStoreWriter {
  storeVideoChunks(videoId: string, chunks: StoredChunkInput[]): Promise<void>;
}
