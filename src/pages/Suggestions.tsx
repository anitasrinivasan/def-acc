import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, XCircle, Terminal } from "lucide-react";
import { toast } from "sonner";
import { SuggestionStatus } from "@/types";
import { useState } from "react";

const getSeverityColor = (severity: number) => {
  if (severity >= 8) return "text-destructive";
  if (severity >= 6) return "text-warning";
  return "text-chart-1";
};

const getSeverityLabel = (severity: number) => {
  if (severity >= 8) return "Critical";
  if (severity >= 6) return "High";
  if (severity >= 4) return "Medium";
  return "Low";
};

const statusColors: Record<SuggestionStatus, string> = {
  open: "bg-warning/10 text-warning border-warning/20",
  executed: "bg-success/10 text-success border-success/20",
  dismissed: "bg-muted text-muted-foreground border-border",
};

const statusIcons: Record<SuggestionStatus, any> = {
  open: AlertTriangle,
  executed: CheckCircle,
  dismissed: XCircle,
};

export default function Suggestions() {
  const [filter, setFilter] = useState<SuggestionStatus | "all">("all");
  const queryClient = useQueryClient();

  const { data: suggestions, isLoading } = useQuery({
    queryKey: ["suggestions", filter],
    queryFn: () =>
      api.getSuggestions(filter === "all" ? undefined : { status: filter }),
  });

  const executeMutation = useMutation({
    mutationFn: api.executeSuggestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suggestions"] });
      toast.success("Suggestion marked as executed");
    },
  });

  const dismissMutation = useMutation({
    mutationFn: api.dismissSuggestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suggestions"] });
      toast.success("Suggestion dismissed");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Loading suggestions...</div>
      </div>
    );
  }

  const sortedSuggestions = [...(suggestions || [])].sort(
    (a, b) => b.severity - a.severity
  );

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Security Suggestions</h1>
        <p className="text-muted-foreground">
          AI-powered recommendations for your infrastructure
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All
        </Button>
        <Button
          variant={filter === "open" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("open")}
        >
          Open
        </Button>
        <Button
          variant={filter === "executed" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("executed")}
        >
          Executed
        </Button>
        <Button
          variant={filter === "dismissed" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("dismissed")}
        >
          Dismissed
        </Button>
      </div>

      {/* Suggestions List */}
      <div className="space-y-4">
        {sortedSuggestions.length === 0 ? (
          <Card className="p-12 text-center">
            <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">All clear!</h3>
            <p className="text-muted-foreground">
              No {filter !== "all" ? filter : ""} suggestions at the moment.
            </p>
          </Card>
        ) : (
          sortedSuggestions.map((suggestion) => {
            const StatusIcon = statusIcons[suggestion.status];
            
            return (
              <Card key={suggestion.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertTriangle
                        className={`h-5 w-5 ${getSeverityColor(suggestion.severity)}`}
                      />
                      <h3 className="text-lg font-semibold">{suggestion.title}</h3>
                      <Badge
                        variant="outline"
                        className={`${getSeverityColor(suggestion.severity)}`}
                      >
                        {getSeverityLabel(suggestion.severity)}
                      </Badge>
                      <Badge variant="outline" className={statusColors[suggestion.status]}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {suggestion.status}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                      <span className="font-mono">{suggestion.ip}</span>
                      <span>
                        {new Date(suggestion.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <p className="text-muted-foreground mb-4">
                      {suggestion.description}
                    </p>

                    {suggestion.suggestedCommand && (
                      <div className="bg-secondary rounded-md p-3 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Terminal className="h-4 w-4 text-primary" />
                          <span className="text-xs font-semibold">
                            Suggested Command
                          </span>
                        </div>
                        <code className="text-xs font-mono text-foreground">
                          {suggestion.suggestedCommand}
                        </code>
                      </div>
                    )}
                  </div>
                </div>

                {suggestion.status === "open" && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => executeMutation.mutate(suggestion.id)}
                      disabled={executeMutation.isPending}
                    >
                      Mark as Executed
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => dismissMutation.mutate(suggestion.id)}
                      disabled={dismissMutation.isPending}
                    >
                      Dismiss
                    </Button>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
