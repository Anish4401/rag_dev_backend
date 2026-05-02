import type {
  AskResponse,
  ProcessVideoResponse,
  SearchChunksResponse,
  ToolEnvelope
} from "@rag-tool/shared";

import { askQuestion } from "../services/askService";
import { searchRelevantChunks } from "../services/searchChunksService";
import { processVideo } from "../services/transcriptIngestionService";

function ok<TData>(tool: string, data: TData, meta?: Record<string, unknown>): ToolEnvelope<TData> {
  return {
    ok: true,
    tool,
    data,
    error: null,
    meta
  };
}

function fail(tool: string, code: string, message: string, meta?: Record<string, unknown>): ToolEnvelope<null> {
  return {
    ok: false,
    tool,
    data: null,
    error: {
      code,
      message
    },
    meta
  };
}

export async function executeTool(
  name: string,
  args: Record<string, unknown>
): Promise<ToolEnvelope<ProcessVideoResponse | SearchChunksResponse | AskResponse | null>> {
  try {
    if (name === "process_video") {
      const result = await processVideo({
        videoId: String(args.videoId),
        title: typeof args.title === "string" ? args.title : "Unknown title",
        url: typeof args.url === "string" ? args.url : `https://www.youtube.com/watch?v=${String(args.videoId)}`
      });

      if (result.status === "error") {
        return fail("process_video", result.code ?? "PROCESS_VIDEO_FAILED", result.message ?? "Video processing failed.", {
          videoId: result.videoId
        });
      }

      if (result.status === "processing") {
        return fail(
          "process_video",
          "VIDEO_STILL_PROCESSING",
          "Video indexing is still in progress. Retry shortly before searching chunks.",
          {
            videoId: result.videoId,
            status: result.status
          }
        );
      }

      return ok("process_video", result, {
        videoId: result.videoId,
        cached: result.cached ?? false,
        status: result.status
      });
    }

    if (name === "search_chunks") {
      const result = await searchRelevantChunks({
        videoId: String(args.videoId),
        query: String(args.query),
        topK: typeof args.topK === "number" ? args.topK : 6,
        mode:
          args.mode === "qa" || args.mode === "summary" || args.mode === "timestamp"
            ? args.mode
            : undefined
      });

      return ok("search_chunks", result, {
        videoId: result.videoId,
        chunkCount: result.chunks.length,
        mode: result.mode
      });
    }

    if (name === "ask_video") {
      const result = await askQuestion({
        videoId: String(args.videoId),
        question: String(args.question),
        topK: typeof args.topK === "number" ? args.topK : 6
      });

      return ok("ask_video", result, {
        videoId: String(args.videoId),
        cached: result.cached
      });
    }

    return fail(name, "UNKNOWN_TOOL", `Unknown tool: ${name}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Tool execution failed.";
    return fail(name, "TOOL_EXECUTION_FAILED", message);
  }
}
