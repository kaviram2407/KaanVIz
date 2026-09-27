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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Wrench className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Data Preparation & Cleaning</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Deterministic missing value imputation, type correction, duplicate removal, text normalization, and versioned Parquet storage.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success" className="px-3 py-1 text-xs">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            Phase 4 — Complete
          </Badge>
          {selectedDataset && (
            <Button variant="outline" size="sm" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Dataset List
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-md bg-destructive/15 text-destructive text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Dataset Preparation Workbench */}
      {selectedDataset && profileData ? (
        <DatasetPreparationView
          profileData={profileData}
          onPreparationComplete={() => handleSelectDataset(selectedDataset)}
        />
      ) : loadingProfile ? (
        <div className="flex items-center justify-center p-12 text-muted-foreground space-x-2">
          <RefreshCw className="h-5 w-5 animate-spin text-primary" />
          <span>Loading dataset profile & preparation workbench...</span>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Select Dataset to Prepare
            </CardTitle>
            <CardDescription>
              Choose an ingested dataset from your workspace to apply deterministic cleaning and transformations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center p-8 text-muted-foreground space-x-2">
                <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                <span>Fetching workspace datasets...</span>
              </div>
            ) : datasets.length === 0 ? (
              <div className="p-8 text-center border border-dashed rounded-lg bg-card/50">
                <Database className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="font-semibold text-sm">No datasets available for preparation</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload a CSV dataset on the Data page to begin.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {datasets.map((ds) => (
                  <Card
                    key={ds.id}
                    className="hover:border-primary/50 transition-all cursor-pointer group flex flex-col justify-between"
                    onClick={() => handleSelectDataset(ds)}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm flex items-center gap-2 truncate">
                          <FileSpreadsheet className="h-4 w-4 text-primary" />
                          {ds.name}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {ds.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p className="flex items-center gap-1">
                          <HardDrive className="h-3 w-3" />
                          {ds.original_filename} ({(ds.file_size_bytes / 1024).toFixed(1)} KB)
                        </p>
                        <p className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(ds.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="pt-2 flex items-center justify-between border-t border-border text-xs">
                        <span className="font-mono text-muted-foreground">
                          {ds.row_count ?? 0} rows × {ds.column_count ?? 0} cols
                        </span>
                        <Button size="sm" variant="secondary" className="text-xs">
                          <Wrench className="h-3.5 w-3.5 mr-1" /> Prepare
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
