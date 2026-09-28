"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Database, Upload, RefreshCw, Loader2, AlertTriangle, Trash2, CheckCircle2, ShieldAlert } from "lucide-react";
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

  // Trigger single dataset delete confirmation modal
  const handleInitiateDelete = (dataset: DatasetItem) => {
    setDeletingDataset(dataset);
  };

  // Perform single dataset deletion
  const handleConfirmDeleteDataset = async () => {
    if (!deletingDataset) return;
    setIsDeleting(true);
    setNotification(null);

    try {
      await deleteDataset(deletingDataset.id, deletingDataset.workspace_id);
      
      // If deleted dataset was selected, clear selection
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

  // Perform clear all workspace data
  const handleConfirmClearWorkspaceData = async () => {
    if (confirmClearText !== "CLEAR") return;
    setIsClearing(true);
    setNotification(null);

    try {
      await clearWorkspaceData("CLEAR", "default");

      // Reset any selected dataset & profile state
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
            <h1 className="text-2xl font-bold text-slate-100">Data Management & Cleanup</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Safe CSV ingestion, immutable raw storage, explicit dataset deletion, and workspace data cleanup.
          </p>
        </div>

        <div className="flex items-center space-x-3">
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

          <Button
            variant="outline"
            size="sm"
            data-testid="clear-workspace-data-trigger-btn"
            onClick={() => setIsClearWorkspaceOpen(true)}
            className="border-rose-900/50 text-rose-400 hover:bg-rose-950/50 hover:border-rose-700"
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
          className={`p-4 rounded-xl border flex items-center justify-between text-sm ${
            notification.type === "success"
              ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-200"
              : "bg-rose-950/40 border-rose-500/30 text-rose-200"
          }`}
        >
          <div className="flex items-center space-x-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-xs opacity-60 hover:opacity-100 font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

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
              Inspect profiles or permanently delete individual datasets and associated artifacts.
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
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center space-x-3 text-rose-400">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <h3 className="text-lg font-bold text-slate-100">Delete Dataset</h3>
            </div>

            <div className="text-sm text-slate-300 space-y-3">
              <p>
                Are you sure you want to permanently delete{" "}
                <span className="font-semibold text-slate-100">{deletingDataset.name}</span>?
              </p>

              <div className="bg-rose-950/30 border border-rose-900/40 rounded-lg p-3.5 space-y-2">
                <p className="text-xs font-semibold text-rose-300">
                  This permanently deletes:
                </p>
                <ul className="text-xs text-slate-300 list-disc list-inside space-y-1">
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

              <p className="text-xs font-semibold text-rose-400">
                This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-800/80">
              <Button
                variant="outline"
                size="sm"
                data-testid="cancel-delete-dataset-btn"
                onClick={() => setDeletingDataset(null)}
                disabled={isDeleting}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                variant="outline"

                size="sm"
                data-testid="confirm-delete-dataset-btn"
                disabled={isDeleting}
                onClick={handleConfirmDeleteDataset}
                className="bg-rose-600 hover:bg-rose-700 text-white font-medium"
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
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center space-x-3 text-rose-400">
              <ShieldAlert className="h-6 w-6 shrink-0" />
              <h3 className="text-lg font-bold text-slate-100">Clear Workspace Data</h3>
            </div>

            <div className="text-sm text-slate-300 space-y-3">
              <p className="text-slate-300">
                You are about to permanently delete <strong className="text-slate-100">ALL datasets</strong> and their associated uploaded and processed data from this workspace.
              </p>

              <p className="text-xs font-semibold text-rose-400">
                This cannot be undone.
              </p>

              <div className="space-y-2 pt-2">
                <label className="text-xs font-medium text-slate-300 block">
                  Type <span className="font-mono text-rose-300 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800/50">CLEAR</span> to confirm:
                </label>
                <input
                  type="text"
                  autoFocus
                  data-testid="clear-workspace-input"
                  value={confirmClearText}
                  onChange={(e) => setConfirmClearText(e.target.value)}
                  placeholder="CLEAR"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-rose-500 font-mono"
                />

              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-800/80">
              <Button
                variant="outline"
                size="sm"
                data-testid="cancel-clear-workspace-btn"
                onClick={() => {
                  setIsClearWorkspaceOpen(false);
                  setConfirmClearText("");
                }}
                disabled={isClearing}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                variant="outline"

                size="sm"
                data-testid="confirm-clear-workspace-btn"
                disabled={confirmClearText !== "CLEAR" || isClearing}
                onClick={handleConfirmClearWorkspaceData}
                className="bg-rose-600 hover:bg-rose-700 text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed"
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
