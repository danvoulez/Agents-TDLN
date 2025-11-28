"use client";

import { useEffect, useState } from "react";

export type JobEvent = {
  id?: string;
  type?: string;
  kind?: string;
  agent_type?: string | null;
  tool_name?: string | null;
  message?: string | null;
  summary?: string | null;
  created_at?: string | null;
  timestamp?: string | null;
  params?: any;
  result?: any;
};

export function useJobEvents(jobId: string | null) {
  const [events, setEvents] = useState<JobEvent[]>([]);

  useEffect(() => {
    if (!jobId) return;
    const es = new EventSource(`/api/jobs/${jobId}/events`);
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data) as JobEvent;
        setEvents(prev => [...prev, data]);
      } catch {}
    };
    es.onerror = () => { es.close(); };
    return () => { es.close(); };
  }, [jobId]);

  return { events };
}
