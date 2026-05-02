import { YoutubeTranscript } from "youtube-transcript";

import type { TranscriptSegment } from "@rag-tool/rag";

export class NoCaptionsError extends Error {}
export class TranscriptBlockedError extends Error {}

interface CaptionTrack {
  baseUrl: string;
  languageCode?: string;
  name?: {
    simpleText?: string;
  };
  kind?: string;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function normalizeText(text: string): string {
  return decodeHtmlEntities(text).replace(/\s+/g, " ").trim();
}

function isLikelyBlockedMessage(message: string): boolean {
  return (
    message.includes("ip") ||
    message.includes("blocked") ||
    message.includes("429") ||
    message.includes("too many requests") ||
    message.includes("unavailable")
  );
}

function extractPlayerResponse(html: string): Record<string, unknown> | null {
  const patterns = [
    /ytInitialPlayerResponse\s*=\s*(\{.+?\});/s,
    /"PLAYER_INITIAL_DATA"\s*:\s*(\{.+?\})\s*,\s*"PLAYER_CONFIG"/s
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (!match?.[1]) {
      continue;
    }

    try {
      return JSON.parse(match[1]) as Record<string, unknown>;
    } catch {
      continue;
    }
  }

  return null;
}

function pickCaptionTrack(captionTracks: CaptionTrack[]): CaptionTrack | null {
  if (captionTracks.length === 0) {
    return null;
  }

  return (
    captionTracks.find((track) => track.languageCode?.toLowerCase().startsWith("en") && track.kind !== "asr") ??
    captionTracks.find((track) => track.kind !== "asr") ??
    captionTracks.find((track) => track.languageCode?.toLowerCase().startsWith("en")) ??
    captionTracks[0]
  );
}

function parseJson3Transcript(payload: string, language?: string): TranscriptSegment[] {
  const json = JSON.parse(payload) as {
    events?: Array<{
      tStartMs?: number;
      dDurationMs?: number;
      segs?: Array<{ utf8?: string }>;
    }>;
  };

  const segments: Array<TranscriptSegment | null> = (json.events ?? []).map((event) => {
      const text = normalizeText((event.segs ?? []).map((segment) => segment.utf8 ?? "").join(""));

      if (!text) {
        return null;
      }

      const segment: TranscriptSegment = {
        text,
        startSeconds: Math.floor((event.tStartMs ?? 0) / 1000),
        durationSeconds: Math.max(1, Math.floor((event.dDurationMs ?? 0) / 1000)),
        language
      };

      return segment;
    });

  return segments.filter((segment): segment is TranscriptSegment => segment !== null);
}

async function fetchTranscriptFromCaptionTrack(videoId: string): Promise<TranscriptSegment[]> {
  const watchResponse = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=en`, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    }
  });

  if (!watchResponse.ok) {
    throw new Error(`Watch page fetch failed with status ${watchResponse.status}.`);
  }

  const html = await watchResponse.text();
  const playerResponse = extractPlayerResponse(html);
  const captions = playerResponse?.captions as
    | {
        playerCaptionsTracklistRenderer?: {
          captionTracks?: CaptionTrack[];
        };
      }
    | undefined;

  const captionTracks = captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];

  if (captionTracks.length === 0) {
    throw new NoCaptionsError("No captions available for this video.");
  }

  const selectedTrack = pickCaptionTrack(captionTracks);
  if (!selectedTrack?.baseUrl) {
    throw new NoCaptionsError("No captions available for this video.");
  }

  const transcriptUrl = new URL(selectedTrack.baseUrl);
  transcriptUrl.searchParams.set("fmt", "json3");

  const transcriptResponse = await fetch(transcriptUrl.toString(), {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    }
  });

  if (!transcriptResponse.ok) {
    throw new Error(`Caption track fetch failed with status ${transcriptResponse.status}.`);
  }

  const transcriptPayload = await transcriptResponse.text();
  const transcript = parseJson3Transcript(transcriptPayload, selectedTrack.languageCode);

  if (transcript.length === 0) {
    throw new NoCaptionsError("No captions available for this video.");
  }

  return transcript;
}

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
      try {
        return await fetchTranscriptFromCaptionTrack(videoId);
      } catch (fallbackError) {
        if (fallbackError instanceof NoCaptionsError) {
          throw fallbackError;
        }

        const fallbackMessage =
          fallbackError instanceof Error ? fallbackError.message.toLowerCase() : String(fallbackError).toLowerCase();

        if (isLikelyBlockedMessage(fallbackMessage)) {
          throw new TranscriptBlockedError("Transcript source is temporarily unavailable.");
        }

        throw fallbackError;
      }
    }

    if (isLikelyBlockedMessage(message)) {
      try {
        return await fetchTranscriptFromCaptionTrack(videoId);
      } catch (fallbackError) {
        if (fallbackError instanceof NoCaptionsError) {
          throw fallbackError;
        }

        const fallbackMessage =
          fallbackError instanceof Error ? fallbackError.message.toLowerCase() : String(fallbackError).toLowerCase();

        if (isLikelyBlockedMessage(fallbackMessage)) {
          throw new TranscriptBlockedError("Transcript source is temporarily unavailable.");
        }

        throw fallbackError;
      }
    }

    try {
      return await fetchTranscriptFromCaptionTrack(videoId);
    } catch (fallbackError) {
      if (fallbackError instanceof NoCaptionsError) {
        throw fallbackError;
      }

      const fallbackMessage =
        fallbackError instanceof Error ? fallbackError.message.toLowerCase() : String(fallbackError).toLowerCase();

      if (isLikelyBlockedMessage(fallbackMessage)) {
        throw new TranscriptBlockedError("Transcript source is temporarily unavailable.");
      }

      throw error;
    }
  }
}
