"use client";

import { useEffect, useRef, useState } from "react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
};

type UpstreamEvent = {
  type: string;
  [key: string]: any;
};

type RepoPayload = { installationId: number; repoFullName: string };

export function useChat(onJobCreated?: (jobId: string) => void) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!conversationId) return;
    const url = `/api/chat/stream?conversationId=${encodeURIComponent(conversationId)}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    const handleAny = (data: UpstreamEvent) => {
      switch (data.type) {
        case "message":
          if (data.message) setMessages(prev => [...prev, data.message]);
          break;
        case "job_created":
          if (data.jobId && onJobCreated) onJobCreated(data.jobId);
          break;
        default:
          // ignore
          break;
      }
    };

    es.onmessage = (ev) => {
      try { handleAny(JSON.parse(ev.data)); } catch {}
    };
    es.addEventListener("job_created", (ev) => {
      try { handleAny(JSON.parse((ev as MessageEvent).data)); } catch {}
    });
    es.onerror = () => { es.close(); };

    return () => { es.close(); eventSourceRef.current = null; };
  }, [conversationId, onJobCreated]);

  const sendMessage = async (payload: { content: string; repo?: RepoPayload | null }) => {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: payload.content,
        conversationId,
        repo: payload.repo ? { installation_id: payload.repo.installationId, repo_full_name: payload.repo.repoFullName } : null,
      }),
    });
    if (!res.ok) throw new Error("Failed to send message");
    const data = await res.json();

    if (data.conversationId && !conversationId) setConversationId(data.conversationId);
    if (data.initialMessage) setMessages(prev => [...prev, data.initialMessage]);
    return data;
  };

  return { messages, conversationId, sendMessage };
}
