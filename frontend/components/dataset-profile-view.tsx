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
import { DatasetPreparationView } from "@/components/dataset-preparation-view";

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
  const [activeViewTab, setActiveViewTab] = useState<"profile" | "preparation">("profile");
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
    if (score >= 90) return "border border-[var(--kaan-ink)] text-white bg-[var(--kaan-green)]";
    if (score >= 70) return "border border-[var(--kaan-ink)] text-[var(--kaan-ink)] bg-[var(--kaan-yellow)]";
    return "border border-[var(--kaan-ink)] text-white bg-[var(--kaan-coral)]";
  };

  return (
    <div className="space-y-6 font-sans" data-testid="dataset-profile-view">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--kaan-ink)] pb-4">
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            data-testid="back-to-catalog-button"
            className="border border-[var(--kaan-ink)] bg-[var(--kaan-paper)] text-[var(--kaan-ink)] hover:bg-[var(--kaan-cream)] font-mono text-xs uppercase rounded-none shadow-[2px_2px_0_var(--kaan-ink)]"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-mono font-bold text-[var(--kaan-ink)]">{data.dataset_name}</h2>
              <Badge variant="outline" className={`font-mono text-xs uppercase rounded-none shadow-[1px_1px_0_var(--kaan-ink)] ${getQualityBadgeColor(data.summary.quality_score)}`}>
                <ShieldCheck className="h-3 w-3 mr-1" /> Score: {data.summary.quality_score}%
              </Badge>
            </div>
            <p className="text-xs font-mono text-slate-600 mt-0.5">
              ID: <span className="font-bold text-[var(--kaan-ink)]">{data.dataset_id}</span> • Version:{" "}
              <span className="font-bold text-[var(--kaan-ink)]">{data.version_id.substring(0, 8)}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Main Workspace Navigation Tabs */}
          <div className="flex bg-[var(--kaan-paper)] border border-[var(--kaan-ink)] p-1 rounded-none shadow-[2px_2px_0_var(--kaan-ink)] font-mono text-xs">
            <button
              onClick={() => setActiveViewTab("profile")}
              className={`px-3 py-1 font-bold uppercase transition-colors ${
                activeViewTab === "profile"
                  ? "bg-[var(--kaan-green)] text-white border border-[var(--kaan-ink)]"
                  : "text-[var(--kaan-ink)] hover:bg-[var(--kaan-cream)]"
              }`}
            >
              Profile & Stats
            </button>
            <button
              onClick={() => setActiveViewTab("preparation")}
              className={`px-3 py-1 font-bold uppercase transition-colors ${
                activeViewTab === "preparation"
                  ? "bg-[var(--kaan-green)] text-white border border-[var(--kaan-ink)]"
                  : "text-[var(--kaan-ink)] hover:bg-[var(--kaan-cream)]"
              }`}
            >
              Data Prep Workbench
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="border border-[var(--kaan-ink)] bg-[var(--kaan-cream)] text-[var(--kaan-ink)] hover:bg-[var(--kaan-paper)] font-mono text-xs uppercase rounded-none shadow-[2px_2px_0_var(--kaan-ink)]"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isRegenerating ? "animate-spin" : ""}`} />
            Re-run Profile
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center space-x-2 border border-[var(--kaan-ink)] bg-[#FDF0ED] text-[var(--kaan-ink)] p-3 text-xs font-mono shadow-[2px_2px_0_var(--kaan-ink)]">
          <AlertTriangle className="h-4 w-4 text-[var(--kaan-coral)]" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {activeViewTab === "preparation" ? (
        <DatasetPreparationView profileData={data} onPreparationComplete={handleRegenerate} />
      ) : (
        <>
          {/* Dataset Profile Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono">
            <Card className="bg-[var(--kaan-paper)] border border-[var(--kaan-ink)] rounded-none shadow-[3px_3px_0_var(--kaan-ink)]">
              <CardContent className="p-3 text-center">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Rows</span>
                <div className="text-base font-bold text-[var(--kaan-ink)] mt-0.5">
                  {data.summary.row_count.toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[var(--kaan-paper)] border border-[var(--kaan-ink)] rounded-none shadow-[3px_3px_0_var(--kaan-ink)]">
              <CardContent className="p-3 text-center">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Columns</span>
                <div className="text-base font-bold text-[var(--kaan-ink)] mt-0.5">
                  {data.summary.column_count}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[var(--kaan-paper)] border border-[var(--kaan-ink)] rounded-none shadow-[3px_3px_0_var(--kaan-ink)]">
              <CardContent className="p-3 text-center">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Duplicates</span>
                <div className="text-base font-bold text-[var(--kaan-ink)] mt-0.5">
                  {data.summary.duplicate_rows}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[var(--kaan-paper)] border border-[var(--kaan-ink)] rounded-none shadow-[3px_3px_0_var(--kaan-ink)]">
              <CardContent className="p-3 text-center">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Missing Cells</span>
                <div className="text-base font-bold text-[var(--kaan-ink)] mt-0.5">
                  {data.summary.missing_cells} ({data.summary.missing_percentage}%)
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[var(--kaan-paper)] border border-[var(--kaan-ink)] rounded-none shadow-[3px_3px_0_var(--kaan-ink)]">
              <CardContent className="p-3 text-center">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Size</span>
                <div className="text-base font-bold text-[var(--kaan-ink)] mt-0.5">
                  {(data.summary.file_size_bytes / 1024).toFixed(1)} KB
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[var(--kaan-paper)] border border-[var(--kaan-ink)] rounded-none shadow-[3px_3px_0_var(--kaan-ink)]">
              <CardContent className="p-3 text-center">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Status</span>
                <div className="text-sm font-bold uppercase text-[var(--kaan-green)] mt-0.5">
                  {data.summary.status}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Column Quality Section */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-mono font-bold text-[var(--kaan-ink)] uppercase tracking-wider">Column Technical Profiles</h3>
                <p className="text-xs font-mono text-slate-600">
                  Deterministic types, semantic tags, null counts, distinct cardinality, and summary distributions.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[var(--kaan-ink)] opacity-60" />
                <input
                  type="text"
                  placeholder="FILTER COLUMNS..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[var(--kaan-paper)] border border-[var(--kaan-ink)] rounded-none pl-8 pr-3 py-1.5 text-xs font-mono text-[var(--kaan-ink)] placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[var(--kaan-green)] shadow-[2px_2px_0_var(--kaan-ink)] uppercase"
                />
              </div>
            </div>

            {/* Column Profile Table */}
            <div className="border border-[var(--kaan-ink)] overflow-hidden bg-[var(--kaan-paper)] shadow-[4px_4px_0_var(--kaan-ink)] font-mono">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[var(--kaan-ink)]">
                  <thead className="bg-[var(--kaan-cream)] border-b border-[var(--kaan-ink)] text-[var(--kaan-ink)] uppercase font-mono text-[11px] font-bold">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Column Name</th>
                      <th className="p-3">Physical Type</th>
                      <th className="p-3">Semantic Type</th>
                      <th className="p-3">Nulls / %</th>
                      <th className="p-3">Distinct</th>
                      <th className="p-3">Summary & Samples</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--kaan-ink)]/20 font-mono">
                    {filteredColumns.length > 0 ? (
                      filteredColumns.map((col) => (
                        <tr key={col.id} className="hover:bg-[var(--kaan-cream)]/50 transition-colors">
                          <td className="p-3 text-slate-500 font-bold">{col.ordinal_position + 1}</td>
                          <td className="p-3 font-bold text-[var(--kaan-ink)]">{col.name}</td>
                          <td className="p-3">
                            <Badge variant="outline" className="border border-[var(--kaan-ink)] text-[var(--kaan-ink)] bg-[var(--kaan-cream)] text-[10px] rounded-none uppercase font-bold">
                              {col.physical_type}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="border border-[var(--kaan-ink)] text-white bg-[var(--kaan-teal)] text-[10px] rounded-none uppercase font-bold">
                              {col.semantic_type}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <div>
                              {col.null_count} ({col.null_percentage}%)
                            </div>
                          </td>
                          <td className="p-3">
                            {col.distinct_count} {col.is_unique && <span className="text-[var(--kaan-green)] text-[10px] font-bold ml-1">(UNIQUE)</span>}
                          </td>
                          <td className="p-3">
                            {/* Stats rendering */}
                            <div className="space-y-1 max-w-xs text-[11px]">
                              {col.stats.min !== undefined && (
                                <div className="text-slate-600">
                                  min: <span className="text-[var(--kaan-ink)] font-bold">{col.stats.min}</span> • max:{" "}
                                  <span className="text-[var(--kaan-ink)] font-bold">{col.stats.max}</span> • mean:{" "}
                                  <span className="text-[var(--kaan-ink)] font-bold">{col.stats.mean}</span>
                                </div>
                              )}

                              {col.stats.min_date && (
                                <div className="text-slate-600">
                                  {col.stats.min_date.split("T")[0]} → {col.stats.max_date.split("T")[0]}
                                </div>
                              )}

                              {col.stats.top_frequencies && Object.keys(col.stats.top_frequencies).length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {Object.entries(col.stats.top_frequencies)
                                    .slice(0, 3)
                                    .map(([val, cnt]) => (
                                      <span key={val} className="px-1.5 py-0.5 bg-[var(--kaan-cream)] border border-[var(--kaan-ink)] text-[10px] text-[var(--kaan-ink)] font-bold truncate max-w-[120px]">
                                        {val}: {String(cnt)}
                                      </span>
                                    ))}
                                </div>
                              )}

                              {col.stats.sample_values && col.stats.sample_values.length > 0 && (
                                <div className="text-slate-600 truncate">
                                  Samples: {col.stats.sample_values.slice(0, 3).join(", ")}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-500 font-bold">
                          NO MATCHING COLUMNS FOUND.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}


