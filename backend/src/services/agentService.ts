import type { AgentChatRequest, AgentChatResponse, Citation, ToolEnvelope } from "@rag-tool/shared";

import { env } from "../config/env";
import { executeTool } from "../mcp/toolHandlers";
import { mcpToolDefinitions } from "../mcp/toolRegistry";
import { appendSessionTurn, getSession, resetSession, updateSessionState } from "./sessionStore";

interface ChatCompletionToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

interface ChatCompletionMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_call_id?: string;
  tool_calls?: ChatCompletionToolCall[];
}

function normalizeToolArgs(
  toolName: string,
  args: Record<string, unknown>,
  context: AgentChatRequest
): Record<string, unknown> {
  const nestedInput =
    args.input && typeof args.input === "object" && !Array.isArray(args.input)
      ? (args.input as Record<string, unknown>)
      : {};

  const merged = {
    ...nestedInput,
    ...args
  };

  if (toolName === "process_video") {
    return {
      videoId:
        typeof merged.videoId === "string" && merged.videoId.trim().length > 0
          ? merged.videoId
          : context.videoId,
      title:
        typeof merged.title === "string" && merged.title.trim().length > 0
          ? merged.title
          : context.title,
      url:
        typeof merged.url === "string" && merged.url.trim().length > 0
          ? merged.url
          : context.url
    };
  }

  if (toolName === "search_chunks") {
    return {
      videoId:
        typeof merged.videoId === "string" && merged.videoId.trim().length > 0
          ? merged.videoId
          : context.videoId,
      query:
        typeof merged.query === "string" && merged.query.trim().length > 0
          ? merged.query
          : typeof merged.question === "string" && merged.question.trim().length > 0
            ? merged.question
            : typeof merged.message === "string" && merged.message.trim().length > 0
              ? merged.message
              : context.message,
      topK: typeof merged.topK === "number" ? merged.topK : 6,
      mode:
        merged.mode === "qa" || merged.mode === "summary" || merged.mode === "timestamp"
          ? merged.mode
          : undefined
    };
  }

  if (toolName === "ask_video") {
    return {
      videoId:
        typeof merged.videoId === "string" && merged.videoId.trim().length > 0
          ? merged.videoId
          : context.videoId,
      question:
        typeof merged.question === "string" && merged.question.trim().length > 0
          ? merged.question
          : typeof merged.query === "string" && merged.query.trim().length > 0
            ? merged.query
            : context.message,
      topK: typeof merged.topK === "number" ? merged.topK : 6
    };
  }

  return merged;
}

function buildSystemPrompt(): string {
  return [
    "You are a video research assistant operating over MCP-style tools.",
    "Answer only from tool-provided evidence.",
    "Respond in the same language as the user's latest message unless they explicitly ask for another language.",
    "If transcript evidence is multilingual, noisy, or fragmented, summarize only the supported facts and clearly say when the result is partial.",
    "If the user asks about a YouTube video and the indexed status is unknown, call process_video first.",
    "Use search_chunks when you need transcript evidence before answering.",
    "Use ask_video only for direct single-step question answering when retrieval inspection is unnecessary.",
    "For summary requests, gather evidence that covers the video timeline rather than only the introduction.",
    "If tools report missing captions, blocked transcript access, or failed processing, explain that clearly and do not hallucinate.",
    "Always provide a concise answer grounded in the retrieved transcript and preserve timestamp evidence."
  ].join(" ");
}

async function createToolAwareCompletion(messages: ChatCompletionMessage[]) {
  const response = await fetch(`${env.LLM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.LLM_API_KEY}`
    },
    body: JSON.stringify({
      model: env.LLM_MODEL,
      max_tokens: env.LLM_MAX_TOKENS,
      temperature: 0.2,
      messages,
      tools: mcpToolDefinitions,
      tool_choice: "auto"
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Agent completion failed: ${response.status} ${body}`);
  }

  const json = (await response.json()) as {
    choices?: Array<{
      message?: ChatCompletionMessage;
    }>;
  };

  const message = json.choices?.[0]?.message;

  if (!message) {
    throw new Error("Agent completion returned no message.");
  }

  return message;
}

function extractCitationsFromEnvelope(
  envelope: ToolEnvelope<unknown>
): Citation[] {
  if (!envelope.ok || !envelope.data || typeof envelope.data !== "object") {
    return [];
  }

  if ("citations" in envelope.data && Array.isArray((envelope.data as { citations?: Citation[] }).citations)) {
    return (envelope.data as { citations: Citation[] }).citations;
  }

  if ("chunks" in envelope.data && Array.isArray((envelope.data as { chunks?: Citation[] }).chunks)) {
    return (envelope.data as { chunks: Citation[] }).chunks.map((chunk) => ({
      chunkId: chunk.chunkId,
      startSeconds: chunk.startSeconds,
      endSeconds: chunk.endSeconds,
      text: chunk.text
    }));
  }

  return [];
}

export async function runAgentChat(input: AgentChatRequest): Promise<AgentChatResponse> {
  const existingSession = getSession(input.sessionId);
  if (existingSession.currentVideoId && existingSession.currentVideoId !== input.videoId) {
    resetSession(input.sessionId);
  }

  const session = getSession(input.sessionId);
  const toolTrace: AgentChatResponse["toolTrace"] = [];
  let finalCitations: Citation[] = session.lastChunkCitations ?? [];
  let lastToolError: { code: string; message: string } | null = null;

  const messages: ChatCompletionMessage[] = [
    { role: "system", content: buildSystemPrompt() },
    ...session.turns.map((turn) => ({ role: turn.role, content: turn.content })),
    {
      role: "user",
      content: JSON.stringify({
        videoId: input.videoId,
        title: input.title,
        url: input.url,
        question: input.message
      })
    }
  ];

  updateSessionState(input.sessionId, {
    currentVideoId: input.videoId,
    lastQuestion: input.message
  });
  appendSessionTurn(input.sessionId, "user", input.message);

  for (let step = 0; step < 4; step += 1) {
    const assistantMessage = await createToolAwareCompletion(messages);
    messages.push(assistantMessage);

    if (!assistantMessage.tool_calls || assistantMessage.tool_calls.length === 0) {
      const answer = assistantMessage.content?.trim() ?? "I do not know based on the provided transcript.";
      appendSessionTurn(input.sessionId, "assistant", answer);
      updateSessionState(input.sessionId, {
        lastChunkCitations: finalCitations
      });

      return {
        answer,
        citations: finalCitations,
        toolTrace,
        sessionId: input.sessionId
      };
    }

    for (const toolCall of assistantMessage.tool_calls) {
      const rawArgs = JSON.parse(toolCall.function.arguments || "{}") as Record<string, unknown>;
      const normalizedArgs = normalizeToolArgs(toolCall.function.name, rawArgs, input);
      const envelope = await executeTool(toolCall.function.name, normalizedArgs);

      toolTrace.push({
        tool: toolCall.function.name,
        ok: envelope.ok,
        meta: {
          ...envelope.meta,
          normalizedArgs
        },
        error: envelope.error
      });

      const citations = extractCitationsFromEnvelope(envelope);
      if (citations.length > 0) {
        finalCitations = citations;
      }

      if (!envelope.ok && envelope.error) {
        lastToolError = envelope.error;
      }

      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(envelope)
      });
    }
  }

  const fallbackAnswer = "I could not complete the tool workflow safely in time.";
  appendSessionTurn(input.sessionId, "assistant", fallbackAnswer);

  return {
    answer: lastToolError ? lastToolError.message : fallbackAnswer,
    citations: finalCitations,
    toolTrace,
    sessionId: input.sessionId
  };
}
