// Supabase API layer for Slipstream
import { HostState, Suggestion, ChatMessage, Dependency, SuggestionDependency } from "@/types";

const SUPABASE_URL = "https://uqdnprxlzlqzgwsajnkk.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxZG5wcnhsemxxemd3c2FqbmtrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzA0ODEsImV4cCI6MjA3OTQwNjQ4MX0.I5wHhjdmPNTkjmHttKwjNkTBoS39aFlhF-M7e7rRn-8";

async function sbFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function fetchState(): Promise<HostState[]> {
  const rows = (await sbFetch("/hosts?select=*")) as any[];

  return rows.map((row) => ({
    ip: row.ip,
    label: row.label ?? undefined,
    tier: row.tier ?? undefined,
    status: row.status ?? undefined,
    lastSeen: row.last_seen ?? undefined,
    state: row.state_json || {},
    // we can later derive dependencies from state if we store them there
  }));
}

export async function fetchSuggestions(ip?: string): Promise<Suggestion[]> {
  const filter = ip ? `&ip=eq.${encodeURIComponent(ip)}` : "";
  const rows = (await sbFetch(`/suggestions?select=*${filter}`)) as any[];

  return rows.map((row) => ({
    id: row.id,
    ip: row.ip,
    title: row.title,
    description: row.description,
    severity: row.severity,
    suggestedCommand: row.suggested_command ?? undefined,
    createdAt: row.created_at,
    status: row.status,
    dependencies: (row.dependencies_json || []).map((d: any) => ({
      targetSuggestionId: d.targetSuggestionId,
      relation: d.relation,
    })),
  }));
}

export async function executeSuggestion(id: string): Promise<void> {
  await sbFetch(`/suggestions?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "executed" }),
    headers: { Prefer: "return=minimal" },
  });
}

export async function dismissSuggestion(id: string): Promise<void> {
  await sbFetch(`/suggestions?id=eq.${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "dismissed" }),
    headers: { Prefer: "return=minimal" },
  });
}

export async function fetchChatHistory(limit = 50): Promise<ChatMessage[]> {
  const rows = (await sbFetch(
    `/chat_messages?select=*&order=id.asc&limit=${limit}`
  )) as any[];

  return rows.map((row) => ({
    id: row.id,
    role: row.role,
    text: row.text,
    timestamp: row.timestamp,
  }));
}

export async function sendChatMessage(text: string): Promise<ChatMessage> {
  const payload = {
    role: "user",
    text,
    timestamp: new Date().toISOString(),
  };

  const rows = (await sbFetch("/chat_messages", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { Prefer: "return=representation" },
  })) as any[];

  const row = rows[0];
  return {
    id: row.id,
    role: row.role,
    text: row.text,
    timestamp: row.timestamp,
  };
}
