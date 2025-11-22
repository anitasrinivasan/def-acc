import { useQuery } from "@tanstack/react-query";
import { fetchState } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Circle, ArrowRight } from "lucide-react";
import { Tier } from "@/types";

const tierLabels: Record<Tier, string> = {
  dc: "Domain Controller",
  web: "Web Server",
  app: "Application",
  db: "Database",
  other: "Other",
};

const tierColors: Record<Tier, string> = {
  dc: "text-chart-1 border-chart-1/20",
  web: "text-chart-2 border-chart-2/20",
  app: "text-chart-3 border-chart-3/20",
  db: "text-chart-4 border-chart-4/20",
  other: "text-muted-foreground border-border",
};

export default function Graph() {
  const { data: hosts, isLoading } = useQuery({
    queryKey: ["hosts"],
    queryFn: fetchState,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Loading infrastructure graph...</div>
      </div>
    );
  }

  // Group hosts by tier
  const hostsByTier = (hosts || []).reduce((acc, host) => {
    const tier = host.tier || "other";
    if (!acc[tier]) acc[tier] = [];
    acc[tier].push(host);
    return acc;
  }, {} as Record<Tier, typeof hosts>);

  const tiers: Tier[] = ["dc", "web", "app", "db", "other"];

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Infrastructure Graph</h1>
        <p className="text-muted-foreground">
          Hosts grouped by tier with dependency relationships
        </p>
      </div>

      {/* Multi-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {tiers.map((tier) => {
          const tierHosts = hostsByTier[tier] || [];
          
          // Skip empty tiers
          if (tierHosts.length === 0) return null;

          return (
            <div key={tier} className="space-y-4">
              {/* Tier Header */}
              <div className="sticky top-0 bg-background pb-2 z-10">
                <h2 className={`text-sm font-semibold uppercase tracking-wider ${tierColors[tier]}`}>
                  {tierLabels[tier]}
                </h2>
                <Badge variant="outline" className="text-xs mt-1">
                  {tierHosts.length} {tierHosts.length === 1 ? "host" : "hosts"}
                </Badge>
              </div>

              {/* Host Cards */}
              <div className="space-y-3">
                {tierHosts.map((host) => (
                  <Card key={host.ip} className="p-4">
                    {/* Host Info */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-sm font-semibold">
                          {host.label || host.ip}
                        </span>
                        <Circle
                          className={`h-2.5 w-2.5 ${
                            host.status === "online"
                              ? "text-success fill-success"
                              : "text-destructive fill-destructive"
                          }`}
                        />
                      </div>
                      
                      <div className="font-mono text-xs text-muted-foreground mb-2">
                        {host.ip}
                      </div>

                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          host.status === "online"
                            ? "bg-success/10 text-success border-success/20"
                            : "bg-destructive/10 text-destructive border-destructive/20"
                        }`}
                      >
                        {host.status || "unknown"}
                      </Badge>
                    </div>

                    {/* Dependencies */}
                    {host.dependencies && host.dependencies.length > 0 && (
                      <div className="pt-3 border-t border-border">
                        <div className="flex items-center gap-1 mb-2">
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs font-semibold text-muted-foreground">
                            Depends on:
                          </span>
                        </div>
                        <div className="space-y-1">
                          {host.dependencies.map((dep, idx) => (
                            <div
                              key={idx}
                              className="text-xs font-mono text-muted-foreground pl-4"
                            >
                              {dep.targetIp}{" "}
                              <span className="text-primary">({dep.service})</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {hosts && hosts.length === 0 && (
        <Card className="p-12 text-center">
          <h3 className="text-xl font-semibold mb-2">No hosts found</h3>
          <p className="text-muted-foreground">
            Add hosts to see the infrastructure graph
          </p>
        </Card>
      )}
    </div>
  );
}
