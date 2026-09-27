"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Database, Upload, RefreshCw } from "lucide-react";
import { DatasetUploader } from "@/components/dataset-uploader";
import { DatasetList } from "@/components/dataset-list";
import { fetchWorkspaceDatasets, DatasetItem, DatasetUploadResponse } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

export default function DataPage() {
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDatasets = useCallback(async () => {
    setIsLoading(true);
    try {
      const items = await fetchWorkspaceDatasets("default");
      setDatasets(items);
    } catch (err) {
      console.error("Failed to load workspace datasets:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDatasets();
  }, [loadDatasets]);

  const handleUploadSuccess = (_newDataset: DatasetUploadResponse) => {
    loadDatasets();
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-6">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Database className="h-6 w-6 text-indigo-400" />
            <h1 className="text-2xl font-bold text-slate-100">Data Management & Ingestion</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Safe, deterministic CSV dataset upload and immutable raw storage pipeline.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadDatasets}
          disabled={isLoading}
          className="border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Catalog
        </Button>
      </div>

      {/* CSV Ingestion Dropzone Card */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Upload className="h-4 w-4 text-indigo-400" />
          <h2 className="text-base font-semibold text-slate-200">Upload CSV Dataset</h2>
        </div>
        <DatasetUploader onUploadSuccess={handleUploadSuccess} />
      </div>

      {/* Existing Registered Datasets Section */}
      <div className="space-y-4 pt-4 border-t border-slate-800/80">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-200">Registered Datasets</h2>
            <p className="text-xs text-slate-400">
              Analytical datasets registered in the current workspace.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Total: {datasets.length}
          </span>
        </div>

        <DatasetList datasets={datasets} isLoading={isLoading} />
      </div>
    </div>
  );
}
