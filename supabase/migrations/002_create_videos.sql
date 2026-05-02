create table if not exists public.videos (
  video_id text primary key,
  title text not null,
  source_url text not null,
  transcript_status text not null,
  transcript_hash text,
  summary text,
  language text,
  duration_seconds integer,
  chunk_count integer not null default 0,
  embedding_model text,
  processed_at timestamptz,
  last_accessed_at timestamptz,
  error_code text,
  error_message text,
  retry_after timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
