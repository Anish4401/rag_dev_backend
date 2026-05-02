export interface TranscriptSegment {
  text: string;
  startSeconds: number;
  durationSeconds: number;
  language?: string;
}

export interface ChunkedTranscript {
  chunkIndex: number;
  text: string;
  startSeconds: number;
  endSeconds: number;
  tokenCount: number;
}

export interface RetrievedChunk {
  id: string;
  text: string;
  startSeconds: number;
  endSeconds: number;
  similarity?: number;
}
