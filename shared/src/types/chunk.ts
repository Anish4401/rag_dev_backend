export interface TranscriptChunkRecord {
  id: string;
  videoId: string;
  chunkIndex: number;
  text: string;
  startSeconds: number;
  endSeconds: number;
  tokenCount: number;
}
