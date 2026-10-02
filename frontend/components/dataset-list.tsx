"use client";

import React from "react";
import { Database, FileSpreadsheet, Calendar, HardDrive, BarChart2, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatasetItem } from "@/lib/api-client";

interface DatasetListProps {
  datasets: DatasetItem[];
  isLoading?: boolean;
  onSelectDataset?: (dataset: DatasetItem) => void;
  onDeleteDataset?: (dataset: DatasetItem) => void;
}

export function DatasetList({ datasets, isLoading, onSelectDataset, onDeleteDataset }: DatasetListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 font-mono">
        {[1, 2].map((i) => (
          <div key={i} className="h-20 bg-[var(--kaan-cream)] border border-[var(--kaan-ink)] shadow-[2px_2px_0_var(--kaan-ink)] animate-pulse" />
        ))}
      </div>
    );
  }

  if (!datasets || datasets.length === 0) {
    return (
      <div className="border border-[var(--kaan-ink)] bg-[var(--kaan-paper)] p-8 text-center shadow-[4px_4px_0_var(--kaan-ink)] font-mono" data-testid="empty-datasets-banner">
        <Database className="h-8 w-8 text-[var(--kaan-ink)] mx-auto mb-2 opacity-60" />
        <p className="text-[var(--kaan-ink)] font-bold text-sm uppercase tracking-wider">No datasets registered yet</p>
        <p className="text-slate-600 text-xs mt-1">Upload your first CSV dataset above to populate the data workbench shelf.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 font-sans" data-testid="dataset-catalog-list">
      {datasets.map((ds) => (
        <Card
          key={ds.id}
          className="bg-[var(--kaan-paper)] border border-[var(--kaan-ink)] hover:bg-[var(--kaan-cream)] transition-all cursor-pointer rounded-none shadow-[4px_4px_0_var(--kaan-ink)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0_var(--kaan-ink)]"
          onClick={() => onSelectDataset && onSelectDataset(ds)}
        >
          <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-[var(--kaan-cream)] border border-[var(--kaan-ink)] text-[var(--kaan-ink)] shadow-[2px_2px_0_var(--kaan-ink)]">
                <FileSpreadsheet className="h-5 w-5" />
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <h4
                    className="font-mono font-bold text-[var(--kaan-ink)] text-sm truncate max-w-[240px] sm:max-w-[340px]"
                    title={ds.name}
                  >
                    {ds.name}
                  </h4>
                  <Badge variant="outline" className="border border-[var(--kaan-ink)] text-[var(--kaan-ink)] bg-[var(--kaan-green)] text-[10px] uppercase font-mono font-bold shrink-0 rounded-none shadow-[1px_1px_0_var(--kaan-ink)] text-white">
                    {ds.status}
                  </Badge>
                </div>
                <div className="flex items-center space-x-3 text-xs font-mono text-slate-600 mt-1">
                  <span className="flex items-center truncate max-w-[200px]" title={ds.original_filename}>
                    <HardDrive className="h-3 w-3 mr-1 shrink-0" />
                    <span className="truncate">{ds.original_filename}</span>
                    <span className="ml-1 text-slate-500">({(ds.file_size_bytes / 1024).toFixed(1)} KB)</span>
                  </span>
                  <span className="flex items-center shrink-0">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(ds.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-300">
              <div className="text-right text-xs mr-2 font-mono hidden md:block">
                <div className="text-[var(--kaan-ink)] font-bold">
                  {ds.row_count ?? 0} rows × {ds.column_count ?? 0} cols
                </div>
                <span className="text-[9px] uppercase font-bold text-[var(--kaan-ink)] px-1.5 py-0.5 bg-[var(--kaan-cream)] border border-[var(--kaan-ink)] inline-block mt-0.5 shadow-[1px_1px_0_var(--kaan-ink)]">
                  DUCKDB OK
                </span>
              </div>

              <Button
                variant="outline"
                size="sm"
                data-testid={`open-profile-btn-${ds.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelectDataset) onSelectDataset(ds);
                }}
                className="border border-[var(--kaan-ink)] bg-[var(--kaan-cream)] text-[var(--kaan-ink)] hover:bg-[var(--kaan-paper)] font-mono text-xs uppercase rounded-none shadow-[2px_2px_0_var(--kaan-ink)]"
              >
                <BarChart2 className="h-3.5 w-3.5 mr-1" /> Profile
              </Button>

              {onDeleteDataset && (
                <Button
                  variant="outline"
                  size="sm"
                  data-testid={`delete-dataset-btn-${ds.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteDataset(ds);
                  }}
                  className="border border-[var(--kaan-ink)] bg-[#FDF0ED] text-[var(--kaan-coral)] hover:bg-[var(--kaan-coral)] hover:text-white font-mono text-xs uppercase rounded-none shadow-[2px_2px_0_var(--kaan-ink)]"
                  title="Delete Dataset"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}


