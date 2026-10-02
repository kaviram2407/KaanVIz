"use client";

import React, { useState, useEffect } from "react";
import { AIAnalystPanel } from "@/components/ai-analyst-panel";
import { fetchWorkspaceDatasets, DatasetItem } from "@/lib/api-client";
import { Bot, Database } from "lucide-react";

export default function AIAnalystPage() {
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDatasets() {
      try {
        const items = await fetchWorkspaceDatasets();
        setDatasets(items);
        if (items.length > 0) {
          setSelectedDatasetId(items[0].id);
        }
      } catch (err) {
        console.error("Failed to load datasets:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDatasets();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[var(--kaan-paper)] border border-[var(--kaan-ink)] p-6 shadow-[4px_4px_0_var(--kaan-ink)]">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-[var(--kaan-cream)] border border-[var(--kaan-ink)] text-[var(--kaan-ink)] shadow-[2px_2px_0_var(--kaan-ink)]">
            <Bot className="w-7 h-7 text-[var(--kaan-ink)]" />
          </div>
          <div>
            <h1 className="text-2xl font-mono font-bold text-[var(--kaan-ink)] tracking-wide uppercase">AI Product Analyst Workstation</h1>
            <p className="text-xs font-mono text-slate-600 mt-0.5">
              Natural-language data Q&A, prompt-to-visual generation, Explain Visual, and structured AI insights.
            </p>
          </div>
        </div>

        {/* Dataset Selector */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <Database className="w-4 h-4 text-[var(--kaan-ink)] opacity-70" />
          <select
            value={selectedDatasetId}
            onChange={(e) => setSelectedDatasetId(e.target.value)}
            disabled={loading || datasets.length === 0}
            className="bg-[var(--kaan-paper)] border border-[var(--kaan-ink)] text-[var(--kaan-ink)] font-bold text-xs rounded-none px-3 py-2 focus:outline-none shadow-[2px_2px_0_var(--kaan-ink)] uppercase"
          >
            {datasets.length === 0 ? (
              <option value="">NO DATASETS AVAILABLE</option>
            ) : (
              datasets.map((ds) => (
                <option key={ds.id} value={ds.id}>
                  {ds.name} ({ds.id.slice(0, 8)})
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Main AI Analyst Panel */}
      <AIAnalystPanel datasetId={selectedDatasetId} />
    </div>
  );
}

