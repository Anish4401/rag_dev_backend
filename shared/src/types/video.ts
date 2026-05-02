import type { TranscriptStatus } from "./api";

export interface VideoRecord {
  videoId: string;
  title: string;
  sourceUrl: string;
  transcriptStatus: TranscriptStatus;
  transcriptHash: string | null;
  summary: string | null;
  language: string | null;
  durationSeconds: number | null;
  chunkCount: number;
  embeddingModel: string | null;
  processedAt: string | null;
  lastAccessedAt: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  retryAfter: string | null;
}
