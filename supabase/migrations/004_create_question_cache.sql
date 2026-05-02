create table if not exists public.question_cache (
  id uuid primary key default gen_random_uuid(),
  video_id text not null references public.videos(video_id) on delete cascade,
  question_hash text not null,
  question_text text not null,
  answer text not null,
  citations_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (video_id, question_hash)
);
