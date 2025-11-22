export type Tier = "dc" | "web" | "app" | "db" | "other";

export type Dependency = {
  targetIp: string;
  service: string;
};

export type HostState = {
  ip: string;
  label?: string;
  tier?: Tier;
  status?: "online" | "offline";
  lastSeen?: string;
  dependencies?: Dependency[];
  state: Record<string, any>;
};

export type SuggestionStatus = "open" | "executed" | "dismissed";

export type Suggestion = {
  id: string;
  ip: string;
  title: string;
  description: string;
  severity: number;
  suggestedCommand?: string;
  createdAt: string;
  status: SuggestionStatus;
};

export type ChatMessageRole = "user" | "agent" | "system";

export type ChatMessage = {
  id: string;
  role: ChatMessageRole;
  text: string;
  timestamp: string;
};
