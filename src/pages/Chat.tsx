import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchChatHistory, sendChatMessage } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, User, Terminal } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { ChatMessageRole } from "@/types";

const roleIcons: Record<ChatMessageRole, any> = {
  user: User,
  agent: Bot,
  system: Terminal,
};

const roleColors: Record<ChatMessageRole, string> = {
  user: "bg-primary/10 border-primary/20",
  agent: "bg-secondary border-border",
  system: "bg-muted/50 border-muted",
};

export default function Chat() {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: messages } = useQuery({
    queryKey: ["chat"],
    queryFn: () => fetchChatHistory(),
  });

  const sendMutation = useMutation({
    mutationFn: sendChatMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat"] });
      setInput("");
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMutation.mutate(input);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="container mx-auto px-6 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Security Agent Chat</h1>
        <p className="text-muted-foreground">
          Ask questions and get AI-powered security insights
        </p>
      </div>

      <Card className="flex flex-col h-[600px]">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages?.map((message) => {
            const Icon = roleIcons[message.role];
            const isUser = message.role === "user";

            return (
              <div
                key={message.id}
                className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    isUser ? "bg-primary" : "bg-secondary"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <div className={`flex-1 ${isUser ? "text-right" : ""}`}>
                  <div
                    className={`inline-block max-w-[80%] rounded-lg border p-4 ${
                      roleColors[message.role]
                    }`}
                  >
                    {message.role === "system" && (
                      <div className="flex items-center gap-2 mb-2">
                        <Terminal className="h-3 w-3" />
                        <span className="text-xs font-semibold uppercase">
                          System
                        </span>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  </div>

                  <div className="text-xs text-muted-foreground mt-1 px-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border p-4">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your infrastructure security..."
              disabled={sendMutation.isPending}
              className="flex-1"
            />
            <Button type="submit" disabled={sendMutation.isPending || !input.trim()}>
              Send
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
