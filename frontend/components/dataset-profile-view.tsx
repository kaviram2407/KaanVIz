"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  BarChart2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Hash,
  Layers,
  Calendar,
  ShieldCheck,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DatasetProfileResponse, generateDatasetProfile } from "@/lib/api-client";

interface DatasetProfileViewProps {
  profileData: DatasetProfileResponse;
  onBack: () => void;
  onProfileUpdated?: (updated: DatasetProfileResponse) => void;
}

export function DatasetProfileView({
  profileData,
  onBack,
  onProfileUpdated,
}: DatasetProfileViewProps) {
  const [data, setData] = useState<DatasetProfileResponse>(profileData);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    setError(null);
    try {
      const res = await generateDatasetProfile(data.dataset_id, data.workspace_id);
      setData(res);
      if (onProfileUpdated) {
        onProfileUpdated(res);
      }
    } catch (err: any) {
      setError(err.message || "Failed to regenerate profile.");
    } finally {
      setIsRegenerating(false);
    }
  };

  const filteredColumns = data.columns.filter((col) =>
    col.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    col.physical_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    col.semantic_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getQualityBadgeColor = (score: number) => {
    if (score >= 90) return "border-emerald-500/40 text-emerald-400 bg-emerald-950/40";
    if (score >= 70) return "border-amber-500/40 text-amber-400 bg-amber-950/40";
    return "border-rose-500/40 text-rose-400 bg-rose-950/40";
  };

  return (
    <div className="space-y-6" data-testid="dataset-profile-view">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            data-testid="back-to-catalog-button"
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-slate-100">{data.dataset_name}</h2>
              <Badge variant="outline" className={getQualityBadgeColor(data.summary.quality_score)}>
                <ShieldCheck className="h-3 w-3 mr-1" /> Score: {data.summary.quality_score}%
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Dataset ID: <span className="font-mono text-slate-300">{data.dataset_id}</span> • Version:{" "}
              <span className="font-mono text-slate-300">{data.version_id.substring(0, 8)}</span>
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRegenerate}
          disabled={isRegenerating}
          className="border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRegenerating ? "animate-spin" : ""}`} />
          Re-run Profiling
        </Button>
      </div>

      {error && (
        <div className="flex items-center space-x-2 border border-rose-500/30 bg-rose-950/20 text-rose-200 rounded-lg p-3 text-sm">
          <AlertTriangle className="h-4 w-4 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Dataset Profile Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="p-3 text-center">
            <span className="text-xs text-slate-400">Total Rows</span>
            <div className="text-lg font-bold font-mono text-slate-100 mt-0.5">
              {data.summary.row_count.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="p-3 text-center">
            <span className="text-xs text-slate-400">Total Columns</span>
            <div className="text-lg font-bold font-mono text-slate-100 mt-0.5">
              {data.summary.column_count}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="p-3 text-center">
            <span className="text-xs text-slate-400">Duplicate Rows</span>
            <div className="text-lg font-bold font-mono text-slate-100 mt-0.5">
              {data.summary.duplicate_rows}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="p-3 text-center">
            <span className="text-xs text-slate-400">Missing Cells</span>
            <div className="text-lg font-bold font-mono text-slate-100 mt-0.5">
              {data.summary.missing_cells} ({data.summary.missing_percentage}%)
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="p-3 text-center">
            <span className="text-xs text-slate-400">File Size</span>
            <div className="text-lg font-bold font-mono text-slate-100 mt-0.5">
              {(data.summary.file_size_bytes / 1024).toFixed(1)} KB
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/60 border-slate-800">
          <CardContent className="p-3 text-center">
            <span className="text-xs text-slate-400">Profile Status</span>
            <div className="text-sm font-semibold uppercase text-emerald-400 mt-1">
              {data.summary.status}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Column Quality Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-slate-100">Column Profiles & Statistics</h3>
            <p className="text-xs text-slate-400">
              Deterministic physical types, semantic interpretations, null distributions, and numeric statistics.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search columns..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Column Profile Table */}
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/40">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 uppercase font-mono text-[11px]">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Column</th>
                  <th className="p-3">Physical Type</th>
                  <th className="p-3">Semantic Type</th>
                  <th className="p-3">Null Count / %</th>
                  <th className="p-3">Distinct / Unique</th>
                  <th className="p-3">Statistics / Sample Values</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filteredColumns.length > 0 ? (
                  filteredColumns.map((col) => (
                    <tr key={col.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-3 font-mono text-slate-500">{col.ordinal_position + 1}</td>
                      <td className="p-3 font-semibold text-slate-100">{col.name}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="border-indigo-500/30 text-indigo-300 bg-indigo-950/30">
                          {col.physical_type}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="border-emerald-500/30 text-emerald-300 bg-emerald-950/30">
                          {col.semantic_type}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="font-mono">
                          {col.null_count} ({col.null_percentage}%)
                        </div>
                      </td>
                      <td className="p-3 font-mono">
                        {col.distinct_count} {col.is_unique && <span className="text-emerald-400 text-[10px] ml-1">(Unique)</span>}
                      </td>
                      <td className="p-3">
                        {/* Stats rendering */}
                        <div className="space-y-1 max-w-xs text-[11px]">
                          {col.stats.min !== undefined && (
                            <div className="font-mono text-slate-400">
                              min: <span className="text-slate-200">{col.stats.min}</span> • max:{" "}
                              <span className="text-slate-200">{col.stats.max}</span> • mean:{" "}
                              <span className="text-slate-200">{col.stats.mean}</span>
                            </div>
                          )}

                          {col.stats.min_date && (
                            <div className="font-mono text-slate-400">
                              {col.stats.min_date.split("T")[0]} → {col.stats.max_date.split("T")[0]}
                            </div>
                          )}

                          {col.stats.top_frequencies && Object.keys(col.stats.top_frequencies).length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(col.stats.top_frequencies)
                                .slice(0, 3)
                                .map(([val, cnt]) => (
                                  <span key={val} className="px-1.5 py-0.5 bg-slate-800 rounded text-[10px] text-slate-300 truncate max-w-[120px]">
                                    {val}: {String(cnt)}
                                  </span>
                                ))}
                            </div>
                          )}

                          {col.stats.sample_values && col.stats.sample_values.length > 0 && (
                            <div className="text-slate-400 truncate">
                              Samples: {col.stats.sample_values.slice(0, 3).join(", ")}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-500">
                      No matching columns found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
