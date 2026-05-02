import { YoutubeTranscript } from "youtube-transcript";

import type { TranscriptSegment } from "@rag-tool/rag";

export class NoCaptionsError extends Error {}
export class TranscriptBlockedError extends Error {}

export async function fetchTranscriptForVideo(videoId: string): Promise<TranscriptSegment[]> {
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);

    return transcript.map((segment) => ({
      text: segment.text,
      startSeconds: Math.floor(segment.offset / 1000),
      durationSeconds: Math.max(1, Math.floor(segment.duration / 1000))
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

    if (message.includes("transcript is disabled") || message.includes("could not find transcript")) {
      throw new NoCaptionsError("No captions available for this video.");
    }

    if (message.includes("ip") || message.includes("blocked") || message.includes("429")) {
      throw new TranscriptBlockedError("Transcript source is temporarily unavailable.");
    }

    throw error;
  }
}
