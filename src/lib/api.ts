// Mock API layer - ready to swap with real backend endpoints
import { HostState, Suggestion, ChatMessage, SuggestionStatus } from "@/types";

const API_BASE = "/api"; // Update this when connecting to real backend

// Mock data for development
const mockHosts: HostState[] = [
  {
    ip: "10.0.1.10",
    label: "DC-PRIMARY",
    tier: "dc",
    status: "online",
    lastSeen: new Date().toISOString(),
    dependencies: [{ targetIp: "10.0.2.10", service: "replication" }],
    state: { cpu: 45, memory: 62, diskUsage: 38 },
  },
  {
    ip: "10.0.2.10",
    label: "WEB-01",
    tier: "web",
    status: "online",
    lastSeen: new Date().toISOString(),
    dependencies: [{ targetIp: "10.0.3.10", service: "api" }],
    state: { cpu: 28, memory: 54, connections: 142 },
  },
  {
    ip: "10.0.3.10",
    label: "APP-SERVER",
    tier: "app",
    status: "online",
    lastSeen: new Date().toISOString(),
    dependencies: [{ targetIp: "10.0.4.10", service: "database" }],
    state: { cpu: 72, memory: 81, activeThreads: 24 },
  },
  {
    ip: "10.0.4.10",
    label: "DB-MAIN",
    tier: "db",
    status: "online",
    lastSeen: new Date().toISOString(),
    state: { cpu: 55, memory: 89, connections: 67, queries: 1240 },
  },
  {
    ip: "10.0.5.20",
    label: "WEB-02",
    tier: "web",
    status: "offline",
    lastSeen: new Date(Date.now() - 3600000).toISOString(),
    state: {},
  },
];

const mockSuggestions: Suggestion[] = [
  {
    id: "1",
    ip: "10.0.3.10",
    title: "High CPU usage detected",
    description: "CPU usage has exceeded 70% for more than 15 minutes. Consider scaling or investigating runaway processes.",
    severity: 7,
    suggestedCommand: "top -bn1 | grep 'Cpu(s)' && ps aux --sort=-%cpu | head -10",
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    status: "open",
  },
  {
    id: "2",
    ip: "10.0.4.10",
    title: "Memory usage approaching limit",
    description: "Database server memory at 89%. May cause performance degradation or OOM errors.",
    severity: 8,
    suggestedCommand: "free -h && cat /proc/meminfo",
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    status: "open",
  },
  {
    id: "3",
    ip: "10.0.5.20",
    title: "Host offline",
    description: "WEB-02 has been offline for over 1 hour. Check network connectivity and service status.",
    severity: 9,
    suggestedCommand: "ping 10.0.5.20 && ssh admin@10.0.5.20 'systemctl status'",
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    status: "open",
  },
  {
    id: "4",
    ip: "10.0.1.10",
    title: "Security patch available",
    description: "Critical security updates available for DC-PRIMARY. Schedule maintenance window.",
    severity: 6,
    suggestedCommand: "apt update && apt list --upgradable",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    status: "executed",
  },
];

let chatHistory: ChatMessage[] = [
  {
    id: "1",
    role: "system",
    text: "Splitstream security agent initialized. Monitoring 5 hosts across 4 tiers.",
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

export const api = {
  async getHosts(): Promise<HostState[]> {
    await delay();
    return mockHosts;
  },

  async getSuggestions(filters?: { ip?: string; status?: SuggestionStatus }): Promise<Suggestion[]> {
    await delay();
    let filtered = [...mockSuggestions];
    
    if (filters?.ip) {
      filtered = filtered.filter(s => s.ip === filters.ip);
    }
    if (filters?.status) {
      filtered = filtered.filter(s => s.status === filters.status);
    }
    
    return filtered;
  },

  async executeSuggestion(id: string): Promise<Suggestion> {
    await delay();
    const suggestion = mockSuggestions.find(s => s.id === id);
    if (!suggestion) throw new Error("Suggestion not found");
    suggestion.status = "executed";
    return suggestion;
  },

  async dismissSuggestion(id: string): Promise<Suggestion> {
    await delay();
    const suggestion = mockSuggestions.find(s => s.id === id);
    if (!suggestion) throw new Error("Suggestion not found");
    suggestion.status = "dismissed";
    return suggestion;
  },

  async getChatHistory(): Promise<ChatMessage[]> {
    await delay();
    return chatHistory;
  },

  async sendChatMessage(text: string): Promise<ChatMessage> {
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
      text: `I've received your message: "${text}". This is a mock response. In production, I'll provide intelligent analysis and recommendations.`,
      timestamp: new Date(Date.now() + 1000).toISOString(),
    };
    
    chatHistory.push(agentMessage);
    
    return userMessage;
  },
};
