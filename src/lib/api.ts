// Mock API layer - ready to swap with real backend endpoints
import { HostState, Suggestion, ChatMessage } from "@/types";

const API_BASE = "/api"; // Update this when connecting to real backend

// Mock data for development
const mockHosts: HostState[] = [
  {
    ip: "10.0.1.100",
    label: "WEB-SERVER",
    tier: "web",
    status: "online",
    lastSeen: new Date().toISOString(),
    dependencies: [{ targetIp: "10.0.1.200", service: "DB" }],
    state: {
      services: {
        IIS: { version: "10.0", notes: "example only" },
        flask: { debug: false, port: 5000 }
      },
      users: {
        admins: ["alice", "bob"],
        regular: ["charlie"]
      }
    },
  },
  {
    ip: "10.0.1.200",
    label: "DB-SERVER",
    tier: "db",
    status: "online",
    lastSeen: new Date().toISOString(),
    dependencies: [],
    state: { cpu: 55, memory: 89, connections: 67, queries: 1240 },
  },
  {
    ip: "10.0.1.50",
    label: "FTP-SERVER",
    tier: "other",
    status: "online",
    lastSeen: new Date().toISOString(),
    dependencies: [],
    state: { cpu: 12, memory: 35, activeSessions: 8 },
  },
];

const mockSuggestions: Suggestion[] = [
  {
    id: "1",
    ip: "10.0.1.100",
    title: "Suspicious IIS configuration detected",
    description: "Web server running IIS 10.0 with potentially insecure settings. Review configuration and apply hardening guidelines.",
    severity: 7,
    suggestedCommand: "Get-WebConfiguration -Filter /system.webServer/security",
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    status: "open",
    dependencies: [
      { targetSuggestionId: "2", relation: "enables" }
    ],
  },
  {
    id: "2",
    ip: "10.0.1.200",
    title: "Memory usage approaching limit",
    description: "Database server memory at 89%. May cause performance degradation or OOM errors.",
    severity: 8,
    suggestedCommand: "free -h && cat /proc/meminfo",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    status: "open",
    dependencies: [
      { targetSuggestionId: "3", relation: "worsens" }
    ],
  },
  {
    id: "3",
    ip: "10.0.1.50",
    title: "FTP service running with weak encryption",
    description: "FTP server detected without TLS/SSL encryption. User credentials may be transmitted in cleartext.",
    severity: 9,
    suggestedCommand: "netstat -an | grep :21 && cat /etc/vsftpd/vsftpd.conf",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    status: "open",
  },
  {
    id: "4",
    ip: "10.0.1.100",
    title: "Flask debug mode enabled",
    description: "Flask application running with debug=true in production. This exposes sensitive information and allows code execution.",
    severity: 10,
    suggestedCommand: "grep -r 'debug.*True' /var/www/flask/",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    status: "open",
  },
];

let chatHistory: ChatMessage[] = [
  {
    id: "1",
    role: "system",
    text: "Slipstream security agent initialized. Monitoring 3 hosts across 3 tiers.",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "2",
    role: "agent",
    text: "Hello! I'm monitoring your infrastructure. Currently tracking 3 open security suggestions. How can I assist you?",
    timestamp: new Date(Date.now() - 3500000).toISOString(),
  },
];

// Simulated network delay
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

// API functions matching your specifications
export async function fetchState(): Promise<HostState[]> {
  await delay();
  return mockHosts;
}

export async function fetchSuggestions(ip?: string): Promise<Suggestion[]> {
  await delay();
  if (ip) {
    return mockSuggestions.filter(s => s.ip === ip);
  }
  return mockSuggestions;
}

export async function executeSuggestion(id: string): Promise<void> {
  await delay();
  const suggestion = mockSuggestions.find(s => s.id === id);
  if (!suggestion) throw new Error("Suggestion not found");
  suggestion.status = "executed";
}

export async function dismissSuggestion(id: string): Promise<void> {
  await delay();
  const suggestion = mockSuggestions.find(s => s.id === id);
  if (!suggestion) throw new Error("Suggestion not found");
  suggestion.status = "dismissed";
}

export async function fetchChatHistory(): Promise<ChatMessage[]> {
  await delay();
  return chatHistory;
}

export async function sendChatMessage(text: string): Promise<ChatMessage> {
  await delay(500);
  
  const userMessage: ChatMessage = {
    id: String(Date.now()),
    role: "user",
    text,
    timestamp: new Date().toISOString(),
  };
  
  chatHistory.push(userMessage);
  
  // Mock agent response
  const agentMessage: ChatMessage = {
    id: String(Date.now() + 1),
    role: "agent",
    text: `Sure, here's what I found: "${text}" - This is a simulated response. In production, I'll provide intelligent security analysis.`,
    timestamp: new Date(Date.now() + 1000).toISOString(),
  };
  
  chatHistory.push(agentMessage);
  
  return userMessage;
}
