// Supabase API layer for Slipstream
import { supabase } from "@/integrations/supabase";
import { HostState, Suggestion, ChatMessage, Dependency, SuggestionDependency } from "@/types";

export async function fetchState(): Promise<HostState[]> {
  const { data, error } = await supabase
    .from('hosts')
    .select('*')
    .order('ip');

  if (error) {
    console.error('Error fetching hosts:', error);
    throw error;
  }

  return (data || []).map(host => ({
    ip: host.ip,
    label: host.label || undefined,
    tier: host.tier as HostState['tier'],
    status: host.status as HostState['status'],
    lastSeen: host.last_seen || undefined,
    dependencies: (host.dependencies as Dependency[]) || [],
    state: (host.state_json as Record<string, any>) || {},
  }));
}

export async function fetchSuggestions(ip?: string): Promise<Suggestion[]> {
  let query = supabase
    .from('suggestions')
    .select('*')
    .order('created_at', { ascending: false });

  if (ip) {
    query = query.eq('ip', ip);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching suggestions:', error);
    throw error;
  }

  return (data || []).map(suggestion => ({
    id: suggestion.id,
    ip: suggestion.ip,
    title: suggestion.title,
    description: suggestion.description || '',
    severity: suggestion.severity || 0,
    suggestedCommand: suggestion.suggested_command || undefined,
    createdAt: suggestion.created_at,
    status: suggestion.status as Suggestion['status'],
    dependencies: (suggestion.dependencies as SuggestionDependency[]) || [],
  }));
}

export async function executeSuggestion(id: string): Promise<void> {
  const { error } = await supabase
    .from('suggestions')
    .update({ status: 'executed', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Error executing suggestion:', error);
    throw error;
  }
}

export async function dismissSuggestion(id: string): Promise<void> {
  const { error } = await supabase
    .from('suggestions')
    .update({ status: 'dismissed', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Error dismissing suggestion:', error);
    throw error;
  }
}

export async function fetchChatHistory(): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .order('timestamp', { ascending: true });

  if (error) {
    console.error('Error fetching chat history:', error);
    throw error;
  }

  return (data || []).map(msg => ({
    id: msg.id,
    role: msg.role as ChatMessage['role'],
    text: msg.text,
    timestamp: msg.timestamp,
  }));
}

export async function sendChatMessage(text: string): Promise<ChatMessage> {
  // Insert user message
  const { data: userData, error: userError } = await supabase
    .from('chat_messages')
    .insert({
      role: 'user',
      text,
      timestamp: new Date().toISOString(),
    })
    .select()
    .single();

  if (userError) {
    console.error('Error sending chat message:', userError);
    throw userError;
  }

  // Insert mock agent response
  const agentText = `Sure, here's what I found: "${text}" - This is a simulated response. In production, I'll provide intelligent security analysis.`;
  
  await supabase
    .from('chat_messages')
    .insert({
      role: 'agent',
      text: agentText,
      timestamp: new Date(Date.now() + 1000).toISOString(),
    });

  return {
    id: userData.id,
    role: userData.role as ChatMessage['role'],
    text: userData.text,
    timestamp: userData.timestamp,
  };
}
