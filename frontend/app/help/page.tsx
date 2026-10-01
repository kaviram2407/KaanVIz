"use client";

import React, { useState } from "react";
import {
  HelpCircle,
  BookOpen,
  Database,
  Wrench,
  GitFork,
  BarChart3,
  LayoutDashboard,
  Bot,
  ShieldCheck,
  Trash2,
  AlertTriangle,
  Search,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Layers,
  HardDrive,
  FileText,
  Lock,
  ChevronRight,
  Terminal,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface HelpSection {
  id: string;
  title: string;
  badge: string;
  icon: React.ElementType;
  description: string;
  content: React.ReactNode;
}

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSectionId, setActiveSectionId] = useState("getting-started");

  const sections: HelpSection[] = [
    {
      id: "getting-started",
      title: "1. Getting Started",
      badge: "Core Workflow",
      icon: BookOpen,
      description: "Understand the KaanViz architecture, 6-step analytics pipeline, and AI optionality principle.",
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            Welcome to <strong className="text-foreground">KaanViz Analytics Studio</strong>. KaanViz is a local-first, high-performance data analytics workspace designed for deterministic data ingestion, cleaning, modeling, interactive visualization, and optional AI intelligence.
          </p>

          <div className="p-4 bg-muted/40 border border-border rounded-lg space-y-2">
            <h4 className="font-bold text-foreground flex items-center gap-2 text-xs uppercase tracking-wider">
              <Layers className="h-4 w-4 text-primary" />
              The 6-Step Workspace Pipeline
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 text-xs">
              <div className="p-3 bg-background border border-border rounded-md">
                <span className="font-bold text-primary">1. Data Ingestion</span>
                <p className="mt-1">Upload raw CSV files. KaanViz automatically runs deterministic column profiling.</p>
              </div>
              <div className="p-3 bg-background border border-border rounded-md">
                <span className="font-bold text-primary">2. Prepare</span>
                <p className="mt-1">Build cleaning plans, fix data types, filter noise, and preview before/after changes.</p>
              </div>
              <div className="p-3 bg-background border border-border rounded-md">
                <span className="font-bold text-primary">3. Model</span>
                <p className="mt-1">Define multi-dataset data models, join fields, and validate relationship cardinalities.</p>
              </div>
              <div className="p-3 bg-background border border-border rounded-md">
                <span className="font-bold text-primary">4. Visualize</span>
                <p className="mt-1">Execute DuckDB analytics queries and render interactive ECharts (Bar, Line, Pie, KPI).</p>
              </div>
              <div className="p-3 bg-background border border-border rounded-md">
                <span className="font-bold text-primary">5. Dashboards</span>
                <p className="mt-1">Assemble multi-chart dashboard layouts with drag & drop grid resizing & global filters.</p>
              </div>
              <div className="p-3 bg-background border border-border rounded-md">
                <span className="font-bold text-primary">6. AI Analyst</span>
                <p className="mt-1">Ask natural language questions, receive AI visual suggestions, Explain Visual, & Insights.</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-start gap-3 text-xs text-primary">
            <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-foreground mb-0.5">The AI Optionality Guarantee</span>
              AI features in KaanViz are strictly an enhancement layer. If your AI provider is offline or unconfigured, 100% of core ingestion, preparation, modeling, charting, and dashboard operations remain fully functional.
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "data-ingestion",
      title: "2. Data Ingestion & Profiling",
      badge: "Raw Datasets",
      icon: Database,
      description: "CSV upload mechanics, physical/semantic type inference, and raw data immutability.",
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            The <strong className="text-foreground">Data Workspace</strong> allows you to upload structured CSV files and inspect automatically computed dataset statistics.
          </p>

          <div className="space-y-2">
            <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">Key Concepts:</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-xs">
              <li>
                <strong className="text-foreground">Raw Data Immutability:</strong> Uploaded CSV files are stored as read-only original source artifacts in <code className="text-primary">storage/raw/</code>. Original raw files are never overwritten.
              </li>
              <li>
                <strong className="text-foreground">Automated Dataset Profiling:</strong> Upon upload, KaanViz analyzes dataset row count, column count, null percentage, uniqueness, and statistical min/max/mean distributions.
              </li>
              <li>
                <strong className="text-foreground">Type Classification:</strong> Each column is assigned both a physical storage type (e.g. <code className="text-primary">STRING</code>, <code className="text-primary">DOUBLE</code>, <code className="text-primary">BIGINT</code>) and a semantic role (<code className="text-primary">dimension</code>, <code className="text-primary">measure</code>, or <code className="text-primary">time_dimension</code>).
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "data-preparation",
      title: "3. Dataset Preparation & Cleaning",
      badge: "Data Cleaning",
      icon: Wrench,
      description: "Preparation steps, before/after preview comparison, and versioned Parquet output.",
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            The <strong className="text-foreground">Prepare Workspace</strong> provides interactive dataset cleaning without altering your raw CSV files.
          </p>

          <div className="space-y-2">
            <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">Preparation Capabilities:</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-xs">
              <li>
                <strong className="text-foreground">Before / After Preview:</strong> Click "Preview Changes" to inspect sample output rows side-by-side before committing transformations.
              </li>
              <li>
                <strong className="text-foreground">Type Correction:</strong> Explicitly cast text columns to numbers or datetimes.
              </li>
              <li>
                <strong className="text-foreground">Null Handling:</strong> Drop null rows, fill missing values with defaults, or impute statistical aggregates.
              </li>
              <li>
                <strong className="text-foreground">String Normalization:</strong> Trim whitespace, normalize casing (UPPERCASE, lowercase), and remove invalid characters.
              </li>
              <li>
                <strong className="text-foreground">Versioned Parquet Datasets:</strong> Applying a preparation plan generates an optimized, compressed Parquet dataset version stored in <code className="text-primary">storage/processed/</code>.
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "data-modeling",
      title: "4. Data Modeling & Relationships",
      badge: "Schema & Joins",
      icon: GitFork,
      description: "Data model definitions, source/target joins, and field cardinality validation.",
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            The <strong className="text-foreground">Model Workspace</strong> connects multiple prepared datasets into a unified analytical data model.
          </p>

          <div className="space-y-2">
            <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">Modeling Rules:</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-xs">
              <li>
                <strong className="text-foreground">Dataset Bindings:</strong> Bind registered datasets to your workspace data model to expose them for cross-table analytics.
              </li>
              <li>
                <strong className="text-foreground">Relationship Definitions:</strong> Select source and target datasets, specify join keys (e.g. <code className="text-primary">customer_id</code>), and define cardinality (<code className="text-primary">one_to_many</code>, <code className="text-primary">many_to_one</code>, <code className="text-primary">one_to_one</code>).
              </li>
              <li>
                <strong className="text-foreground">Type Compatibility Verification:</strong> KaanViz validates that joined fields share compatible physical types before approving relationships.
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "visualization",
      title: "5. Analytics & Visualization",
      badge: "ECharts & DuckDB",
      icon: BarChart3,
      description: "Supported chart types, measure aggregations, server-side DuckDB execution, and display limits.",
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            The <strong className="text-foreground">Visualize Workspace</strong> converts structured analytical queries into interactive ECharts widgets.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-muted/40 border border-border rounded-md">
              <span className="font-bold text-foreground block mb-1">Supported Visual Types</span>
              <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                <li>Bar Charts (Category vs Measure)</li>
                <li>Line Charts (Time-series trends)</li>
                <li>Area Charts (Cumulative volume)</li>
                <li>Pie & Donut Charts (Part-to-whole)</li>
                <li>Scatter Plots (Numeric correlation)</li>
                <li>Table View (Detailed rows)</li>
                <li>KPI Cards (Single metric summaries)</li>
              </ul>
            </div>

            <div className="p-3 bg-muted/40 border border-border rounded-md">
              <span className="font-bold text-foreground block mb-1">Execution Engine</span>
              <p className="leading-relaxed">
                Queries are executed server-side using DuckDB/Polars for speed and zero browser memory bloat. Results are bounded to ensure fluid 60fps chart rendering.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "dashboards",
      title: "6. Dashboard Builder",
      badge: "Grid Layouts",
      icon: LayoutDashboard,
      description: "Interactive dashboard canvas, drag-and-resize grid, KPI cards, and global filters.",
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            The <strong className="text-foreground">Dashboards Workspace</strong> lets you arrange visualizations and KPI cards into responsive multi-widget dashboard layouts.
          </p>

          <div className="space-y-2">
            <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">Dashboard Features:</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-xs">
              <li>
                <strong className="text-foreground">Drag & Resize Grid:</strong> Move and resize widgets using a 12-column fluid layout grid.
              </li>
              <li>
                <strong className="text-foreground">KPI Cards:</strong> Add standalone metric cards with custom aggregations (SUM, AVG, MIN, MAX, COUNT).
              </li>
              <li>
                <strong className="text-foreground">Global Filters & Cross-Filtering:</strong> Apply date range or category filters that update all widgets on the dashboard canvas simultaneously.
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "ai-analyst",
      title: "7. AI Analyst & Natural Language Q&A",
      badge: "NVIDIA Nemotron",
      icon: Bot,
      description: "Natural language query translation, prompt-to-visual, Explain Visual, and AI Insights.",
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            The <strong className="text-foreground">AI Analyst</strong> is powered by NVIDIA Nemotron (<code className="text-primary">nvidia/nemotron-3-super-120b-a12b</code>) to provide natural-language data exploration.
          </p>

          <div className="space-y-2">
            <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">AI Analyst Capabilities:</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-xs">
              <li>
                <strong className="text-foreground">Natural Language Q&A:</strong> Ask plain questions like <em>"What were the top 5 regions by total revenue?"</em>. AI translates your question into a structured <code className="text-primary">AnalyticsQueryIntent</code> JSON object, which is then executed deterministically by DuckDB.
              </li>
              <li>
                <strong className="text-foreground">Prompt-to-Visual Generation:</strong> Request chart ideas like <em>"Build a line chart showing monthly sales trends"</em>. Review the suggested visual spec and click "Approve Visual" to add it directly to your workspace.
              </li>
              <li>
                <strong className="text-foreground">Explain Visual:</strong> Select any existing chart and click "Explain Visual" to receive a grounded, natural-language explanation of trends, outliers, and key patterns.
              </li>
              <li>
                <strong className="text-foreground">AI Insights Engine:</strong> Discover key dataset insights (severity breakdown, evidence lists, and related fields) generated directly from your analytics query results.
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "ai-safety",
      title: "8. AI Safety & Data Governance",
      badge: "Security & Privacy",
      icon: ShieldCheck,
      description: "Structural validation, prompt-injection defenses, raw data protection, and API key security.",
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            KaanViz enforces strict AI security boundaries to protect data privacy and guarantee application stability.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-muted/40 border border-border rounded-md">
              <span className="font-bold text-foreground block mb-1">Structural Validation</span>
              <p>
                All LLM outputs are parsed and validated against strict Pydantic JSON schemas. AI never outputs arbitrary SQL, JavaScript, HTML, or executable code.
              </p>
            </div>

            <div className="p-3 bg-muted/40 border border-border rounded-md">
              <span className="font-bold text-foreground block mb-1">Bounded Context</span>
              <p>
                Only dataset column metadata (names, physical types) and query intent specifications are sent to NVIDIA API endpoints. Raw dataset rows are never transmitted.
              </p>
            </div>

            <div className="p-3 bg-muted/40 border border-border rounded-md">
              <span className="font-bold text-foreground block mb-1">Backend API Key Isolation</span>
              <p>
                The API key (<code className="text-primary">NVIDIA_API_KEY</code>) resides exclusively in backend server memory and is never rendered in client HTML, JavaScript bundles, or network logs.
              </p>
            </div>

            <div className="p-3 bg-muted/40 border border-border rounded-md">
              <span className="font-bold text-foreground block mb-1">Sliding Window Rate Limiter</span>
              <p>
                The backend enforces a sliding-window rate limit (30 requests/minute per client IP) on all AI endpoints to prevent service overload.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "dataset-deletion",
      title: "9. Dataset Management & Deletion",
      badge: "Cleanup",
      icon: Trash2,
      description: "Single dataset deletion, Clear Workspace Data nuclear action, and cascading cleanup rules.",
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <p>
            KaanViz provides robust data lifecycle tools for removing datasets and resetting workspace state.
          </p>

          <div className="space-y-2">
            <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider">Deletion Operations:</h4>
            <ul className="list-disc pl-5 space-y-1.5 text-xs">
              <li>
                <strong className="text-foreground">Single Dataset Deletion:</strong> Click "Delete Dataset" in the Data page to purge the raw CSV file, versioned Parquet artifacts, profiles, transformations, model bindings, relationships, and associated visual widgets.
              </li>
              <li>
                <strong className="text-foreground">Clear Workspace Data:</strong> Use the nuclear workspace cleanup control in Data page to reset all workspace data to a clean state.
              </li>
              <li>
                <strong className="text-foreground">Confirmation Shield:</strong> Both deletion operations require explicit modal user confirmation to prevent accidental data loss.
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "troubleshooting",
      title: "10. Troubleshooting & FAQs",
      badge: "Guide",
      icon: AlertTriangle,
      description: "Quick solutions for CSV upload errors, type mismatch warnings, AI service offline, and empty visual results.",
      content: (
        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
          <div className="space-y-3">
            <div className="p-3 bg-background border border-border rounded-md space-y-1">
              <span className="font-bold text-foreground text-xs block">Issue: CSV Upload Fails or File Rejected</span>
              <p className="text-xs">
                Ensure your file has a <code className="text-primary">.csv</code> extension and contains valid comma-separated plain text. Empty files or non-CSV binary formats are rejected.
              </p>
            </div>

            <div className="p-3 bg-background border border-border rounded-md space-y-1">
              <span className="font-bold text-foreground text-xs block">Issue: AI Analyst Displays "AI Disabled / Unconfigured"</span>
              <p className="text-xs">
                Check the <strong className="text-foreground">Settings</strong> page. Verify that AI is toggled to "Enabled" and click "Test Connection" to confirm your NVIDIA API key is valid.
              </p>
            </div>

            <div className="p-3 bg-background border border-border rounded-md space-y-1">
              <span className="font-bold text-foreground text-xs block">Issue: Empty Chart or No Data Rendered</span>
              <p className="text-xs">
                Verify that your dataset preparation plan was applied and that the selected dimension and measure fields contain non-null numeric values.
              </p>
            </div>

            <div className="p-3 bg-background border border-border rounded-md space-y-1">
              <span className="font-bold text-foreground text-xs block">Issue: Relationship Cannot Be Created</span>
              <p className="text-xs">
                Ensure both source and target datasets are bound to the data model and that the joined key fields share matching data types.
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const filteredSections = sections.filter(
    (sec) =>
      sec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sec.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sec.badge.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeSection = sections.find((s) => s.id === activeSectionId) || sections[0];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-primary">
            <HelpCircle className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Help & Documentation Center</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Comprehensive user guide, pipeline documentation, chart references, and AI safety policies.
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search documentation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search documentation sections"
            className="w-full pl-9 pr-3 py-2 bg-background border border-input rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Main Documentation Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Left Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-2 sticky top-4" role="navigation" aria-label="Documentation Categories">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2 block mb-2">
            Categories ({filteredSections.length})
          </span>
          <div className="space-y-1">
            {filteredSections.map((sec) => {
              const Icon = sec.icon;
              const isActive = activeSectionId === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSectionId(sec.id)}
                  className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary-foreground" : "text-primary"}`} />
                    <span className="truncate">{sec.title}</span>
                  </div>
                  <ChevronRight className={`h-3.5 w-3.5 shrink-0 opacity-60 ${isActive ? "rotate-90" : ""}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Documentation Detail Card */}
        <div className="lg:col-span-3 space-y-6">
          {filteredSections.length === 0 ? (
            <Card className="border-dashed text-center py-12">
              <CardContent>
                <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto mb-2" />
                <p className="font-semibold text-sm text-foreground">No matching documentation topics found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try searching for terms like "CSV", "duckdb", "insights", or "deletion".
                </p>
                <Button variant="outline" size="sm" onClick={() => setSearchQuery("")} className="mt-4">
                  Clear Search Filter
                </Button>
              </CardContent>
            </Card>
          ) : (
            sections
              .filter((sec) => filteredSections.some((f) => f.id === sec.id))
              .map((sec) => {
                const Icon = sec.icon;
                const isSelected = activeSectionId === sec.id;
                return (
                  <Card
                    key={sec.id}
                    id={sec.id}
                    className={`border-border transition-all ${
                      isSelected ? "ring-2 ring-primary/40 bg-card" : "bg-card/60"
                    }`}
                  >
                    <CardHeader className="border-b border-border pb-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-base font-bold">{sec.title}</CardTitle>
                            <CardDescription className="text-xs">{sec.description}</CardDescription>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20 shrink-0">
                          {sec.badge}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-5">{sec.content}</CardContent>
                  </Card>
                );
              })
          )}
        </div>
      </div>
    </div>
  );
}
