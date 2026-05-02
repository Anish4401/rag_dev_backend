create or replace function public.match_transcript_chunks(
  query_embedding vector(1536),
  match_count int,
  target_video_id text
)
returns table (
  id uuid,
  text text,
  start_seconds integer,
  end_seconds integer,
  similarity float
)
language sql
as $$
  select
    transcript_chunks.id,
    transcript_chunks.text,
    transcript_chunks.start_seconds,
    transcript_chunks.end_seconds,
    1 - (transcript_chunks.embedding <=> query_embedding) as similarity
  from public.transcript_chunks
  where transcript_chunks.video_id = target_video_id
  order by transcript_chunks.embedding <=> query_embedding
  limit match_count;
$$;
