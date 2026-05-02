create table if not exists public.transcript_chunks (
  id uuid primary key default gen_random_uuid(),
  video_id text not null references public.videos(video_id) on delete cascade,
  chunk_index integer not null,
  text text not null,
  start_seconds integer not null,
  end_seconds integer not null,
  token_count integer not null,
  embedding vector(1536) not null,
  created_at timestamptz not null default now()
);

create index if not exists transcript_chunks_video_id_idx
  on public.transcript_chunks(video_id);
