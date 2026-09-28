"use client";

import React, { useState, useRef } from "react";
import { Upload, FileText, CheckCircle2, AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { uploadDataset, DatasetUploadResponse } from "@/lib/api-client";

interface DatasetUploaderProps {
  onUploadSuccess?: (dataset: DatasetUploadResponse) => void;
}

export function DatasetUploader({ onUploadSuccess }: DatasetUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<DatasetUploadResponse | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    setError(null);
    setSuccessData(null);

    if (!selectedFile.name.toLowerCase().endsWith(".csv") && !selectedFile.name.toLowerCase().endsWith(".txt")) {
      setError("Invalid file format. Please upload a .csv file.");
      setFile(null);
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      setError("File size exceeds 50MB limit.");
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const res = await uploadDataset(file);
      setSuccessData(res);
      setFile(null);
      if (onUploadSuccess) {
        onUploadSuccess(res);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during dataset ingestion.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setError(null);
    setSuccessData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full space-y-4">
      {!successData ? (
        <div
          data-testid="dropzone"
          tabIndex={0}
          role="button"
          aria-label="Upload CSV Dataset file dropzone"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500 ${
            isDragOver
              ? "border-indigo-500 bg-indigo-950/20 scale-[1.01]"
              : "border-slate-800 bg-slate-900/50 hover:border-slate-700"
          }`}
          onClick={() => fileInputRef.current?.click()}
        >

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.txt"
            className="hidden"
            data-testid="file-input"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0]);
              }
            }}
          />

          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="p-3 bg-slate-800/80 rounded-full text-indigo-400">
              <Upload className="h-7 w-7" />
            </div>

            <div>
              <p className="text-base font-semibold text-slate-100">
                {file ? file.name : "Choose a CSV file or drag & drop"}
              </p>
              <p className="text-sm text-slate-400 mt-1">
                {file
                  ? `${(file.size / 1024).toFixed(1)} KB — Ready to Ingest`
                  : "Supports standard CSV files up to 50MB"}
              </p>
            </div>

            {file && (
              <div className="flex items-center space-x-3 pt-2" onClick={(e) => e.stopPropagation()}>
                <Button
                  data-testid="upload-button"
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Validating & Ingesting...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Upload CSV Dataset
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={isUploading}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Successful Registration Summary Banner */
        <div
          data-testid="upload-success-card"
          className="border border-emerald-500/30 bg-emerald-950/20 rounded-xl p-6 space-y-4"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              <div>
                <h3 className="font-semibold text-emerald-100 text-lg">
                  Dataset Registered Successfully
                </h3>
                <p className="text-xs text-emerald-300/80">
                  Raw uploaded file is saved unchanged in raw immutable storage.
                </p>
              </div>
            </div>
            <Badge variant="outline" className="border-emerald-500/40 text-emerald-300 bg-emerald-900/40">
              Raw Immutability Preserved
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-900/60 rounded-lg p-4 text-sm border border-slate-800">
            <div>
              <span className="text-xs text-slate-400 block">Dataset Name</span>
              <span className="font-medium text-slate-100 truncate block">{successData.name}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Records / Rows</span>
              <span className="font-medium text-slate-100 block">{successData.row_count ?? "N/A"}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Columns</span>
              <span className="font-medium text-slate-100 block">{successData.column_count ?? "N/A"}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">File Size</span>
              <span className="font-medium text-slate-100 block">
                {(successData.file_size_bytes / 1024).toFixed(1)} KB
              </span>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Upload Another CSV
            </Button>
          </div>
        </div>
      )}

      {/* Error state alert */}
      {error && (
        <div
          data-testid="upload-error-alert"
          className="flex items-center space-x-3 border border-rose-500/30 bg-rose-950/20 text-rose-200 rounded-lg p-4 text-sm"
        >
          <AlertTriangle className="h-5 w-5 text-rose-400 flex-shrink-0" />
          <div className="flex-1">{error}</div>
        </div>
      )}
    </div>
  );
}
