import type { Citation, TranscriptStatus, VideoRecord } from "@rag-tool/shared";
import type { TranscriptSegment } from "@rag-tool/rag";

export interface ProcessedTranscript {
  video: VideoRecord;
  segments: TranscriptSegment[];
}

export interface CachedAnswerRecord {
  videoId: string;
  questionHash: string;
  questionText: string;
  answer: string;
  citations: Citation[];
}

export interface VideoStatusUpdate {
  transcriptStatus: TranscriptStatus;
  errorCode?: string | null;
  errorMessage?: string | null;
  retryAfter?: string | null;
}
