export type TranscriptStatus =
  | "processing"
  | "ready"
  | "no_captions"
  | "blocked"
  | "failed";

export interface ProcessVideoRequest {
  videoId: string;
  url: string;
  title: string;
}

export interface ProcessVideoResponse {
  status: "ready" | "processing" | "error";
  videoId: string;
  cached?: boolean;
  chunkCount?: number;
  summary?: string;
  code?: "NO_CAPTIONS" | "TRANSCRIPT_BLOCKED" | "FETCH_FAILED";
  message?: string;
}

export interface AskRequest {
  videoId: string;
  question: string;
  topK?: number;
}

export interface SearchChunksRequest {
  videoId: string;
  query: string;
  topK?: number;
  mode?: "qa" | "summary" | "timestamp";
}

export interface Citation {
  chunkId: string;
  startSeconds: number;
  endSeconds: number;
  text: string;
}

export interface AskResponse {
  answer: string;
  citations: Citation[];
  cached: boolean;
}

export interface SearchChunksResponse {
  videoId: string;
  mode: "qa" | "summary" | "timestamp";
  chunks: Array<
    Citation & {
      similarity?: number;
    }
  >;
  videoStatus: TranscriptStatus;
}

export interface AgentChatRequest {
  sessionId: string;
  videoId: string;
  title?: string;
  url?: string;
  message: string;
}

export interface AgentToolTrace {
  tool: string;
  ok: boolean;
  meta?: Record<string, unknown>;
  error?: {
    code: string;
    message: string;
  } | null;
}

export interface AgentChatResponse {
  answer: string;
  citations: Citation[];
  toolTrace: AgentToolTrace[];
  sessionId: string;
}

export interface ToolEnvelope<TData> {
  ok: boolean;
  tool: string;
  data: TData | null;
  error: {
    code: string;
    message: string;
  } | null;
  meta?: Record<string, unknown>;
}
