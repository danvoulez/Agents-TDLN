/**
 * Shared chat state (in-memory, would be Redis in production)
 */

export interface ConversationState {
  conversationId: string;
  projectId?: string;
  projectName?: string;
  repoPath?: string;
  mode: "mechanic" | "genius";
  activeJobId?: string;
  queuedJobs: string[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  status?: "sending" | "sent" | "delivered" | "read";
  metadata?: {
    thinking?: boolean;
    typing?: boolean;
    action?: string;
    jobId?: string;
    projectId?: string;
  };
}

// In-memory state (would be Redis in production)
export const conversationStates = new Map<string, ConversationState>();
export const streamClients = new Map<string, Set<(msg: string) => void>>();

export function broadcastToConversation(conversationId: string, event: any): void {
  const clients = streamClients.get(conversationId);
  if (clients) {
    const type = (event && event.type) ? String(event.type) : "message";
    const payload = { ...event, type };
    const sse = `event: ${type}
data: ${JSON.stringify(payload)}

`;
    clients.forEach(send => {
      try { send(sse); } catch (e) { /* Client disconnected */ }
    });
  }
}

