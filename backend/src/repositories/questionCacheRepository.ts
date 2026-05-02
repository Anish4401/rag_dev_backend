import type { Citation } from "@rag-tool/shared";

import { supabase } from "../providers/supabaseClient";

export interface QuestionCacheRow {
  videoId: string;
  questionHash: string;
  questionText: string;
  answer: string;
  citations: Citation[];
}

export async function findCachedAnswer(videoId: string, questionHash: string) {
  const { data, error } = await supabase
    .from("question_cache")
    .select("*")
    .eq("video_id", videoId)
    .eq("question_hash", questionHash)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load cached answer: ${error.message}`);
  }

  return data
    ? {
        answer: data.answer as string,
        citations: (data.citations_json as Citation[]) ?? []
      }
    : null;
}

export async function saveCachedAnswer(row: QuestionCacheRow): Promise<void> {
  const { error } = await supabase.from("question_cache").upsert(
    {
      video_id: row.videoId,
      question_hash: row.questionHash,
      question_text: row.questionText,
      answer: row.answer,
      citations_json: row.citations
    },
    { onConflict: "video_id,question_hash" }
  );

  if (error) {
    throw new Error(`Failed to save cached answer: ${error.message}`);
  }
}
