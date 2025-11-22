import { useQuery } from "@tanstack/react-query";
import { fetchSuggestions } from "@/lib/api";
import { Suggestion } from "@/types";
import { useMemo, useState, useCallback } from "react";
import { ReactFlow, Node, Edge, Background, Controls, MiniMap, useNodesState, useEdgesState, MarkerType } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const getSeverityColor = (severity: number) => {
  if (severity >= 8) return "hsl(var(--destructive))";
  if (severity >= 5) return "hsl(var(--warning))";
  return "hsl(var(--chart-3))";
};

const getSeverityBadge = (severity: number) => {
  if (severity >= 8) return { label: "High", class: "bg-destructive text-destructive-foreground" };
  if (severity >= 5) return { label: "Medium", class: "bg-warning text-warning-foreground" };
  return { label: "Low", class: "bg-chart-3 text-chart-3-foreground" };
};

const getRelationColor = (relation: string) => {
  switch (relation.toLowerCase()) {
    case "enables": return "hsl(var(--primary))";
    case "worsens": return "hsl(var(--destructive))";
    case "blocks": return "hsl(var(--muted-foreground))";
    default: return "hsl(var(--border))";
  }
};

export default function Graph() {
  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ["suggestions"],
    queryFn: () => fetchSuggestions(),
  });

  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const nodes: Node[] = suggestions.map((suggestion, index) => ({
      id: suggestion.id,
      position: { x: (index % 3) * 350, y: Math.floor(index / 3) * 200 },
      data: {
        label: (
          <div className="p-3 space-y-2 min-w-[280px]">
            <div className="flex items-start justify-between gap-2">
              <div className="font-semibold text-sm leading-tight flex-1">
                {suggestion.title}
              </div>
              <Badge className={getSeverityBadge(suggestion.severity).class}>
                {getSeverityBadge(suggestion.severity).label}
              </Badge>
            </div>
            <div className="flex gap-2 text-xs text-muted-foreground">
              <span>S: {suggestion.severity}</span>
              <span>•</span>
              <span>{suggestion.ip}</span>
            </div>
          </div>
        ),
        suggestion,
      } as { label: React.ReactNode; suggestion: Suggestion },
      style: {
        background: "hsl(var(--card))",
        border: `2px solid ${getSeverityColor(suggestion.severity)}`,
        borderRadius: "8px",
        padding: 0,
        width: "auto",
      },
    }));

    const edges: Edge[] = [];
    suggestions.forEach((suggestion) => {
      if (suggestion.dependencies) {
        suggestion.dependencies.forEach((dep) => {
          edges.push({
            id: `${suggestion.id}-${dep.targetSuggestionId}`,
            source: suggestion.id,
            target: dep.targetSuggestionId,
            label: dep.relation,
            type: "default",
            animated: true,
            style: { stroke: getRelationColor(dep.relation), strokeWidth: 2 },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: getRelationColor(dep.relation),
            },
            labelStyle: {
              fill: "hsl(var(--foreground))",
              fontSize: 12,
              fontWeight: 500,
            },
            labelBgStyle: {
              fill: "hsl(var(--background))",
              fillOpacity: 0.9,
            },
          });
        });
      }
    });

    return { nodes, edges };
  }, [suggestions]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    const suggestionData = node.data as { label: React.ReactNode; suggestion: Suggestion };
    setSelectedSuggestion(suggestionData.suggestion);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading vulnerability graph...</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex">
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          fitView
          minZoom={0.1}
          maxZoom={2}
        >
          <Background />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              const nodeData = node.data as { label: React.ReactNode; suggestion: Suggestion };
              const severity = nodeData?.suggestion?.severity || 0;
              return getSeverityColor(severity);
            }}
            style={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
            }}
          />
        </ReactFlow>
      </div>

      {selectedSuggestion && (
        <Card className="w-96 m-4 p-6 space-y-4 overflow-y-auto">
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-semibold pr-8">{selectedSuggestion.title}</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mt-1"
              onClick={() => setSelectedSuggestion(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <span className="font-medium">IP:</span>{" "}
              <span className="text-muted-foreground">{selectedSuggestion.ip}</span>
            </div>

            <div>
              <span className="font-medium">Severity:</span>{" "}
              <Badge className={getSeverityBadge(selectedSuggestion.severity).class}>
                {selectedSuggestion.severity}/10 - {getSeverityBadge(selectedSuggestion.severity).label}
              </Badge>
            </div>

            <div>
              <span className="font-medium">Status:</span>{" "}
              <Badge variant="outline" className="capitalize">
                {selectedSuggestion.status}
              </Badge>
            </div>

            <div>
              <span className="font-medium">Description:</span>
              <p className="text-muted-foreground mt-1">{selectedSuggestion.description}</p>
            </div>

            {selectedSuggestion.suggestedCommand && (
              <div>
                <span className="font-medium">Suggested Command:</span>
                <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                  {selectedSuggestion.suggestedCommand}
                </pre>
              </div>
            )}

            {selectedSuggestion.dependencies && selectedSuggestion.dependencies.length > 0 && (
              <div>
                <span className="font-medium">Dependencies:</span>
                <div className="mt-2 space-y-1">
                  {selectedSuggestion.dependencies.map((dep, idx) => (
                    <div key={idx} className="text-xs p-2 bg-muted rounded">
                      <span className="capitalize font-medium">{dep.relation}</span> suggestion #{dep.targetSuggestionId}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              Created: {new Date(selectedSuggestion.createdAt).toLocaleString()}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
