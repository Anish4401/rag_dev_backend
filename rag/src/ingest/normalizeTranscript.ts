import type { TranscriptSegment } from "../types/rag";

export function normalizeTranscript(segments: TranscriptSegment[]): TranscriptSegment[] {
  return segments
    .map((segment) => ({
      ...segment,
      text: segment.text.replace(/\s+/g, " ").trim()
    }))
    .filter((segment) => segment.text.length > 0)
    .reduce<TranscriptSegment[]>((acc, segment) => {
      const previous = acc[acc.length - 1];

      if (
        previous &&
        previous.startSeconds + previous.durationSeconds >= segment.startSeconds &&
        `${previous.text} ${segment.text}`.length < 400
      ) {
        previous.text = `${previous.text} ${segment.text}`.trim();
        previous.durationSeconds =
          segment.startSeconds + segment.durationSeconds - previous.startSeconds;
        return acc;
      }

      acc.push({ ...segment });
      return acc;
    }, []);
}
