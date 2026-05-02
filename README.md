# YouTube RAG Backend Repo

Standalone backend workspace for the YouTube RAG product.

## Included Packages

- `backend`: Express API for video processing, retrieval, and chat
- `rag`: transcript normalization, chunking, prompt building, retrieval helpers
- `shared`: shared request/response and domain types
- `supabase`: SQL migrations for the required database schema

## Requirements

- Node.js 20+
- `pnpm` 10+
- Supabase project with `pgvector` enabled
- LLM and embedding provider credentials

## Quick Start

1. Copy `.env.example` to `.env`.
2. Run the SQL files in `supabase/migrations` against your Supabase database.
3. Install dependencies:

```bash
pnpm install
```

4. Start the API:

```bash
pnpm dev:backend
```

## Environment Variables

Configure these in `.env`:

- `BACKEND_PORT`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `LLM_API_KEY`
- `LLM_BASE_URL`
- `LLM_MODEL`
- `LLM_MAX_TOKENS`
- `EMBEDDING_PROVIDER`
- `EMBEDDING_API_KEY`
- `EMBEDDING_BASE_URL`
- `EMBEDDING_MODEL`
- `TRANSCRIPT_BLOCK_COOLDOWN_MINUTES`
- `QUESTION_CACHE_ENABLED`

## Scripts

- `pnpm dev:backend`
- `pnpm build`
- `pnpm typecheck`

## Deployment Notes

- Deploy the `backend` package as your API service.
- Keep `rag` and `shared` in the same workspace because the backend imports both as workspace packages.
- Point your Chrome extension or frontend to the deployed API base URL over HTTPS.
