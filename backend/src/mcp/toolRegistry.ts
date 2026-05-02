export const mcpToolDefinitions = [
  {
    type: "function",
    function: {
      name: "process_video",
      description:
        "Ensure a YouTube video transcript is processed and indexed before question answering.",
      parameters: {
        type: "object",
        properties: {
          videoId: {
            type: "string",
            description: "YouTube video ID"
          },
          title: {
            type: "string",
            description: "Optional video title"
          },
          url: {
            type: "string",
            description: "Optional canonical YouTube URL"
          }
        },
        required: ["videoId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "search_chunks",
      description:
        "Retrieve relevant transcript chunks for QA, summary, or timestamp-based reasoning from a processed YouTube video.",
      parameters: {
        type: "object",
        properties: {
          videoId: {
            type: "string"
          },
          query: {
            type: "string",
            description: "Transcript search query. Usually the user's latest question or summary request."
          },
          question: {
            type: "string",
            description: "Alias for query when the latest user question should be reused."
          },
          message: {
            type: "string",
            description: "Fallback alias for query using the latest user message."
          },
          topK: {
            type: "integer",
            minimum: 1,
            maximum: 12,
            default: 6
          },
          mode: {
            type: "string",
            enum: ["qa", "summary", "timestamp"]
          }
        },
        required: ["videoId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "ask_video",
      description:
        "Answer a direct user question about a processed YouTube video using stored transcript chunks.",
      parameters: {
        type: "object",
        properties: {
          videoId: {
            type: "string"
          },
          question: {
            type: "string"
          },
          topK: {
            type: "integer",
            minimum: 1,
            maximum: 12,
            default: 6
          }
        },
        required: ["videoId", "question"]
      }
    }
  }
] as const;
