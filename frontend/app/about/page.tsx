import React from "react";
import { ShieldCheck, Database, Terminal, Cpu, HardDrive } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 font-mono">
      {/* Header Banner */}
      <div className="border-2 border-[var(--kaan-ink)] bg-[var(--kaan-paper)] p-6 shadow-[4px_4px_0_var(--kaan-ink)] relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--kaan-ink)]/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[var(--kaan-green)] text-white border border-[var(--kaan-ink)] shadow-[2px_2px_0_var(--kaan-ink)]">
              <Terminal className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-[var(--kaan-ink)] uppercase font-mono">About KaanViz</h1>
                <span className="text-[10px] font-mono uppercase bg-[var(--kaan-yellow)] text-[var(--kaan-ink)] border border-[var(--kaan-ink)] px-2 py-0.5 font-bold">
                  v1.0.0
                </span>
              </div>
              <p className="text-xs text-[var(--kaan-ink)]/70 mt-1">
                AI-Powered, AI-Optional Data Analytics & Technical Visualization Workspace.
              </p>
            </div>
          </div>
          <div className="text-[10px] text-[var(--kaan-ink)]/60 bg-white/60 p-2 border border-[var(--kaan-ink)]/20">
            <div>ENGINE: DUCKDB / POLARS</div>
            <div>AI MODEL: NEMOTRON 3</div>
          </div>
        </div>

        <div className="mt-4 text-xs leading-relaxed text-[var(--kaan-ink)]/80">
          KaanViz is built for analytical precision, high-speed query execution, and deterministic data management. Designed with a retro-technical editorial workflow aesthetic, it bridges local data execution with optional AI acceleration.
        </div>
      </div>

      {/* Core Principles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border-2 border-[var(--kaan-ink)] bg-white p-5 shadow-[4px_4px_0_var(--kaan-ink)] space-y-3">
          <div className="flex items-center justify-between border-b border-[var(--kaan-ink)]/20 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--kaan-ink)] flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[var(--kaan-green)]" />
              AI Optionality Guarantee
            </h3>
            <span className="text-[9px] uppercase px-1.5 py-0.5 bg-[var(--kaan-green)]/10 text-[var(--kaan-green)] border border-[var(--kaan-green)] font-bold">
              PRINCIPLE 01
            </span>
          </div>
          <p className="text-xs text-[var(--kaan-ink)]/80 leading-relaxed font-sans">
            AI is strictly an enhancement, never a dependency. All core ingestion, cleaning, modeling, visualization, and dashboard operations remain 100% functional even when an AI provider is offline or unconfigured.
          </p>
        </div>

        <div className="border-2 border-[var(--kaan-ink)] bg-white p-5 shadow-[4px_4px_0_var(--kaan-ink)] space-y-3">
          <div className="flex items-center justify-between border-b border-[var(--kaan-ink)]/20 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--kaan-ink)] flex items-center gap-2">
              <Database className="h-4 w-4 text-[var(--kaan-coral)]" />
              Raw Data Immutability
            </h3>
            <span className="text-[9px] uppercase px-1.5 py-0.5 bg-[var(--kaan-coral)]/10 text-[var(--kaan-coral)] border border-[var(--kaan-coral)] font-bold">
              PRINCIPLE 02
            </span>
          </div>
          <p className="text-xs text-[var(--kaan-ink)]/80 leading-relaxed font-sans">
            Uploaded raw files are treated as immutable untrusted sources in physical storage (<code className="bg-amber-100 px-1 font-mono text-[11px]">storage/raw/</code>). Analytical transformations produce deterministic, versioned Parquet artifacts stored separately.
          </p>
        </div>
      </div>

      {/* System Specs */}
      <div className="border-2 border-[var(--kaan-ink)] bg-[var(--kaan-paper)] p-5 shadow-[4px_4px_0_var(--kaan-ink)]">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--kaan-ink)] flex items-center gap-2 mb-3">
          <Cpu className="h-4 w-4 text-[var(--kaan-teal)]" />
          Technical Stack Specifications
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-white border border-[var(--kaan-ink)] shadow-[2px_2px_0_var(--kaan-ink)]">
            <div className="text-[10px] text-[var(--kaan-ink)]/60 uppercase">Frontend</div>
            <div className="font-bold text-[var(--kaan-ink)] mt-0.5">Next.js 14 / TS</div>
          </div>
          <div className="p-3 bg-white border border-[var(--kaan-ink)] shadow-[2px_2px_0_var(--kaan-ink)]">
            <div className="text-[10px] text-[var(--kaan-ink)]/60 uppercase">Backend</div>
            <div className="font-bold text-[var(--kaan-ink)] mt-0.5">FastAPI / Python</div>
          </div>
          <div className="p-3 bg-white border border-[var(--kaan-ink)] shadow-[2px_2px_0_var(--kaan-ink)]">
            <div className="text-[10px] text-[var(--kaan-ink)]/60 uppercase">Engine</div>
            <div className="font-bold text-[var(--kaan-ink)] mt-0.5">DuckDB / Polars</div>
          </div>
          <div className="p-3 bg-white border border-[var(--kaan-ink)] shadow-[2px_2px_0_var(--kaan-ink)]">
            <div className="text-[10px] text-[var(--kaan-ink)]/60 uppercase">Graphics</div>
            <div className="font-bold text-[var(--kaan-ink)] mt-0.5">Apache ECharts</div>
          </div>
        </div>
      </div>
    </div>
  );
}

