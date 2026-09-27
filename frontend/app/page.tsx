import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Database,
  Wrench,
  GitFork,
  BarChart3,
  LayoutDashboard,
  Bot,
  CheckCircle2,
  Layers,
} from "lucide-react";
import Link from "next/link";

const WORKSPACE_STEPS = [
  {
    phase: "Phase 2",
    title: "1. Data Ingestion",
    description: "Upload CSV, file validation, metadata extraction & raw immutable storage.",
    icon: Database,
    href: "/data",
  },
  {
    phase: "Phase 3-4",
    title: "2. Profile & Prepare",
    description: "Quality statistics, type correction, duplicate handling & Parquet storage.",
    icon: Wrench,
    href: "/prepare",
  },
  {
    phase: "Phase 5",
    title: "3. Data Modeling",
    description: "Multi-table relationship creation, cardinality definitions & model validation.",
    icon: GitFork,
    href: "/model",
  },
  {
    phase: "Phase 6",
    title: "4. Visualization",
    description: "Apache ECharts canvas, custom metrics, aggregations & specification validation.",
    icon: BarChart3,
    href: "/visualize",
  },
  {
    phase: "Phase 7",
    title: "5. Dashboards",
    description: "Grid layouts, interactive slicers, cross-filtering & dashboard export.",
    icon: LayoutDashboard,
    href: "/dashboards",
  },
  {
    phase: "Phase 8",
    title: "6. AI Analyst",
    description: "Natural-language query, prompt-to-visual, visual explanations & insights.",
    icon: Bot,
    href: "/ai-analyst",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            KaanViz Analytics Studio
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            AI-powered, AI-optional data analytics & visualization workspace foundation.
          </p>
        </div>
        <Badge variant="success" className="w-fit px-3 py-1 text-xs">
          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
          Phase 1 — Setup Complete
        </Badge>
      </div>

      <Card className="bg-card/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <CardTitle>Architecture Status & Roadmap Boundaries</CardTitle>
          </div>
          <CardDescription>
            KaanViz is being implemented strictly in dependency order. The application foundation is initialized.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-md border border-border bg-background">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Frontend Stack
              </span>
              <p className="font-medium text-sm mt-1">Next.js 14 + React + TypeScript</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tailwind CSS, shadcn/ui, ECharts & React Grid Layout
              </p>
            </div>
            <div className="p-4 rounded-md border border-border bg-background">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Backend Stack
              </span>
              <p className="font-medium text-sm mt-1">FastAPI + Python 3.11</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                SQLAlchemy 2.0, Alembic, Pydantic v2 & Pytest
              </p>
            </div>
            <div className="p-4 rounded-md border border-border bg-background">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Analytics & DB
              </span>
              <p className="font-medium text-sm mt-1">PostgreSQL + Redis + DuckDB/Polars</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Local filesystem Parquet storage abstractions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold tracking-tight mb-3">
          Workspace Navigation Foundations
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {WORKSPACE_STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <Link key={step.title} href={step.href} className="group">
                <Card className="h-full transition-all group-hover:border-primary/50 group-hover:shadow-sm">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-md bg-muted text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                        <Icon className="h-4 w-4" />
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {step.phase}
                      </Badge>
                    </div>
                    <CardTitle className="text-base mt-2">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <CardDescription className="text-xs line-clamp-2">
                      {step.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
