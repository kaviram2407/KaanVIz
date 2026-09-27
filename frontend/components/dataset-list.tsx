"use client";

import React from "react";
import { Database, FileSpreadsheet, Calendar, HardDrive } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DatasetItem } from "@/lib/api-client";

interface DatasetListProps {
  datasets: DatasetItem[];
  isLoading?: boolean;
}

export function DatasetList({ datasets, isLoading }: DatasetListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-20 bg-slate-900/50 rounded-xl border border-slate-800 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!datasets || datasets.length === 0) {
    return (
      <div className="border border-slate-800/80 bg-slate-900/40 rounded-xl p-8 text-center">
        <Database className="h-8 w-8 text-slate-500 mx-auto mb-2" />
        <p className="text-slate-300 font-medium text-sm">No datasets registered yet</p>
        <p className="text-slate-500 text-xs mt-1">Upload your first CSV dataset above to begin ingestion.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="dataset-catalog-list">
      {datasets.map((ds) => (
        <Card key={ds.id} className="bg-slate-900/60 border-slate-800 hover:border-slate-700 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-indigo-950/60 border border-indigo-500/20 rounded-lg text-indigo-400">
                <FileSpreadsheet className="h-5 w-5" />
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-semibold text-slate-100 text-sm">{ds.name}</h4>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[10px] uppercase">
                    {ds.status}
                  </Badge>
                </div>
                <div className="flex items-center space-x-4 text-xs text-slate-400 mt-1">
                  <span className="flex items-center">
                    <HardDrive className="h-3 w-3 mr-1" />
                    {ds.original_filename} ({(ds.file_size_bytes / 1024).toFixed(1)} KB)
                  </span>
                  <span className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(ds.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right text-xs">
              <div className="font-mono text-slate-200 font-medium">
                {ds.row_count ?? 0} rows × {ds.column_count ?? 0} cols
              </div>
              <span className="text-[10px] text-slate-500">Raw Immutable CSV</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
