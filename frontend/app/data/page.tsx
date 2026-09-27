"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Database, Upload, RefreshCw, Loader2, AlertTriangle } from "lucide-react";
import { DatasetUploader } from "@/components/dataset-uploader";
import { DatasetList } from "@/components/dataset-list";
import { DatasetProfileView } from "@/components/dataset-profile-view";
import {
  fetchWorkspaceDatasets,
  fetchDatasetProfile,
  DatasetItem,
  DatasetUploadResponse,
  DatasetProfileResponse,
} from "@/lib/api-client";
import { Button } from "@/components/ui/button";

export default function DataPage() {
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [selectedDataset, setSelectedDataset] = useState<DatasetItem | null>(null);
  const [profileData, setProfileData] = useState<DatasetProfileResponse | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const loadDatasets = useCallback(async () => {
    setIsLoadingCatalog(true);
    try {
      const items = await fetchWorkspaceDatasets("default");
      setDatasets(items);
    } catch (err) {
      console.error("Failed to load workspace datasets:", err);
    } finally {
      setIsLoadingCatalog(false);
    }
  }, []);

  useEffect(() => {
    loadDatasets();
  }, [loadDatasets]);

  const handleSelectDataset = async (dataset: DatasetItem) => {
    setSelectedDataset(dataset);
    setIsLoadingProfile(true);
    setProfileError(null);
    setProfileData(null);

    try {
      const res = await fetchDatasetProfile(dataset.id, dataset.workspace_id);
      setProfileData(res);
    } catch (err: any) {
      setProfileError(err.message || "Failed to load dataset profile.");
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleUploadSuccess = (_newDataset: DatasetUploadResponse) => {
    loadDatasets();
  };

  const handleBackToCatalog = () => {
    setSelectedDataset(null);
    setProfileData(null);
    setProfileError(null);
  };

  if (selectedDataset) {
    if (isLoadingProfile) {
      return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackToCatalog}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            Back to Catalog
          </Button>
          <div className="border border-slate-800 bg-slate-900/50 rounded-xl p-12 text-center flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-8 w-8 text-indigo-400 animate-spin" />
            <p className="text-slate-200 font-medium">Computing & Loading Dataset Profile...</p>
            <p className="text-xs text-slate-500">Calculating column types, null counts, and deterministic statistics.</p>
          </div>
        </div>
      );
    }

    if (profileError) {
      return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackToCatalog}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            Back to Catalog
          </Button>
          <div className="border border-rose-500/30 bg-rose-950/20 rounded-xl p-8 text-center space-y-3">
            <AlertTriangle className="h-8 w-8 text-rose-400 mx-auto" />
            <h3 className="font-semibold text-rose-100 text-lg">Failed to Load Profile</h3>
            <p className="text-sm text-rose-300/80">{profileError}</p>
          </div>
        </div>
      );
    }

    if (profileData) {
      return (
        <div className="max-w-6xl mx-auto p-6">
          <DatasetProfileView
            profileData={profileData}
            onBack={handleBackToCatalog}
            onProfileUpdated={(updated) => setProfileData(updated)}
          />
        </div>
      );
    }
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-6">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Database className="h-6 w-6 text-indigo-400" />
            <h1 className="text-2xl font-bold text-slate-100">Data Management & Profiling</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Safe CSV ingestion, immutable raw storage, and deterministic dataset profiling.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadDatasets}
          disabled={isLoadingCatalog}
          className="border-slate-700 text-slate-300 hover:bg-slate-800"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingCatalog ? "animate-spin" : ""}`} />
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
              Select any dataset below to inspect its deterministic profile and column statistics.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Total: {datasets.length}
          </span>
        </div>

        <div>
          <DatasetList
            datasets={datasets}
            isLoading={isLoadingCatalog}
            onSelectDataset={handleSelectDataset}
          />
        </div>
      </div>
    </div>
  );
}
