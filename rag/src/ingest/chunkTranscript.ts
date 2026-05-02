import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

import type { ChunkedTranscript, TranscriptSegment } from "../types/rag";

const APPROX_CHARS_PER_TOKEN = 4;

export async function chunkTranscript(
  segments: TranscriptSegment[],
  options: { chunkSize?: number; chunkOverlap?: number } = {}
): Promise<ChunkedTranscript[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: options.chunkSize ?? 2800,
    chunkOverlap: options.chunkOverlap ?? 400
  });

  const merged = segments.map((segment) => ({
    pageContent: segment.text,
    metadata: {
      startSeconds: segment.startSeconds,
      endSeconds: segment.startSeconds + segment.durationSeconds
    }
  }));

  const docs = await splitter.splitDocuments(merged);

  return docs.map((doc, index) => ({
    chunkIndex: index,
    text: doc.pageContent.trim(),
    startSeconds: doc.metadata.startSeconds as number,
    endSeconds: doc.metadata.endSeconds as number,
    tokenCount: Math.ceil(doc.pageContent.length / APPROX_CHARS_PER_TOKEN)
  }));
}
