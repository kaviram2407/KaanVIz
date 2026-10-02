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
    <div className="w-full space-y-4 font-sans">
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
          className={`relative border-2 border-dashed border-[var(--kaan-ink)] rounded-none p-8 text-center transition-all duration-150 cursor-pointer bg-[var(--kaan-paper)] shadow-[4px_4px_0_var(--kaan-ink)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0_var(--kaan-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--kaan-green)] ${
            isDragOver
              ? "bg-[var(--kaan-cream)] border-[var(--kaan-green)] scale-[1.01]"
              : ""
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
            <div className="p-3 bg-[var(--kaan-cream)] border border-[var(--kaan-ink)] text-[var(--kaan-ink)] shadow-[2px_2px_0_var(--kaan-ink)]">
              <Upload className="h-6 w-6" />
            </div>

            <div>
              <p className="text-base font-mono font-bold text-[var(--kaan-ink)] uppercase tracking-wider">
                {file ? file.name : "Choose a CSV file or drag & drop"}
              </p>
              <p className="text-xs font-mono text-slate-600 mt-1">
                {file
                  ? `${(file.size / 1024).toFixed(1)} KB — Ready for ingestion`
                  : "Supports standard CSV files up to 50MB. Raw file immutability preserved."}
              </p>
            </div>

            {file && (
              <div className="flex items-center space-x-3 pt-2" onClick={(e) => e.stopPropagation()}>
                <Button
                  data-testid="upload-button"
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="bg-[var(--kaan-green)] hover:bg-[var(--kaan-teal)] text-[var(--kaan-paper)] font-mono uppercase tracking-wider font-bold border border-[var(--kaan-ink)] shadow-[2px_2px_0_var(--kaan-ink)] rounded-none"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Ingesting & Profiling...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Ingest CSV Dataset
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={isUploading}
                  className="bg-[var(--kaan-paper)] border border-[var(--kaan-ink)] text-[var(--kaan-ink)] hover:bg-[var(--kaan-cream)] font-mono uppercase text-xs rounded-none shadow-[2px_2px_0_var(--kaan-ink)]"
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
          className="border border-[var(--kaan-ink)] bg-[var(--kaan-paper)] p-6 space-y-4 shadow-[4px_4px_0_var(--kaan-ink)]"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[var(--kaan-green)] text-white border border-[var(--kaan-ink)]">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-mono font-bold text-[var(--kaan-ink)] text-base uppercase tracking-wider">
                  Dataset Registered Successfully
                </h3>
                <p className="text-xs font-mono text-slate-600">
                  Raw uploaded file preserved in immutable DuckDB backend storage.
                </p>
              </div>
            </div>
            <Badge variant="outline" className="border border-[var(--kaan-ink)] text-[var(--kaan-ink)] bg-[var(--kaan-yellow)] font-mono text-[10px] uppercase rounded-none shadow-[2px_2px_0_var(--kaan-ink)]">
              RAW IMMUTABILITY OK
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[var(--kaan-cream)] p-4 text-xs font-mono border border-[var(--kaan-ink)] shadow-[2px_2px_0_var(--kaan-ink)]">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-bold">Dataset</span>
              <span className="font-bold text-[var(--kaan-ink)] truncate block">{successData.name}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-bold">Rows</span>
              <span className="font-bold text-[var(--kaan-ink)] block">{successData.row_count ?? "N/A"}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-bold">Columns</span>
              <span className="font-bold text-[var(--kaan-ink)] block">{successData.column_count ?? "N/A"}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block font-bold">Size</span>
              <span className="font-bold text-[var(--kaan-ink)] block">
                {(successData.file_size_bytes / 1024).toFixed(1)} KB
              </span>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="border border-[var(--kaan-ink)] bg-[var(--kaan-paper)] text-[var(--kaan-ink)] hover:bg-[var(--kaan-cream)] font-mono text-xs uppercase rounded-none shadow-[2px_2px_0_var(--kaan-ink)]"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-2" />
              Upload Another CSV
            </Button>
          </div>
        </div>
      )}

      {/* Error state alert */}
      {error && (
        <div
          data-testid="upload-error-alert"
          className="flex items-center space-x-3 border border-[var(--kaan-ink)] bg-[#FDF0ED] text-[var(--kaan-ink)] p-4 text-xs font-mono shadow-[3px_3px_0_var(--kaan-ink)]"
        >
          <AlertTriangle className="h-5 w-5 text-[var(--kaan-coral)] flex-shrink-0" />
          <div className="flex-1 font-semibold">{error}</div>
        </div>
      )}
    </div>
  );
}

