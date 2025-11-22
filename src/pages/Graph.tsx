import { useQuery } from "@tanstack/react-query";
import { fetchState } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Network, Circle } from "lucide-react";
import { useMemo } from "react";

export default function Graph() {
  const { data: hosts, isLoading } = useQuery({
    queryKey: ["hosts"],
    queryFn: fetchState,
  });

  // Build network graph data from hosts and dependencies
  const graphData = useMemo(() => {
    if (!hosts) return { nodes: [], edges: [] };

    const nodes = hosts.map((host) => ({
      id: host.ip,
      label: host.label || host.ip,
      tier: host.tier,
      status: host.status,
    }));

    const edges = hosts
      .filter((host) => host.dependencies && host.dependencies.length > 0)
      .flatMap((host) =>
        host.dependencies!.map((dep) => ({
          source: host.ip,
          target: dep.targetIp,
          service: dep.service,
        }))
      );

    return { nodes, edges };
  }, [hosts]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-muted-foreground">Loading network graph...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Network Graph</h1>
        <p className="text-muted-foreground">
          Visualize infrastructure dependencies and relationships
        </p>
      </div>

      <Card className="p-8">
        <div className="flex items-center justify-center mb-6">
          <Network className="h-12 w-12 text-primary" />
        </div>

        <div className="text-center mb-8">
          <h3 className="text-xl font-semibold mb-2">Interactive Graph Coming Soon</h3>
          <p className="text-muted-foreground">
            Full network visualization with D3.js or React Flow will be implemented here
          </p>
        </div>

        {/* Simple text-based representation */}
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-semibold mb-3 text-primary">Nodes</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {graphData.nodes.map((node) => (
                <div
                  key={node.id}
                  className="flex items-center gap-2 p-3 rounded-md bg-secondary border border-border"
                >
                  <Circle
                    className={`h-3 w-3 flex-shrink-0 ${
                      node.status === "online"
                        ? "text-success fill-success"
                        : "text-destructive fill-destructive"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm font-semibold truncate">
                      {node.label}
                    </div>
                    <div className="font-mono text-xs text-muted-foreground">
                      {node.id}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {graphData.edges.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-3 text-primary">
                Dependencies
              </h4>
              <div className="space-y-2">
                {graphData.edges.map((edge, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 rounded-md bg-secondary border border-border font-mono text-sm"
                  >
                    <span className="text-foreground">{edge.source}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="text-foreground">{edge.target}</span>
                    <span className="ml-auto text-xs text-muted-foreground px-2 py-1 bg-muted rounded">
                      {edge.service}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 p-4 bg-muted rounded-md">
          <p className="text-xs text-muted-foreground">
            <strong>Note:</strong> This is a placeholder representation. A full interactive
            graph with pan, zoom, and drag capabilities can be built using libraries like
            React Flow, D3.js, or Vis.js.
          </p>
        </div>
      </Card>
    </div>
  );
}
