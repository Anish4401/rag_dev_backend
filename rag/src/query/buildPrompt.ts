import type { RetrievedChunk } from "../types/rag";

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function buildPrompt(
  question: string,
  chunks: RetrievedChunk[],
  options: { mode?: "qa" | "summary"; transcriptLanguage?: string | null } = {}
): string {
  const mode = options.mode ?? "qa";
  const transcriptLanguage = options.transcriptLanguage?.trim() || "unknown";
  const context = chunks
    .map(
      (chunk) =>
        `[${formatTimestamp(chunk.startSeconds)}-${formatTimestamp(chunk.endSeconds)}] ${chunk.text}`
    )
    .join("\n\n");

  const modeInstructions =
    mode === "summary"
      ? [
          "This is a summary request.",
          "Synthesize the video only from themes that are clearly supported by multiple transcript chunks.",
          "Do not infer the full story, motivations, or conclusions from one isolated chunk.",
          "If the retrieved chunks are fragmented, colloquial, multilingual, or insufficient for a confident full-video summary, explicitly say it is a partial summary based on available transcript chunks.",
          "Write a brief summary covering only the supported moments, and mention representative timestamps across the video."
        ]
      : [
          "Answer the specific user question directly from the most relevant transcript evidence.",
          "If the evidence is weak, noisy, or only partially relevant, say so instead of guessing."
        ];

  return [
    "You are an expert assistant with access only to the provided transcript context.",
    "Base your answer strictly and directly on the transcript context below; do not make assumptions or add external knowledge.",
    "If there is not enough information in the transcript to answer, respond with: 'I do not know based on the provided transcript.'",
    "Answer in the same language as the user's question unless the user explicitly asks for another language.",
    `The transcript language is: ${transcriptLanguage}.`,
    "If the transcript's language differs from the question, translate only the supported transcript evidence before answering.",
    "Do not transliterate, normalize, or rewrite the transcript into a cleaner story unless the transcript itself supports that meaning.",
    "If the question mentions a specific time or timestamp, identify and use the chunk(s) covering or nearest to that time, and clearly cite those timestamps in your answer.",
    "Always cite the most relevant timestamps supporting your answer, especially when the question refers to a particular moment.",
    ...modeInstructions,
    "",
    "Transcript context:",
    context,
    "",
    `Question: ${question}`
  ].join("\n");
}
