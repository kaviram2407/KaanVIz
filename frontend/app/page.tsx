"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Database,
  FileSpreadsheet,
  FolderOpen,
  GitFork,
  Plus,
  Sparkles,
  Upload,
  Wrench,
  RefreshCw,
  AlertTriangle,
  Layers,
  LayoutDashboard,
  ShieldCheck,
  CheckCircle2,
  HardDrive,
} from "lucide-react";
import {
  DatasetItem,
  DashboardItemResponse,
  DataModelDetailsResponse,
  HealthResponse,
  fetchWorkspaceDatasets,
  fetchWorkspaceDashboards,
  fetchWorkspaceDataModel,
  fetchBackendHealth,
} from "@/lib/api-client";
import { fetchAIStatus, AIAvailabilityResponse } from "@/lib/ai-api";

export default function HomePage() {
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [dashboards, setDashboards] = useState<DashboardItemResponse[]>([]);
  const [model, setModel] = useState<DataModelDetailsResponse | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [aiStatus, setAiStatus] = useState<AIAvailabilityResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWorkspaceData();
  }, []);

  const loadWorkspaceData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dsList, dbList, modelData, healthData, aiData] = await Promise.all([
        fetchWorkspaceDatasets().catch(() => []),
        fetchWorkspaceDashboards().catch(() => []),
        fetchWorkspaceDataModel().catch(() => null),
        fetchBackendHealth().catch(() => null),
        fetchAIStatus().catch(() => null),
      ]);

      setDatasets(Array.isArray(dsList) ? dsList : (dsList as any)?.items || []);
      setDashboards(Array.isArray(dbList) ? dbList : (dbList as any)?.items || []);
      setModel(modelData);
      setHealth(healthData);
      setAiStatus(aiData);
    } catch (err: any) {
      setError(err.message || "Failed to load workspace information.");
    } finally {
      setLoading(false);
    }
  };

  const isAIEnabled = aiStatus?.enabled ?? false;

  return (
    <div className="mx-auto max-w-7xl space-y-8 font-sans">
      {/* Page heading */}
      <section className="border-b border-[var(--kaan-ink)] pb-6 font-mono">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="retro-label mb-3 text-[var(--kaan-green)]">
              Workspace / Overview
            </div>

            <h1 className="text-4xl font-black tracking-[-0.05em] sm:text-5xl uppercase font-mono">
              Your analytics
              <br />
              <span className="text-[var(--kaan-green)]">
                workspace.
              </span>
            </h1>

            <p className="mt-4 max-w-xl text-xs leading-relaxed text-[var(--muted-foreground)] font-sans">
              Bring your data in. Prepare it. Build the visual model.
              Then leverage DuckDB analytics and optional NVIDIA AI to discover key findings.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ButtonRefresh onRefresh={loadWorkspaceData} loading={loading} />
            <Link
              href="/data"
              className="group flex w-fit items-center gap-3 border border-[var(--kaan-ink)] bg-[var(--kaan-green)] px-5 py-3 text-xs font-mono font-bold uppercase tracking-wider text-white shadow-[4px_4px_0_var(--kaan-ink)] transition-all hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_var(--kaan-ink)]"
            >
              <Plus className="h-4 w-4" />
              Bring Data
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Error Alert */}
      {error && (
        <div className="p-4 border border-[var(--kaan-ink)] bg-[#FDF0ED] text-[var(--kaan-ink)] text-xs font-mono shadow-[3px_3px_0_var(--kaan-ink)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[var(--kaan-coral)] shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
          <button
            onClick={loadWorkspaceData}
            className="text-xs font-bold uppercase underline hover:text-black"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Workspace Summary Telemetry Cards */}
      <section className="font-mono">
        <div className="mb-3 flex items-center justify-between">
          <div className="retro-label">My Workspaces & Telemetry</div>
          <span className="text-[10px] text-[var(--muted-foreground)] uppercase">
            {loading ? "Syncing..." : `${datasets.length} Datasets · ${dashboards.length} Dashboards`}
          </span>
        </div>

        {loading ? (
          <div className="grid gap-4 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-44 border border-[var(--kaan-ink)] bg-[var(--kaan-cream)] p-5 shadow-[4px_4px_0_var(--kaan-ink)] animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Workspace Card 1: Data Shelf */}
            <Link href="/data" className="group">
              <article className="relative h-full min-h-[190px] overflow-hidden border border-[var(--kaan-ink)] bg-[var(--kaan-paper)] p-5 shadow-[4px_4px_0_var(--kaan-ink)] transition-all group-hover:-translate-y-1 group-hover:shadow-[6px_7px_0_var(--kaan-ink)]">
                <div className="absolute right-0 top-0 h-3 w-24 bg-[var(--kaan-teal)]" />
                <div className="mb-6 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center border border-[var(--kaan-ink)] bg-[var(--kaan-teal)] text-white">
                    <Database className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
                <h2 className="text-base font-bold uppercase tracking-tight text-[var(--kaan-ink)]">
                  Data Workbench
                </h2>
                <p className="mt-1 text-[10px] leading-relaxed text-[var(--muted-foreground)]">
                  Raw dataset ingestion, column profiling & immutability storage.
                </p>
                <div className="mt-5 flex gap-4 text-[10px] font-bold uppercase tracking-wider text-[var(--kaan-ink)]">
                  <span>{datasets.length} Tables Registered</span>
                </div>
              </article>
            </Link>

            {/* Workspace Card 2: Visual Dashboards */}
            <Link href="/dashboards" className="group">
              <article className="relative h-full min-h-[190px] overflow-hidden border border-[var(--kaan-ink)] bg-[var(--kaan-paper)] p-5 shadow-[4px_4px_0_var(--kaan-ink)] transition-all group-hover:-translate-y-1 group-hover:shadow-[6px_7px_0_var(--kaan-ink)]">
                <div className="absolute right-0 top-0 h-3 w-24 bg-[var(--kaan-coral)]" />
                <div className="mb-6 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center border border-[var(--kaan-ink)] bg-[var(--kaan-coral)] text-white">
                    <LayoutDashboard className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
                <h2 className="text-base font-bold uppercase tracking-tight text-[var(--kaan-ink)]">
                  Visual Dashboards
                </h2>
                <p className="mt-1 text-[10px] leading-relaxed text-[var(--muted-foreground)]">
                  Multi-widget grid canvases, KPI metrics & global filter panels.
                </p>
                <div className="mt-5 flex gap-4 text-[10px] font-bold uppercase tracking-wider text-[var(--kaan-ink)]">
                  <span>{dashboards.length} Active Dashboards</span>
                </div>
              </article>
            </Link>

            {/* Workspace Card 3: Data Model */}
            <Link href="/model" className="group">
              <article className="relative h-full min-h-[190px] overflow-hidden border border-[var(--kaan-ink)] bg-[var(--kaan-paper)] p-5 shadow-[4px_4px_0_var(--kaan-ink)] transition-all group-hover:-translate-y-1 group-hover:shadow-[6px_7px_0_var(--kaan-ink)]">
                <div className="absolute right-0 top-0 h-3 w-24 bg-[var(--kaan-yellow)]" />
                <div className="mb-6 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center border border-[var(--kaan-ink)] bg-[var(--kaan-yellow)] text-[var(--kaan-ink)]">
                    <GitFork className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
                <h2 className="text-base font-bold uppercase tracking-tight text-[var(--kaan-ink)]">
                  Data Model & Joins
                </h2>
                <p className="mt-1 text-[10px] leading-relaxed text-[var(--muted-foreground)]">
                  Multi-table schema definitions & primary key field relationships.
                </p>
                <div className="mt-5 flex gap-4 text-[10px] font-bold uppercase tracking-wider text-[var(--kaan-ink)]">
                  <span>{model?.datasets?.length || 0} Bound Tables</span>
                  <span>{model?.relationships?.length || 0} Relationships</span>
                </div>
              </article>
            </Link>
          </div>
        )}
      </section>

      {/* Main Data & AI Grid */}
      <section className="grid gap-6 lg:grid-cols-[1.55fr_0.85fr]">
        {/* Recent Data Shelf */}
        <div className="retro-panel font-mono">
          <div className="border-b border-[var(--kaan-ink)] p-5 bg-[var(--kaan-paper)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="retro-label text-[var(--kaan-green)]">
                  Recent Data
                </div>
                <h2 className="mt-1 text-xl font-bold uppercase text-[var(--kaan-ink)]">
                  Registered Data Shelf
                </h2>
              </div>

              <Link
                href="/data"
                className="flex items-center gap-1 border border-[var(--kaan-ink)] bg-[var(--kaan-cream)] px-3 py-2 text-[10px] font-bold uppercase tracking-wider hover:bg-[var(--kaan-yellow)] transition-colors"
              >
                View Catalog ({datasets.length})
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-[var(--kaan-cream)] border border-[var(--kaan-ink)] animate-pulse" />
              ))}
            </div>
          ) : datasets.length === 0 ? (
            /* Clean Real Data Empty State */
            <div className="p-8 text-center bg-[var(--kaan-paper)] font-mono space-y-3" data-testid="home-empty-datasets">
              <Database className="h-10 w-10 text-[var(--kaan-ink)] mx-auto opacity-60" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--kaan-ink)]">
                Your Workspace Is Ready
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto font-sans">
                No datasets registered yet. Import your first CSV dataset into KaanVIz to populate your analytical workspace.
              </p>
              <Link
                href="/data"
                className="mt-4 inline-flex items-center gap-2 border border-[var(--kaan-ink)] bg-[var(--kaan-green)] text-white px-5 py-2 text-xs font-mono font-bold uppercase shadow-[2px_2px_0_var(--kaan-ink)] hover:bg-[var(--kaan-teal)] transition-colors"
              >
                <Plus className="h-4 w-4" />
                Bring First Dataset
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[var(--kaan-ink)]/20 bg-[var(--kaan-paper)]">
              {datasets.slice(0, 5).map((ds) => (
                <Link
                  key={ds.id}
                  href="/data"
                  className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-[var(--kaan-cream)]"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-[var(--kaan-ink)] bg-[var(--kaan-yellow)] text-[var(--kaan-ink)] shadow-[1px_1px_0_var(--kaan-ink)]">
                    <FileSpreadsheet className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-bold text-[var(--kaan-ink)]">
                      {ds.name}
                    </div>
                    <div className="mt-0.5 text-[10px] text-slate-600 flex items-center gap-2">
                      <span className="truncate">{ds.original_filename}</span>
                      <span>·</span>
                      <span>{(ds.file_size_bytes / 1024).toFixed(1)} KB</span>
                      {ds.row_count !== undefined && ds.column_count !== undefined && (
                        <>
                          <span>·</span>
                          <span className="text-[var(--kaan-green)] font-bold">{ds.row_count} rows × {ds.column_count} cols</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="inline-block text-[9px] font-bold uppercase px-2 py-0.5 border border-[var(--kaan-ink)] bg-[var(--kaan-green)] text-white shadow-[1px_1px_0_var(--kaan-ink)]">
                      {ds.status}
                    </span>
                    <div className="mt-1 text-[9px] text-slate-500">
                      {new Date(ds.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  <ArrowRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100 shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* AI Activity & Status Box */}
        <div className="border border-[var(--kaan-ink)] bg-[var(--kaan-ink)] p-5 text-[var(--kaan-paper)] shadow-[4px_4px_0_var(--kaan-coral)] font-mono flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/20 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[var(--kaan-yellow)]" />
                <div className="retro-label text-[var(--kaan-yellow)]">
                  AI Analyst Status
                </div>
              </div>
              <span className={`text-[9px] font-bold uppercase px-2 py-0.5 border border-white/40 ${isAIEnabled ? "bg-[var(--kaan-green)] text-white" : "bg-[var(--kaan-yellow)] text-[var(--kaan-ink)]"}`}>
                {isAIEnabled ? "ACTIVE" : "STANDBY"}
              </span>
            </div>

            <h2 className="mt-6 text-xl font-bold uppercase tracking-wide text-white">
              Data Intelligence
              <br />
              & Q&A Engine
            </h2>

            <p className="mt-3 text-[11px] leading-relaxed text-white/70 font-sans">
              Powered by NVIDIA Nemotron ({aiStatus?.model || "nvidia/nemotron-3-super-120b-a12b"}). Ask natural language questions, generate prompt-to-visuals, and produce structured insights.
            </p>
          </div>

          <div className="mt-8 space-y-3">
            <div className="p-3 bg-white/10 border border-white/20 text-[10px] space-y-1">
              <div className="flex items-center justify-between text-white/90">
                <span>PROVIDER:</span>
                <span className="font-bold uppercase text-[var(--kaan-yellow)]">{aiStatus?.provider || "NVIDIA"}</span>
              </div>
              <div className="flex items-center justify-between text-white/90">
                <span>DETERMINISTIC FALLBACK:</span>
                <span className="font-bold text-[var(--kaan-teal)]">DUCKDB ENGINE</span>
              </div>
            </div>

            <Link
              href="/ai-analyst"
              className="flex items-center justify-between border border-white/40 bg-white/10 px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-white/20"
            >
              Open AI Analyst Workspace
              <Bot className="h-4 w-4 text-[var(--kaan-teal)]" />
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Actions Grid */}
      <section className="font-mono">
        <div className="retro-label mb-3">Quick Actions</div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction
            href="/data"
            icon={Upload}
            title="Bring Data"
            description="Upload & ingest raw CSV dataset"
            accent="bg-[var(--kaan-yellow)] text-[var(--kaan-ink)]"
          />

          <QuickAction
            href="/prepare"
            icon={Wrench}
            title="Prepare Data"
            description="Clean, fill missing & transform"
            accent="bg-[var(--kaan-coral)] text-white"
          />

          <QuickAction
            href="/model"
            icon={GitFork}
            title="Build Model"
            description="Connect tables & join keys"
            accent="bg-[var(--kaan-lilac)] text-white"
          />

          <QuickAction
            href="/visualize"
            icon={BarChart3}
            title="Create Visual"
            description="Open modern BI visual canvas"
            accent="bg-[var(--kaan-teal)] text-white"
          />
        </div>
      </section>

      {/* Product Philosophy Footer Strip */}
      <section className="retro-dot-grid border-y border-[var(--kaan-ink)] py-6 font-mono">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="retro-label text-[var(--kaan-coral)]">
              KaanVIz / Architecture
            </div>

            <p className="mt-2 max-w-2xl text-xs font-bold leading-relaxed text-[var(--kaan-ink)]">
              Ingest & Profile
              <span className="mx-2 text-[var(--kaan-coral)]">→</span>
              Clean & Transform
              <span className="mx-2 text-[var(--kaan-coral)]">→</span>
              Model Joins
              <span className="mx-2 text-[var(--kaan-coral)]">→</span>
              Render ECharts
              <span className="mx-2 text-[var(--kaan-coral)]">→</span>
              AI Intelligence
            </p>
          </div>

          <div className="text-[10px] text-slate-600 bg-white/70 p-2 border border-[var(--kaan-ink)] shadow-[2px_2px_0_var(--kaan-ink)]">
            <div>ENGINE: DUCKDB / POLARS</div>
            <div>STATUS: {health?.status?.toUpperCase() || "ONLINE"}</div>
          </div>
        </div>
      </section>
    </div>
  );
}

function ButtonRefresh({ onRefresh, loading }: { onRefresh: () => void; loading: boolean }) {
  return (
    <button
      onClick={onRefresh}
      disabled={loading}
      className="flex items-center gap-1.5 border border-[var(--kaan-ink)] bg-[var(--kaan-paper)] px-3 py-3 text-xs font-mono font-bold uppercase shadow-[2px_2px_0_var(--kaan-ink)] hover:bg-[var(--kaan-cream)] transition-colors disabled:opacity-50"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
      Refresh
    </button>
  );
}

function QuickAction({
  href,
  icon: Icon,
  title,
  description,
  accent,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
  accent: string;
}) {
  return (
    <Link href={href} className="group font-mono">
      <div className="flex h-full items-center gap-3 border border-[var(--kaan-ink)] bg-[var(--kaan-paper)] p-4 shadow-[2px_2px_0_var(--kaan-ink)] transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0_var(--kaan-ink)]">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center border border-[var(--kaan-ink)] ${accent}`}
        >
          <Icon className="h-4 w-4" />
        </div>

        <div className="min-w-0">
          <div className="text-xs font-bold uppercase text-[var(--kaan-ink)]">{title}</div>
          <div className="mt-0.5 text-[9px] text-[var(--muted-foreground)]">
            {description}
          </div>
        </div>

        <ArrowRight className="ml-auto h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}