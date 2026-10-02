"use client";

import React, { useEffect, useState } from "react";
import { Wrench, Database, ArrowLeft, RefreshCw, CheckCircle2, AlertTriangle, FileSpreadsheet, HardDrive, Calendar, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  fetchWorkspaceDatasets,
  fetchDatasetProfile,
  generateDatasetProfile,
  DatasetItem,
  DatasetProfileResponse,
} from "@/lib/api-client";
import { DatasetPreparationView } from "@/components/dataset-preparation-view";

export default function PreparePage() {
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<DatasetItem | null>(null);
  const [profileData, setProfileData] = useState<DatasetProfileResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadWorkspaceDatasets = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchWorkspaceDatasets("default");
      setDatasets(data);
    } catch (err: any) {
      setError(err.message || "Failed to load datasets.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaceDatasets();
  }, []);

  const handleSelectDataset = async (dataset: DatasetItem) => {
    setSelectedDataset(dataset);
    setLoadingProfile(true);
    setError(null);
    try {
      let prof: DatasetProfileResponse;
      try {
        prof = await fetchDatasetProfile(dataset.id, "default");
      } catch {
        prof = await generateDatasetProfile(dataset.id, "default");
      }
      setProfileData(prof);
    } catch (err: any) {
      setError(err.message || `Failed to load profile for dataset '${dataset.name}'.`);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleBack = () => {
    setSelectedDataset(null);
    setProfileData(null);
    loadWorkspaceDatasets();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--kaan-ink)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[var(--kaan-cream)] border border-[var(--kaan-ink)] shadow-[2px_2px_0_var(--kaan-ink)] text-[var(--kaan-ink)]">
              <Wrench className="h-5 w-5 text-[var(--kaan-ink)]" />
            </div>
            <h1 className="text-2xl font-mono font-bold text-[var(--kaan-ink)] tracking-wide uppercase">Data Preparation Workbench</h1>
          </div>
          <p className="text-xs font-mono text-slate-600 mt-1">
            Deterministic missing value imputation, type correction, duplicate removal, text normalization, and versioned Parquet storage.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 text-xs font-mono font-bold uppercase rounded-none border border-[var(--kaan-ink)] text-white bg-[var(--kaan-green)] shadow-[2px_2px_0_var(--kaan-ink)]">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            PARQUET ENGINE OK
          </Badge>
          {selectedDataset && (
            <Button variant="outline" size="sm" onClick={handleBack} className="border border-[var(--kaan-ink)] bg-[var(--kaan-paper)] text-[var(--kaan-ink)] hover:bg-[var(--kaan-cream)] font-mono text-xs uppercase rounded-none shadow-[2px_2px_0_var(--kaan-ink)]">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Catalog
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 border border-[var(--kaan-ink)] bg-[#FDF0ED] text-[var(--kaan-ink)] text-xs font-mono shadow-[3px_3px_0_var(--kaan-ink)] flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-[var(--kaan-coral)] shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* Dataset Preparation Workbench */}
      {selectedDataset && profileData ? (
        <DatasetPreparationView
          profileData={profileData}
          onPreparationComplete={() => handleSelectDataset(selectedDataset)}
        />
      ) : loadingProfile ? (
        <div className="flex items-center justify-center p-12 text-[var(--kaan-ink)] font-mono text-xs space-x-2 border border-[var(--kaan-ink)] bg-[var(--kaan-paper)] shadow-[4px_4px_0_var(--kaan-ink)]">
          <RefreshCw className="h-4 w-4 animate-spin text-[var(--kaan-green)]" />
          <span>Loading dataset profile & preparation workbench...</span>
        </div>
      ) : (
        <Card className="bg-[var(--kaan-paper)] border border-[var(--kaan-ink)] rounded-none shadow-[4px_4px_0_var(--kaan-ink)]">
          <CardHeader className="border-b border-[var(--kaan-ink)] bg-[var(--kaan-cream)]">
            <CardTitle className="text-base font-mono font-bold uppercase tracking-wider text-[var(--kaan-ink)] flex items-center gap-2">
              <Database className="h-4 w-4 text-[var(--kaan-ink)]" />
              Select Dataset to Prepare
            </CardTitle>
            <CardDescription className="text-xs font-mono text-slate-600">
              Choose an ingested dataset from your workspace to apply deterministic cleaning and transformations.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="flex items-center justify-center p-8 text-[var(--kaan-ink)] font-mono text-xs space-x-2">
                <RefreshCw className="h-4 w-4 animate-spin text-[var(--kaan-green)]" />
                <span>Fetching workspace datasets...</span>
              </div>
            ) : datasets.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-[var(--kaan-ink)] bg-[var(--kaan-paper)] font-mono">
                <Database className="h-8 w-8 text-[var(--kaan-ink)] mx-auto mb-2 opacity-60" />
                <p className="font-bold text-sm text-[var(--kaan-ink)] uppercase">No datasets available for preparation</p>
                <p className="text-xs text-slate-600 mt-1">
                  Upload a CSV dataset on the Data page to begin.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono">
                {datasets.map((ds) => (
                  <Card
                    key={ds.id}
                    className="bg-[var(--kaan-paper)] border border-[var(--kaan-ink)] hover:bg-[var(--kaan-cream)] transition-all cursor-pointer rounded-none shadow-[3px_3px_0_var(--kaan-ink)] flex flex-col justify-between"
                    onClick={() => handleSelectDataset(ds)}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[var(--kaan-ink)] flex items-center gap-2 truncate">
                          <FileSpreadsheet className="h-4 w-4 text-[var(--kaan-ink)] shrink-0" />
                          {ds.name}
                        </span>
                        <Badge variant="outline" className="border border-[var(--kaan-ink)] text-[var(--kaan-ink)] bg-[var(--kaan-cream)] text-[9px] uppercase font-bold shrink-0 rounded-none">
                          {ds.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-600 space-y-1">
                        <p className="flex items-center gap-1 truncate">
                          <HardDrive className="h-3 w-3 shrink-0" />
                          {ds.original_filename} ({(ds.file_size_bytes / 1024).toFixed(1)} KB)
                        </p>
                        <p className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 shrink-0" />
                          {new Date(ds.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="pt-2 flex items-center justify-between border-t border-[var(--kaan-ink)]/20 text-xs">
                        <span className="font-bold text-[var(--kaan-ink)] text-[11px]">
                          {ds.row_count ?? 0} rows × {ds.column_count ?? 0} cols
                        </span>
                        <Button size="sm" variant="outline" className="border border-[var(--kaan-ink)] bg-[var(--kaan-cream)] text-[var(--kaan-ink)] hover:bg-[var(--kaan-paper)] font-mono text-[10px] uppercase rounded-none shadow-[2px_2px_0_var(--kaan-ink)]">
                          <Wrench className="h-3 w-3 mr-1" /> Prepare
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

