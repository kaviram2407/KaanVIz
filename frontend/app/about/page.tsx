import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, ShieldCheck, Sparkles, Database } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold tracking-tight">About KaanViz</h1>
        <p className="text-sm text-muted-foreground mt-1">
          AI-Powered, AI-Optional Data Analytics & Visualization Workspace.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              AI Optionality Principle
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground leading-relaxed">
            AI is strictly an enhancement, never a dependency. All core ingestion, cleaning, modeling, visualization, and dashboard operations remain fully usable when an AI provider is offline or unconfigured.
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              Raw Data Immutability
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground leading-relaxed">
            Uploaded raw files are treated as immutable untrusted sources. Analytical transformations produce deterministic, versioned Parquet files stored separately.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
