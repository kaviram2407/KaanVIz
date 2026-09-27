"use client";

import { useHealth } from "@/hooks/use-health";
import { Badge } from "@/components/ui/badge";
import { Activity, Server, Database, HardDrive, Sparkles } from "lucide-react";

export function HealthIndicator() {
  const { health, loading } = useHealth();

  if (loading) {
    return (
      <Badge variant="outline" className="animate-pulse flex items-center gap-1.5 text-xs">
        <Activity className="h-3 w-3 animate-spin text-muted-foreground" />
        Checking system...
      </Badge>
    );
  }

  const isHealthy = health?.status === "healthy";
  const isUnreachable = health?.status === "unreachable";

  return (
    <div className="flex items-center gap-2 text-xs">
      <Badge
        variant={isHealthy ? "success" : isUnreachable ? "warning" : "outline"}
        className="flex items-center gap-1.5 font-medium"
      >
        <span
          className={`h-2 w-2 rounded-full ${
            isHealthy
              ? "bg-emerald-500"
              : isUnreachable
              ? "bg-amber-500"
              : "bg-destructive"
          }`}
        />
        Backend: {health?.status || "unknown"}
      </Badge>

      <div className="hidden md:flex items-center gap-2 text-muted-foreground text-[11px]">
        <span className="flex items-center gap-1" title={health?.database?.message}>
          <Database className="h-3 w-3" />
          DB: {health?.database?.status}
        </span>
        <span className="flex items-center gap-1" title={health?.redis?.message}>
          <Server className="h-3 w-3" />
          Redis: {health?.redis?.status}
        </span>
        <span className="flex items-center gap-1" title={health?.storage?.message}>
          <HardDrive className="h-3 w-3" />
          Storage: {health?.storage?.status}
        </span>
        <span className="flex items-center gap-1" title={health?.ai?.message}>
          <Sparkles className="h-3 w-3" />
          AI: {health?.ai?.status}
        </span>
      </div>
    </div>
  );
}
