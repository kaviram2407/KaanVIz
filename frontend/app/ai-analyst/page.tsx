"use client";

import React, { useState, useEffect } from "react";
import { AIAnalystPanel } from "@/components/ai-analyst-panel";
import { Bot, Database } from "lucide-react";

export default function AIAnalystPage() {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDatasets() {
      try {
        const res = await fetch("http://localhost:8000/api/v1/datasets/");
        if (res.ok) {
          const data = await res.json();
          const items = data.items || data;
          setDatasets(items);
          if (items.length > 0) {
            setSelectedDatasetId(items[0].id);
          }
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-6 rounded-xl">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
            <Bot className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100">AI Analyst Workbench</h1>
            <p className="text-sm text-slate-400">
              Natural-language data Q&A, prompt-to-visual generation, Explain Visual, and structured AI insights.
            </p>
          </div>
        </div>

        {/* Dataset Selector */}
        <div className="flex items-center gap-3">
          <Database className="w-4 h-4 text-slate-400" />
          <select
            value={selectedDatasetId}
            onChange={(e) => setSelectedDatasetId(e.target.value)}
            disabled={loading || datasets.length === 0}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500"
          >
            {datasets.length === 0 ? (
              <option value="">No datasets available</option>
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
