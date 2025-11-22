import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchState, fetchSuggestions, executeSuggestion, dismissSuggestion } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Circle, Terminal, AlertTriangle, Play, X, Search } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { HostState, Suggestion, Tier } from "@/types";
import { formatDistanceToNow } from "date-fns";

const tierColors: Record<Tier, string> = {
  dc: "bg-chart-1/10 text-chart-1 border-chart-1/20",
  web: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  app: "bg-chart-3/10 text-chart-3 border-chart-3/20",
  db: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  other: "bg-muted text-muted-foreground border-border",
};

const getSeverityColor = (severity: number) => {
  if (severity >= 8) return "text-destructive";
  if (severity >= 5) return "text-warning";
  return "text-chart-3";
};

const getSeverityBadge = (severity: number) => {
  if (severity >= 8) return { label: "High", className: "bg-destructive/10 text-destructive border-destructive/20" };
  if (severity >= 5) return { label: "Medium", className: "bg-warning/10 text-warning border-warning/20" };
  return { label: "Low", className: "bg-chart-3/10 text-chart-3 border-chart-3/20" };
};

export default function Dashboard() {
  const [selectedHost, setSelectedHost] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  const { data: hosts, isLoading: hostsLoading } = useQuery({
    queryKey: ["hosts"],
    queryFn: fetchState,
  });

  const { data: allSuggestions, isLoading: suggestionsLoading } = useQuery({
    queryKey: ["suggestions"],
    queryFn: () => fetchSuggestions(),
  });

  const executeMutation = useMutation({
    mutationFn: executeSuggestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suggestions"] });
      toast.success("Suggestion executed");
    },
    onError: () => {
      toast.error("Failed to execute suggestion");
    },
  });

  const dismissMutation = useMutation({
    mutationFn: dismissSuggestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suggestions"] });
      toast.success("Suggestion dismissed");
    },
    onError: () => {
      toast.error("Failed to dismiss suggestion");
    },
  });

  // Filter hosts and suggestions based on search query
  const { filteredHosts, filteredSuggestions } = useMemo(() => {
    if (!hosts || !allSuggestions) {
      return { filteredHosts: [], filteredSuggestions: [] };
    }

    const query = searchQuery.toLowerCase().trim();
    
    if (!query) {
      return { filteredHosts: hosts, filteredSuggestions: allSuggestions };
    }

    const filteredH = hosts.filter(
      (host) =>
        host.ip.toLowerCase().includes(query) ||
        host.label?.toLowerCase().includes(query)
    );

    const filteredS = allSuggestions.filter(
      (suggestion) =>
        suggestion.title.toLowerCase().includes(query) ||
        suggestion.description.toLowerCase().includes(query)
    );

    return { filteredHosts: filteredH, filteredSuggestions: filteredS };
  }, [hosts, allSuggestions, searchQuery]);

  // Count open suggestions per host
  const suggestionCountByHost = useMemo(() => {
    if (!allSuggestions) return {};
    
    return allSuggestions.reduce((acc, suggestion) => {
      if (suggestion.status === "open") {
        acc[suggestion.ip] = (acc[suggestion.ip] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
  }, [allSuggestions]);

  // Get suggestions for selected host
  const selectedHostSuggestions = useMemo(() => {
    if (!selectedHost || !filteredSuggestions) return [];
    return filteredSuggestions.filter((s) => s.ip === selectedHost);
  }, [selectedHost, filteredSuggestions]);

  // Auto-select first host when hosts load
  useEffect(() => {
    if (filteredHosts.length > 0 && !selectedHost) {
      setSelectedHost(filteredHosts[0].ip);
    }
  }, [filteredHosts, selectedHost]);

  if (hostsLoading || suggestionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor hosts and manage security suggestions
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search hosts or suggestions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Panel: Hosts List */}
        <div className="lg:col-span-5">
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-4">Hosts</h2>
            
            {filteredHosts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hosts found
              </div>
            ) : (
              <div className="space-y-2">
                {filteredHosts.map((host) => {
                  const openCount = suggestionCountByHost[host.ip] || 0;
                  const isSelected = selectedHost === host.ip;

                  return (
                    <button
                      key={host.ip}
                      onClick={() => setSelectedHost(host.ip)}
                      className={`w-full text-left p-4 rounded-lg border transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50 hover:bg-secondary"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono font-semibold text-sm">
                              {host.label || host.ip}
                            </span>
                            <Circle
                              className={`h-2 w-2 ${
                                host.status === "online"
                                  ? "text-success fill-success"
                                  : "text-destructive fill-destructive"
                              }`}
                            />
                          </div>
                          <span className="font-mono text-xs text-muted-foreground">
                            {host.ip}
                          </span>
                        </div>

                        {openCount > 0 && (
                          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                            {openCount}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {host.tier && (
                          <Badge variant="outline" className={`text-xs ${tierColors[host.tier]}`}>
                            {host.tier.toUpperCase()}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {host.status || "unknown"}
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right Panel: Suggestions for Selected Host */}
        <div className="lg:col-span-7">
          <Card className="p-4">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">
                Suggestions for{" "}
                <span className="font-mono text-primary">
                  {selectedHost
                    ? hosts?.find((h) => h.ip === selectedHost)?.label || selectedHost
                    : "No host selected"}
                </span>
              </h2>
            </div>

            {!selectedHost ? (
              <div className="text-center py-12 text-muted-foreground">
                Select a host to view suggestions
              </div>
            ) : selectedHostSuggestions.length === 0 ? (
              <div className="text-center py-12">
                <Circle className="h-12 w-12 text-success mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No suggestions</h3>
                <p className="text-muted-foreground text-sm">
                  This host has no open suggestions
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
                {selectedHostSuggestions.map((suggestion) => {
                  const severityBadge = getSeverityBadge(suggestion.severity);
                  const isActionPending =
                    executeMutation.isPending || dismissMutation.isPending;

                  return (
                    <Card key={suggestion.id} className="p-4 border-border">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <AlertTriangle
                            className={`h-4 w-4 ${getSeverityColor(suggestion.severity)}`}
                          />
                          <h3 className="font-semibold">{suggestion.title}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={severityBadge.className}>
                            {severityBadge.label}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {suggestion.status}
                          </Badge>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mb-3">
                        {suggestion.description}
                      </p>

                      {suggestion.suggestedCommand && (
                        <div className="bg-secondary rounded-md p-3 mb-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Terminal className="h-3 w-3 text-primary" />
                            <span className="text-xs font-semibold">Suggested Command</span>
                          </div>
                          <code className="text-xs font-mono block text-foreground break-all">
                            {suggestion.suggestedCommand}
                          </code>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                        <span>
                          Created {formatDistanceToNow(new Date(suggestion.createdAt), { addSuffix: true })}
                        </span>
                        <span className="font-mono">Severity: {suggestion.severity}/10</span>
                      </div>

                      {suggestion.status === "open" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => executeMutation.mutate(suggestion.id)}
                            disabled={isActionPending}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Run command
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => dismissMutation.mutate(suggestion.id)}
                            disabled={isActionPending}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Dismiss
                          </Button>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
