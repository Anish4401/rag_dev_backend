import type { TranscriptSegment } from "../types/rag";

export interface TranscriptFetcher {
  fetch(videoId: string): Promise<TranscriptSegment[]>;
}
