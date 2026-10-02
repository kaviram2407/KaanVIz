"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Database,
  Upload,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Trash2,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  ArrowRight,
  FileSpreadsheet,
  Layers,
  Wrench,
  Bot,
} from "lucide-react";
import Link from "next/link";
import { DatasetUploader } from "@/components/dataset-uploader";
import { DatasetList } from "@/components/dataset-list";
import { DatasetProfileView } from "@/components/dataset-profile-view";
import {
  fetchWorkspaceDatasets,
  fetchDatasetProfile,
  deleteDataset,
  clearWorkspaceData,
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

  // Single dataset deletion state
  const [deletingDataset, setDeletingDataset] = useState<DatasetItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Clear workspace data state
  const [isClearWorkspaceOpen, setIsClearWorkspaceOpen] = useState(false);
  const [confirmClearText, setConfirmClearText] = useState("");
  const [isClearing, setIsClearing] = useState(false);

  // Notification banners
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

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
    setNotification({
      type: "success",
      message: `Dataset '${_newDataset.name}' uploaded successfully.`,
    });
  };

  const handleBackToCatalog = () => {
    setSelectedDataset(null);
    setProfileData(null);
    setProfileError(null);
  };

  const handleInitiateDelete = (dataset: DatasetItem) => {
    setDeletingDataset(dataset);
  };

  const handleConfirmDeleteDataset = async () => {
    if (!deletingDataset) return;
    setIsDeleting(true);
    setNotification(null);

    try {
      await deleteDataset(deletingDataset.id, deletingDataset.workspace_id);
      
      if (selectedDataset?.id === deletingDataset.id) {
        setSelectedDataset(null);
        setProfileData(null);
        setProfileError(null);
      }

      setNotification({
        type: "success",
        message: `Dataset '${deletingDataset.name}' and all associated artifacts permanently deleted.`,
      });

      setDeletingDataset(null);
      await loadDatasets();
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Failed to delete dataset.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmClearWorkspaceData = async () => {
    if (confirmClearText !== "CLEAR") return;
    setIsClearing(true);
    setNotification(null);

    try {
      await clearWorkspaceData("CLEAR", "default");
      setSelectedDataset(null);
      setProfileData(null);
      setProfileError(null);

      setNotification({
        type: "success",
        message: "All workspace datasets and associated artifacts permanently cleared.",
      });

      setIsClearWorkspaceOpen(false);
      setConfirmClearText("");
      await loadDatasets();
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Failed to clear workspace data.",
      });
    } finally {
      setIsClearing(false);
    }
  };

  if (selectedDataset) {
    if (isLoadingProfile) {
      return (
        <div className="mx-auto max-w-6xl space-y-6 p-6">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackToCatalog}
            className="border-[var(--kaan-ink)] bg-[var(--kaan-paper)] text-[var(--kaan-ink)] hover:bg-[var(--kaan-yellow)]"
          >
            ← Back to Catalog
          </Button>
          <div className="retro-panel p-12 text-center flex flex-col items-center justify-center space-y-3">
            <Loader2 className="h-8 w-8 text-[var(--kaan-green)] animate-spin" />
            <p className="font-bold text-sm">Computing & Loading Dataset Profile...</p>
            <p className="text-xs text-[var(--muted-foreground)]">Calculating column types, null counts, and deterministic statistics.</p>
          </div>
        </div>
      );
    }

    if (profileError) {
      return (
        <div className="mx-auto max-w-6xl space-y-6 p-6">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackToCatalog}
            className="border-[var(--kaan-ink)] bg-[var(--kaan-paper)] text-[var(--kaan-ink)] hover:bg-[var(--kaan-yellow)]"
          >
            ← Back to Catalog
          </Button>
          <div className="retro-panel p-8 text-center space-y-3 border-[var(--kaan-coral)]">
            <AlertTriangle className="h-8 w-8 text-[var(--kaan-coral)] mx-auto" />
            <h3 className="font-bold text-base">Failed to Load Profile</h3>
            <p className="text-xs text-[var(--muted-foreground)]">{profileError}</p>
          </div>
        </div>
      );
    }

    if (profileData) {
      return (
        <div className="mx-auto max-w-6xl space-y-6 p-6">
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
    <div className="mx-auto max-w-6xl space-y-8 p-2 sm:p-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 border-b border-[var(--kaan-ink)] pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="retro-label text-[var(--kaan-green)] mb-1">
            Workspace / Data Shelf
          </div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
            Data Management & Workbench
          </h1>
          <p className="mt-1 text-xs text-[var(--muted-foreground)]">
            Safe CSV ingestion, immutable raw storage, explicit dataset deletion, and workspace data cleanup.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadDatasets}
            disabled={isLoadingCatalog}
            className="border-[var(--kaan-ink)] bg-[var(--kaan-paper)] text-[var(--kaan-ink)] shadow-[2px_2px_0_var(--kaan-ink)] hover:bg-[var(--kaan-yellow)]"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingCatalog ? "animate-spin" : ""}`} />
            Refresh Catalog
          </Button>

          <Button
            variant="outline"
            size="sm"
            data-testid="clear-workspace-data-trigger-btn"
            onClick={() => setIsClearWorkspaceOpen(true)}
            className="border-[var(--kaan-ink)] bg-[var(--kaan-coral)] text-[var(--kaan-paper)] shadow-[2px_2px_0_var(--kaan-ink)] hover:opacity-90"
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            Clear Workspace Data
          </Button>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          data-testid="data-page-notification"
          className={`p-4 border shadow-[3px_3px_0_var(--kaan-ink)] flex items-center justify-between text-xs font-bold ${
            notification.type === "success"
              ? "border-[var(--kaan-ink)] bg-[var(--kaan-teal)] text-[var(--kaan-paper)]"
              : "border-[var(--kaan-ink)] bg-[var(--kaan-coral)] text-[var(--kaan-paper)]"
          }`}
        >
          <div className="flex items-center space-x-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs font-black ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* AI Data Assist Banner */}
      <div className="retro-panel p-5 bg-[var(--kaan-paper)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-[var(--kaan-ink)] bg-[var(--kaan-yellow)]">
              <Sparkles className="h-5 w-5 text-[var(--kaan-ink)]" />
            </div>
            <div>
              <div className="retro-label text-[var(--kaan-green)]">AI Data Assist</div>
              <h2 className="text-sm font-black mt-0.5">Automated Data Actions</h2>
              <p className="text-[11px] text-[var(--muted-foreground)]">
                Trigger intelligent cleaning, anomaly detection, type fixes, or table explanation.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/prepare"
              className="flex items-center gap-1 border border-[var(--kaan-ink)] bg-[var(--kaan-cream)] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider hover:bg-[var(--kaan-yellow)]"
            >
              Clean my data
            </Link>
            <Link
              href="/prepare"
              className="flex items-center gap-1 border border-[var(--kaan-ink)] bg-[var(--kaan-cream)] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider hover:bg-[var(--kaan-yellow)]"
            >
              Find anomalies
            </Link>
            <Link
              href="/prepare"
              className="flex items-center gap-1 border border-[var(--kaan-ink)] bg-[var(--kaan-cream)] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider hover:bg-[var(--kaan-yellow)]"
            >
              Fix data types
            </Link>
            <Link
              href="/ai-analyst"
              className="flex items-center gap-1 border border-[var(--kaan-ink)] bg-[var(--kaan-coral)] text-[var(--kaan-paper)] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider hover:opacity-90"
            >
              Explain table ✦
            </Link>
          </div>
        </div>
      </div>

      {/* CSV Ingestion Dropzone Card */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Upload className="h-4 w-4 text-[var(--kaan-green)]" />
          <h2 className="text-sm font-black uppercase tracking-wider">Upload CSV Dataset</h2>
        </div>
        <DatasetUploader onUploadSuccess={handleUploadSuccess} />
      </div>

      {/* Registered Datasets Section */}
      <div className="space-y-4 pt-4 border-t border-[var(--kaan-ink)]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider">Registered Datasets</h2>
            <p className="text-xs text-[var(--muted-foreground)]">
              Inspect profiles or permanently delete individual datasets and associated artifacts.
            </p>
          </div>
          <span className="text-xs font-mono font-bold">
            Total: {datasets.length}
          </span>
        </div>

        <div>
          <DatasetList
            datasets={datasets}
            isLoading={isLoadingCatalog}
            onSelectDataset={handleSelectDataset}
            onDeleteDataset={handleInitiateDelete}
          />
        </div>
      </div>

      {/* SINGLE DATASET DELETE CONFIRMATION MODAL */}
      {deletingDataset && (
        <div
          data-testid="delete-dataset-modal"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="retro-panel max-w-md w-full p-6 space-y-5 shadow-[6px_6px_0_var(--kaan-ink)]">
            <div className="flex items-center space-x-3 text-[var(--kaan-coral)]">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <h3 className="text-lg font-black">Delete Dataset</h3>
            </div>

            <div className="text-xs text-[var(--kaan-ink)] space-y-3">
              <p>
                Are you sure you want to permanently delete{" "}
                <span className="font-bold">{deletingDataset.name}</span>?
              </p>

              <div className="border border-[var(--kaan-ink)] bg-[var(--kaan-cream)] p-3.5 space-y-2">
                <p className="text-xs font-bold uppercase text-[var(--kaan-coral)]">
                  This permanently deletes:
                </p>
                <ul className="text-[11px] list-disc list-inside space-y-1">
                  <li>Uploaded raw file</li>
                  <li>Prepared/processed artifacts</li>
                  <li>Dataset metadata</li>
                  <li>Profiling metadata</li>
                  <li>Dataset-version metadata</li>
                  <li>Data-model bindings/relationships involving this dataset</li>
                  <li>Dashboard items referencing this dataset</li>
                  <li>Related derived metadata</li>
                </ul>
              </div>

              <p className="text-xs font-bold text-[var(--kaan-coral)]">
                This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2 border-t border-[var(--kaan-ink)]">
              <Button
                variant="outline"
                size="sm"
                data-testid="cancel-delete-dataset-btn"
                onClick={() => setDeletingDataset(null)}
                disabled={isDeleting}
                className="border-[var(--kaan-ink)] bg-[var(--kaan-paper)] text-[var(--kaan-ink)] hover:bg-[var(--kaan-yellow)]"
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                size="sm"
                data-testid="confirm-delete-dataset-btn"
                disabled={isDeleting}
                onClick={handleConfirmDeleteDataset}
                className="border-[var(--kaan-ink)] bg-[var(--kaan-coral)] text-[var(--kaan-paper)] font-bold shadow-[2px_2px_0_var(--kaan-ink)] hover:opacity-90"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                Delete Permanently
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CLEAR WORKSPACE DATA CONFIRMATION MODAL */}
      {isClearWorkspaceOpen && (
        <div
          data-testid="clear-workspace-modal"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="retro-panel max-w-md w-full p-6 space-y-5 shadow-[6px_6px_0_var(--kaan-ink)]">
            <div className="flex items-center space-x-3 text-[var(--kaan-coral)]">
              <ShieldAlert className="h-6 w-6 shrink-0" />
              <h3 className="text-lg font-black">Clear Workspace Data</h3>
            </div>

            <div className="text-xs text-[var(--kaan-ink)] space-y-3">
              <p>
                You are about to permanently delete <strong>ALL datasets</strong> and their associated uploaded and processed data from this workspace.
              </p>

              <p className="text-xs font-bold text-[var(--kaan-coral)]">
                This cannot be undone.
              </p>

              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold uppercase block">
                  Type <span className="font-mono text-[var(--kaan-coral)] bg-[var(--kaan-cream)] px-1.5 py-0.5 border border-[var(--kaan-ink)]">CLEAR</span> to confirm:
                </label>
                <input
                  type="text"
                  autoFocus
                  data-testid="clear-workspace-input"
                  value={confirmClearText}
                  onChange={(e) => setConfirmClearText(e.target.value)}
                  placeholder="CLEAR"
                  className="w-full bg-[var(--kaan-paper)] border border-[var(--kaan-ink)] px-3 py-2 text-sm text-[var(--kaan-ink)] placeholder-[var(--muted-foreground)] focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2 border-t border-[var(--kaan-ink)]">
              <Button
                variant="outline"
                size="sm"
                data-testid="cancel-clear-workspace-btn"
                onClick={() => {
                  setIsClearWorkspaceOpen(false);
                  setConfirmClearText("");
                }}
                disabled={isClearing}
                className="border-[var(--kaan-ink)] bg-[var(--kaan-paper)] text-[var(--kaan-ink)] hover:bg-[var(--kaan-yellow)]"
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                size="sm"
                data-testid="confirm-clear-workspace-btn"
                disabled={confirmClearText !== "CLEAR" || isClearing}
                onClick={handleConfirmClearWorkspaceData}
                className="border-[var(--kaan-ink)] bg-[var(--kaan-coral)] text-[var(--kaan-paper)] font-bold shadow-[2px_2px_0_var(--kaan-ink)] disabled:opacity-40"
              >
                {isClearing ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                Clear All Data
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
