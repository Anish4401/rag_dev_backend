interface SessionState {
  sessionId: string;
  currentVideoId?: string;
  lastQuestion?: string;
  lastChunkCitations?: Array<{
    chunkId: string;
    startSeconds: number;
    endSeconds: number;
    text: string;
  }>;
  turns: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}

const sessions = new Map<string, SessionState>();

export function getSession(sessionId: string): SessionState {
  const existing = sessions.get(sessionId);

  if (existing) {
    return existing;
  }

  const created: SessionState = {
    sessionId,
    turns: []
  };
  sessions.set(sessionId, created);
  return created;
}

export function appendSessionTurn(
  sessionId: string,
  role: "user" | "assistant",
  content: string
) {
  const session = getSession(sessionId);
  session.turns.push({ role, content });
  session.turns = session.turns.slice(-12);
}

export function updateSessionState(
  sessionId: string,
  patch: Partial<Omit<SessionState, "sessionId" | "turns">>
) {
  const session = getSession(sessionId);
  Object.assign(session, patch);
}

export function resetSession(sessionId: string) {
  const session = getSession(sessionId);
  session.currentVideoId = undefined;
  session.lastQuestion = undefined;
  session.lastChunkCitations = undefined;
  session.turns = [];
}
