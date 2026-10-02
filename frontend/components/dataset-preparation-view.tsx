"use client";

import { useState, useEffect } from "react";
import {
  ColumnProfileItem,
  DatasetProfileResponse,
  PreparationOperation,
  PreparedMetricsSummary,
  TransformationItem,
  DatasetSampleResponse,
  PreviewPreparationResponse,
  prepareDataset,
  fetchDatasetTransformations,
  fetchDatasetSample,
  previewDatasetPreparation,
} from "@/lib/api-client";
import {
  Wrench,
  Play,
  History,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Plus,
  Trash2,
  Eye,
  ChevronDown,
  Table as TableIcon,
  ArrowRight,
} from "lucide-react";

interface DatasetPreparationViewProps {
  profileData: DatasetProfileResponse;
  onPreparationComplete?: () => void;
}

const SUPPORTED_HEADER_TYPES = [
  "INTEGER",
  "BIGINT",
  "FLOAT",
  "DECIMAL",
  "VARCHAR",
  "DATE",
  "DATETIME",
  "BOOLEAN",
];

export function DatasetPreparationView({
  profileData,
  onPreparationComplete,
}: DatasetPreparationViewProps) {
  const [activeTab, setActiveTab] = useState<
    "missing" | "duplicates" | "type" | "text" | "columns" | "date"
  >("missing");

  // Queued operations
  const [queuedOperations, setQueuedOperations] = useState<PreparationOperation[]>([]);

  // Form states
  const [targetColumn, setTargetColumn] = useState<string>(
    profileData.columns[0]?.name || ""
  );
  const [fillStrategy, setFillStrategy] = useState<string>("constant");
  const [fillValue, setFillValue] = useState<string>("0");
  const [dupKeep, setDupKeep] = useState<string>("first");
  const [targetType, setTargetType] = useState<string>("integer");
  const [textAction, setTextAction] = useState<string>("trim");
  const [findVal, setFindVal] = useState<string>("");
  const [replaceVal, setReplaceVal] = useState<string>("");
  const [columnAction, setColumnAction] = useState<string>("rename");
  const [newColumnName, setNewColumnName] = useState<string>("");
  const [dateAction, setDateAction] = useState<string>("extract_year");

  // Execution states
  const [isExecuting, setIsExecuting] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metricsSummary, setMetricsSummary] = useState<PreparedMetricsSummary | null>(null);

  // Lineage states
  const [transformations, setTransformations] = useState<TransformationItem[]>([]);
  const [loadingLineage, setLoadingLineage] = useState(false);

  // Data Preview & Dry-Run Preview states
  const [sampleData, setSampleData] = useState<DatasetSampleResponse | null>(null);
  const [previewData, setPreviewData] = useState<PreviewPreparationResponse | null>(null);
  const [loadingSample, setLoadingSample] = useState(false);
  const [viewMode, setViewMode] = useState<"current" | "preview">("current");
  const [previewMessage, setPreviewMessage] = useState<string | null>(null);
  const [appliedMessage, setAppliedMessage] = useState<string | null>(null);

  // Interactive Header Dropdown State
  const [activeTypeDropdown, setActiveTypeDropdown] = useState<string | null>(null);
  const [currentVersionId, setCurrentVersionId] = useState<string>(profileData.version_id);

  useEffect(() => {
    loadLineage();
    loadSample(currentVersionId);
  }, [profileData.dataset_id, currentVersionId]);

  const loadLineage = async () => {
    try {
      setLoadingLineage(true);
      const res = await fetchDatasetTransformations(profileData.dataset_id);
      setTransformations(res.transformations || []);
    } catch (err) {
      console.error("Failed to load lineage:", err);
    } finally {
      setLoadingLineage(false);
    }
  };

  const loadSample = async (versionId?: string) => {
    try {
      setLoadingSample(true);
      const res = await fetchDatasetSample(profileData.dataset_id, versionId, 50);
      setSampleData(res);
    } catch (err) {
      console.error("Failed to load dataset sample:", err);
    } finally {
      setLoadingSample(false);
    }
  };

  const handlePreviewChanges = async () => {
    if (queuedOperations.length === 0) {
      setPreviewMessage("No operations queued to preview.");
      return;
    }

    try {
      setIsPreviewing(true);
      setError(null);
      const res = await previewDatasetPreparation(
        profileData.dataset_id,
        queuedOperations,
        currentVersionId,
        50
      );

      setPreviewData(res);
      setViewMode("preview");

      if (res.changed_cells_count > 0) {
        setPreviewMessage(
          `Preview: ${res.changed_cells_count} cells changed across ${res.changed_rows_count} rows.`
        );
      } else {
        setPreviewMessage("No data changes detected for this preparation plan.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to preview preparation plan.");
      setPreviewData(null);
    } finally {
      setIsPreviewing(false);
    }
  };

  const addHeaderTypeChange = (colName: string, newType: string) => {
    const mappedType = newType.toLowerCase();
    const op: PreparationOperation = {
      operation_type: "convert_type",
      target_column: colName,
      params: { target_type: mappedType },
    };
    setQueuedOperations((prev) => [...prev, op]);
    setActiveTypeDropdown(null);
    setError(null);
  };

  const addOperation = () => {
    let op: PreparationOperation | null = null;

    if (activeTab === "missing") {
      op = {
        operation_type: "fill_missing",
        target_column: targetColumn || undefined,
        params: { strategy: fillStrategy, fill_value: fillValue },
      };
    } else if (activeTab === "duplicates") {
      op = {
        operation_type: "remove_duplicates",
        target_column: targetColumn || undefined,
        params: { keep: dupKeep },
      };
    } else if (activeTab === "type") {
      op = {
        operation_type: "convert_type",
        target_column: targetColumn,
        params: { target_type: targetType },
      };
    } else if (activeTab === "text") {
      op = {
        operation_type: "text_normalization",
        target_column: targetColumn || undefined,
        params: { action: textAction, find_val: findVal, replace_val: replaceVal },
      };
    } else if (activeTab === "columns") {
      op = {
        operation_type: "column_operation",
        target_column: targetColumn,
        params: { action: columnAction, new_name: newColumnName },
      };
    } else if (activeTab === "date") {
      op = {
        operation_type: "date_transform",
        target_column: targetColumn,
        params: { action: dateAction },
      };
    }

    if (op) {
      setQueuedOperations((prev) => [...prev, op]);
      setError(null);
    }
  };

  const removeOperation = (index: number) => {
    setQueuedOperations((prev) => prev.filter((_, i) => i !== index));
  };

  const handleApplyPreparation = async () => {
    if (queuedOperations.length === 0) return;

    try {
      setIsExecuting(true);
      setError(null);
      const res = await prepareDataset(
        profileData.dataset_id,
        queuedOperations,
        currentVersionId
      );

      setMetricsSummary(res.metrics_comparison);
      setCurrentVersionId(res.prepared_version_id);
      setQueuedOperations([]);
      setPreviewData(null);
      setViewMode("current");

      const changedCells = res.metrics_comparison?.before_missing_cells !== undefined
        ? Math.abs((res.metrics_comparison.before_missing_cells || 0) - (res.metrics_comparison.after_missing_cells || 0))
        : 0;

      if (previewData && previewData.changed_cells_count > 0) {
        setAppliedMessage(
          `Preparation applied — ${previewData.changed_cells_count} cells changed across ${previewData.changed_rows_count} rows. Prepared version is now active.`
        );
      } else {
        setAppliedMessage("Preparation applied successfully. Prepared version is now active.");
      }
      setPreviewMessage(null);

      await loadLineage();
      await loadSample(res.prepared_version_id);

      if (onPreparationComplete) {
        onPreparationComplete();
      }
    } catch (err: any) {
      setError(err.message || "Failed to execute preparation operations.");
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans" data-testid="preparation-view">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--kaan-ink)] pb-4">
        <div>
          <h2 className="text-lg font-mono font-bold uppercase tracking-wider text-[var(--kaan-ink)] flex items-center gap-2">
            <Wrench className="w-5 h-5 text-[var(--kaan-green)]" />
            Data Preparation & Cleaning Workbench
          </h2>
          <p className="text-xs font-mono text-slate-600 mt-1">
            Build explicit, deterministic cleaning rules to produce a new prepared dataset version.
          </p>
        </div>
      </div>

      {/* Before vs After Comparison (If Applied) */}
      {metricsSummary && (
        <div className="p-4 bg-[var(--kaan-paper)] border border-[var(--kaan-ink)] shadow-[4px_4px_0_var(--kaan-ink)] font-mono space-y-3">
          <div className="flex items-center gap-2 text-[var(--kaan-green)] font-bold text-sm uppercase">
            <CheckCircle className="w-5 h-5" />
            Preparation Plan Executed Successfully!
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="bg-[var(--kaan-cream)] p-3 border border-[var(--kaan-ink)] shadow-[2px_2px_0_var(--kaan-ink)]">
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Rows</span>
              <span className="font-bold text-[var(--kaan-ink)]">
                {metricsSummary.before_row_count} → {metricsSummary.after_row_count}
              </span>
            </div>
            <div className="bg-[var(--kaan-cream)] p-3 border border-[var(--kaan-ink)] shadow-[2px_2px_0_var(--kaan-ink)]">
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Missing Cells</span>
              <span className="font-bold text-[var(--kaan-ink)]">
                {metricsSummary.before_missing_cells} → {metricsSummary.after_missing_cells}
              </span>
            </div>
            <div className="bg-[var(--kaan-cream)] p-3 border border-[var(--kaan-ink)] shadow-[2px_2px_0_var(--kaan-ink)]">
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Quality Score</span>
              <span className="font-bold text-[var(--kaan-green)]">
                {metricsSummary.before_quality_score}% → {metricsSummary.after_quality_score}%
              </span>
            </div>
            <div className="bg-[var(--kaan-cream)] p-3 border border-[var(--kaan-ink)] shadow-[2px_2px_0_var(--kaan-ink)]">
              <span className="text-slate-500 text-[10px] uppercase font-bold block">Applied Rules</span>
              <span className="font-bold text-[var(--kaan-ink)]">{metricsSummary.operations_applied}</span>
            </div>
          </div>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="p-4 bg-[#FDF0ED] border border-[var(--kaan-ink)] text-[var(--kaan-ink)] text-xs font-mono shadow-[3px_3px_0_var(--kaan-ink)] flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[var(--kaan-coral)] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold uppercase block">Preparation Error</span>
            {error}
          </div>
        </div>
      )}

      {/* Workbench Layout: Controls (Left) vs Plan & Lineage (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-mono">
        {/* Controls Column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Operation Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-[var(--kaan-ink)] pb-2">
            {[
              { id: "missing", label: "Missing Values" },
              { id: "duplicates", label: "Duplicates" },
              { id: "type", label: "Type Correction" },
              { id: "text", label: "Text Normalization" },
              { id: "columns", label: "Columns" },
              { id: "date", label: "Date Operations" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 text-xs font-mono font-bold uppercase transition-colors rounded-none border border-[var(--kaan-ink)] ${
                  activeTab === tab.id
                    ? "bg-[var(--kaan-green)] text-white shadow-[2px_2px_0_var(--kaan-ink)]"
                    : "bg-[var(--kaan-paper)] text-[var(--kaan-ink)] hover:bg-[var(--kaan-cream)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Operation Configuration Form */}
          <div className="p-4 bg-[var(--kaan-paper)] border border-[var(--kaan-ink)] shadow-[4px_4px_0_var(--kaan-ink)] space-y-4">

            {/* Target Column Selector */}
            {activeTab !== "duplicates" && (
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Target Column
                </label>
                <select
                  value={targetColumn}
                  onChange={(e) => setTargetColumn(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {(sampleData?.columns || profileData.columns).map((col) => (
                    <option key={col.name} value={col.name}>
                      {col.name} ({col.physical_type})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Missing Values Options */}
            {activeTab === "missing" && (
              <div className="space-y-3 text-sm">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Strategy</label>
                  <select
                    value={fillStrategy}
                    onChange={(e) => setFillStrategy(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                  >
                    <option value="constant">Fill with constant value</option>
                    <option value="mean">Fill with mean (Numeric)</option>
                    <option value="median">Fill with median (Numeric)</option>
                    <option value="mode">Fill with mode (Category)</option>
                    <option value="remove_rows">Remove affected rows</option>
                  </select>
                </div>
                {fillStrategy === "constant" && (
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">Constant Value</label>
                    <input
                      type="text"
                      value={fillValue}
                      onChange={(e) => setFillValue(e.target.value)}
                      placeholder="e.g. 0, N/A, Unknown"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Duplicates Options */}
            {activeTab === "duplicates" && (
              <div className="space-y-3 text-sm">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Duplicate Removal Strategy</label>
                  <select
                    value={dupKeep}
                    onChange={(e) => setDupKeep(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                  >
                    <option value="first">Keep first occurrence</option>
                    <option value="last">Keep last occurrence</option>
                    <option value="none">Remove all duplicates</option>
                  </select>
                </div>
              </div>
            )}

            {/* Type Conversion Options */}
            {activeTab === "type" && (
              <div className="space-y-3 text-sm">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Target Data Type</label>
                  <select
                    value={targetType}
                    onChange={(e) => setTargetType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                  >
                    <option value="integer">Integer</option>
                    <option value="decimal">Decimal / Float</option>
                    <option value="boolean">Boolean</option>
                    <option value="date">Date (YYYY-MM-DD)</option>
                    <option value="datetime">Datetime (YYYY-MM-DD HH:MM:SS)</option>
                    <option value="string">String / Text</option>
                  </select>
                </div>
              </div>
            )}

            {/* Text Normalization Options */}
            {activeTab === "text" && (
              <div className="space-y-3 text-sm">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Action</label>
                  <select
                    value={textAction}
                    onChange={(e) => setTextAction(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                  >
                    <option value="trim">Trim surrounding whitespace</option>
                    <option value="lowercase">Convert to lowercase</option>
                    <option value="uppercase">Convert to uppercase</option>
                    <option value="replace">Find & Replace text</option>
                  </select>
                </div>
                {textAction === "replace" && (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Find"
                      value={findVal}
                      onChange={(e) => setFindVal(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                    />
                    <input
                      type="text"
                      placeholder="Replace"
                      value={replaceVal}
                      onChange={(e) => setReplaceVal(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Column Options */}
            {activeTab === "columns" && (
              <div className="space-y-3 text-sm">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Action</label>
                  <select
                    value={columnAction}
                    onChange={(e) => setColumnAction(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                  >
                    <option value="rename">Rename column</option>
                    <option value="remove">Remove column</option>
                  </select>
                </div>
                {columnAction === "rename" && (
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">New Column Name</label>
                    <input
                      type="text"
                      placeholder="e.g. clean_customer_id"
                      value={newColumnName}
                      onChange={(e) => setNewColumnName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Date Options */}
            {activeTab === "date" && (
              <div className="space-y-3 text-sm">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Date Extraction</label>
                  <select
                    value={dateAction}
                    onChange={(e) => setDateAction(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                  >
                    <option value="extract_year">Extract Year</option>
                    <option value="extract_month">Extract Month</option>
                    <option value="extract_day">Extract Day</option>
                    <option value="extract_quarter">Extract Quarter</option>
                    <option value="extract_weekday">Extract Weekday</option>
                  </select>
                </div>
              </div>
            )}

            <button
              onClick={addOperation}
              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Operation to Plan
            </button>
          </div>
        </div>

        {/* Right Queue & Lineage Column */}
        <div className="space-y-4">
          {/* Active Preparation Plan Queue */}
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Preparation Plan Queue ({queuedOperations.length})
              </span>
            </div>

            {queuedOperations.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center italic">
                No operations queued. Add operations from controls or column header dropdowns.
              </p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {queuedOperations.map((op, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs flex items-center justify-between gap-2"
                  >
                    <div className="truncate">
                      <span className="font-semibold text-indigo-400 block">{op.operation_type}</span>
                      <span className="text-slate-400 block truncate">
                        {op.target_column ? `Col: ${op.target_column} ` : ""}
                        {JSON.stringify(op.params || {})}
                      </span>
                    </div>
                    <button
                      onClick={() => removeOperation(idx)}
                      className="p-1 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={handlePreviewChanges}
                disabled={queuedOperations.length === 0 || isPreviewing}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                {isPreviewing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Previewing...
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    Preview Changes
                  </>
                )}
              </button>

              <button
                onClick={handleApplyPreparation}
                disabled={queuedOperations.length === 0 || isExecuting}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                {isExecuting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    Apply Plan
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Transformation Lineage */}
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <History className="w-4 h-4 text-indigo-400" />
              Transformation Lineage ({transformations.length})
            </span>

            {loadingLineage ? (
              <p className="text-xs text-slate-500 py-2">Loading lineage...</p>
            ) : transformations.length === 0 ? (
              <p className="text-xs text-slate-500 py-2 italic">
                No dataset transformations recorded yet.
              </p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {transformations.map((tr) => (
                  <div
                    key={tr.id}
                    className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-slate-300 font-semibold">
                      <span>{tr.operation_type}</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(tr.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-slate-400 text-[11px] truncate">
                      {tr.operation_spec.target_column ? `Col: ${tr.operation_spec.target_column}` : ""}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DATA PREVIEW & DRY-RUN COMPARISON TABLE */}
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4" data-testid="data-preview-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <TableIcon className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Data Preview
                {viewMode === "preview" && (
                  <span className="text-xs font-semibold px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full">
                    Dry-Run Preview Active
                  </span>
                )}
              </h3>
              <span className="text-xs text-slate-400">
                Showing first {viewMode === "preview" && previewData ? previewData.rows_after.length : (sampleData?.rows.length || 0)} rows (Server-side limit)
              </span>
            </div>
          </div>

          {/* View Mode Toggle Bar */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-950 p-1 border border-slate-800 rounded-lg text-xs font-medium">
              <button
                onClick={() => setViewMode("current")}
                className={`px-3 py-1 rounded-md transition-colors ${
                  viewMode === "current"
                    ? "bg-indigo-600 text-white font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Current Data
              </button>
              <button
                onClick={() => {
                  if (previewData) {
                    setViewMode("preview");
                  } else {
                    handlePreviewChanges();
                  }
                }}
                disabled={queuedOperations.length === 0}
                className={`px-3 py-1 rounded-md transition-colors ${
                  viewMode === "preview"
                    ? "bg-amber-600 text-white font-semibold"
                    : "text-slate-400 hover:text-slate-200 disabled:text-slate-600"
                }`}
              >
                Preview Changes
              </button>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {previewMessage && (
          <div className={`p-3 rounded-lg text-xs font-medium border flex items-center justify-between ${
            previewData && previewData.changed_cells_count > 0
              ? "bg-amber-950/40 border-amber-500/40 text-amber-300"
              : "bg-slate-950 border-slate-800 text-slate-300"
          }`}>
            <span>{previewMessage}</span>
            {viewMode === "preview" && previewData && (
              <span className="text-[11px] text-amber-400/80">
                DRY-RUN Comparison Mode (Raw data unchanged)
              </span>
            )}
          </div>
        )}

        {appliedMessage && (
          <div className="p-3 rounded-lg text-xs font-medium bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{appliedMessage}</span>
          </div>
        )}

        {/* Table Content */}
        <div className="overflow-x-auto border border-slate-800 rounded-lg max-h-96 relative">
          {loadingSample && !sampleData && (
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[1px] flex items-center justify-center z-20 text-xs text-indigo-400 gap-2 font-medium">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Loading dataset sample...
            </div>
          )}
          <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950 sticky top-0 border-b border-slate-800 text-slate-300 font-semibold z-10">
                <tr>
                  <th className="p-2.5 border-r border-slate-800 w-12 text-slate-500 text-center font-mono">#</th>
                  {(viewMode === "preview" && previewData ? previewData.columns_after : (sampleData?.columns || profileData.columns)).map((col) => (
                    <th key={col.name} className="p-2.5 border-r border-slate-800 min-w-[160px] relative group">
                      <div className="flex items-center justify-between gap-1">
                        <div>
                          <span className="font-semibold text-slate-200 block">{col.name}</span>
                          <span className="text-[10px] font-mono text-indigo-400 block uppercase">
                            {col.physical_type}
                          </span>
                        </div>

                        {/* Interactive Header Dropdown */}
                        <div className="relative">
                          <button
                            onClick={() =>
                              setActiveTypeDropdown(
                                activeTypeDropdown === col.name ? null : col.name
                              )
                            }
                            className="p-1 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded transition-colors"
                            title={`Change column ${col.name} type`}
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>

                          {activeTypeDropdown === col.name && (
                            <div className="absolute right-0 top-full mt-1 w-44 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 p-2 space-y-1 text-xs">
                              <div className="text-[10px] text-slate-400 font-medium pb-1 border-b border-slate-800">
                                Column: <span className="text-slate-200 font-bold">{col.name}</span>
                              </div>
                              <div className="text-[10px] text-slate-500">
                                Current type: <span className="font-mono text-indigo-400">{col.physical_type}</span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-medium pt-1">Change type to:</div>
                              <div className="max-h-40 overflow-y-auto space-y-0.5 pt-1">
                                {SUPPORTED_HEADER_TYPES.map((t) => (
                                  <button
                                    key={t}
                                    onClick={() => addHeaderTypeChange(col.name, t)}
                                    className="w-full text-left px-2 py-1 hover:bg-indigo-600 hover:text-white rounded text-slate-300 text-xs font-mono transition-colors"
                                  >
                                    {t}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300 bg-slate-900/40">
                {viewMode === "preview" && previewData ? (
                  previewData.rows_after.map((rowAfter, rIdx) => {
                    const rowBefore = previewData.rows_before[rIdx] || {};
                    return (
                      <tr key={rIdx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-2 border-r border-slate-800 text-slate-500 text-center text-[11px] font-mono">
                          {rIdx + 1}
                        </td>
                        {previewData.columns_after.map((col) => {
                          const beforeVal = rowBefore[col.name];
                          const afterVal = rowAfter[col.name];

                          const cellDiff = previewData.cell_changes.find(
                            (c) => c.row_index === rIdx && c.column === col.name
                          );

                          const isChanged = Boolean(cellDiff) || String(beforeVal ?? "NULL") !== String(afterVal ?? "NULL");

                          return (
                            <td
                              key={col.name}
                              className={`p-2 border-r border-slate-800 text-xs whitespace-nowrap ${
                                isChanged
                                  ? "bg-amber-950/60 border border-amber-500/50 font-bold"
                                  : ""
                              }`}
                            >
                              {isChanged ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="line-through text-rose-400/80 text-[11px] bg-rose-950/40 px-1 py-0.5 rounded">
                                    {beforeVal === null || beforeVal === undefined ? "NULL" : String(beforeVal)}
                                  </span>
                                  <ArrowRight className="w-3 h-3 text-amber-400 shrink-0" />
                                  <span className="text-emerald-400 font-bold bg-emerald-950/40 px-1 py-0.5 rounded">
                                    {afterVal === null || afterVal === undefined ? "NULL" : String(afterVal)}
                                  </span>
                                </div>
                              ) : (
                                <span className={afterVal === null || afterVal === undefined ? "text-slate-500 italic" : "text-slate-200"}>
                                  {afterVal === null || afterVal === undefined ? "NULL" : String(afterVal)}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                ) : (
                  (sampleData?.rows || []).map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-2 border-r border-slate-800 text-slate-500 text-center text-[11px] font-mono">
                        {rIdx + 1}
                      </td>
                      {(sampleData?.columns || profileData.columns).map((col) => {
                        const val = row[col.name];
                        return (
                          <td key={col.name} className="p-2 border-r border-slate-800 text-xs whitespace-nowrap text-slate-200">
                            {val === null || val === undefined ? (
                              <span className="text-slate-500 italic">NULL</span>
                            ) : (
                              String(val)
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
      </div>
    </div>
  );
}
