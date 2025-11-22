import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, Circle, Network } from "lucide-react";
import { Tier } from "@/types";

const tierLabels: Record<Tier, string> = {
  dc: "Domain Controller",
  web: "Web Server",
  app: "Application",
  db: "Database",
  other: "Other",
};

const tierColors: Record<Tier, string> = {
  dc: "text-chart-1",
  web: "text-chart-2",
  app: "text-chart-3",
  db: "text-chart-4",
  other: "text-muted-foreground",
};

export default function Dashboard() {
  const { data: hosts, isLoading } = useQuery({
    queryKey: ["hosts"],
    queryFn: api.getHosts,
  });

  const { data: suggestions } = useQuery({
    queryKey: ["suggestions"],
    queryFn: () => api.getSuggestions({ status: "open" }),
  });

  const openSuggestions = suggestions?.filter(s => s.status === "open").length || 0;
  const onlineHosts = hosts?.filter(h => h.status === "online").length || 0;
  const totalHosts = hosts?.length || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Loading infrastructure...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Infrastructure Overview</h1>
        <p className="text-muted-foreground">Real-time monitoring and security analysis</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Hosts</p>
              <p className="text-3xl font-bold">{totalHosts}</p>
            </div>
            <Server className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Online</p>
              <p className="text-3xl font-bold text-success">{onlineHosts}</p>
            </div>
            <Circle className="h-8 w-8 text-success fill-success" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Open Suggestions</p>
              <p className="text-3xl font-bold text-warning">{openSuggestions}</p>
            </div>
            <Network className="h-8 w-8 text-warning" />
          </div>
        </Card>
      </div>

      {/* Hosts by Tier */}
      <div className="space-y-6">
        {Object.entries(
          hosts?.reduce((acc, host) => {
            const tier = host.tier || "other";
            if (!acc[tier]) acc[tier] = [];
            acc[tier].push(host);
            return acc;
          }, {} as Record<Tier, typeof hosts>)
        ).map(([tier, tierHosts]) => (
          <div key={tier}>
            <div className="flex items-center gap-2 mb-3">
              <h2 className={`text-lg font-semibold ${tierColors[tier as Tier]}`}>
                {tierLabels[tier as Tier]}
              </h2>
              <Badge variant="secondary" className="text-xs">
                {tierHosts.length}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tierHosts.map((host) => (
                <Card key={host.ip} className="p-4 hover:border-primary transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-semibold">
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
                  </div>

                  {host.state && Object.keys(host.state).length > 0 && (
                    <div className="space-y-1 mb-3">
                      {Object.entries(host.state).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground capitalize">{key}</span>
                          <span className="font-mono font-semibold">
                            {typeof value === "number" ? `${value}%` : value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {host.dependencies && host.dependencies.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      <span className="font-semibold">Dependencies:</span>{" "}
                      {host.dependencies.map(d => d.service).join(", ")}
                    </div>
                  )}

                  {host.lastSeen && (
                    <div className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
                      Last seen: {new Date(host.lastSeen).toLocaleString()}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
