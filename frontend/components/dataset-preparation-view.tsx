"use client";

import { useState, useEffect } from "react";
import {
  ColumnProfileItem,
  DatasetProfileResponse,
  PreparationOperation,
  PreparedMetricsSummary,
  TransformationItem,
  prepareDataset,
  fetchDatasetTransformations,
} from "@/lib/api-client";
import { Wrench, Play, History, CheckCircle, AlertCircle, RefreshCw, Plus, Trash2 } from "lucide-react";

interface DatasetPreparationViewProps {
  profileData: DatasetProfileResponse;
  onPreparationComplete?: () => void;
}

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
  const [error, setError] = useState<string | null>(null);
  const [metricsSummary, setMetricsSummary] = useState<PreparedMetricsSummary | null>(null);

  // Lineage states
  const [transformations, setTransformations] = useState<TransformationItem[]>([]);
  const [loadingLineage, setLoadingLineage] = useState(false);

  useEffect(() => {
    loadLineage();
  }, [profileData.dataset_id]);

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
        profileData.version_id
      );

      setMetricsSummary(res.metrics_comparison);
      setQueuedOperations([]);
      await loadLineage();
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
    <div className="space-y-6" data-testid="preparation-view">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Wrench className="w-5 h-5 text-indigo-500" />
            Data Preparation & Cleaning Workbench
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Build explicit, deterministic cleaning rules to produce a new prepared dataset version.
          </p>
        </div>
      </div>

      {/* Before vs After Comparison (If Applied) */}
      {metricsSummary && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-medium">
            <CheckCircle className="w-5 h-5" />
            Preparation Plan Executed Successfully!
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-xs block">Rows</span>
              <span className="font-semibold text-slate-200">
                {metricsSummary.before_row_count} → {metricsSummary.after_row_count}
              </span>
            </div>
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-xs block">Missing Cells</span>
              <span className="font-semibold text-slate-200">
                {metricsSummary.before_missing_cells} → {metricsSummary.after_missing_cells}
              </span>
            </div>
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-xs block">Quality Score</span>
              <span className="font-semibold text-emerald-400">
                {metricsSummary.before_quality_score}% → {metricsSummary.after_quality_score}%
              </span>
            </div>
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-xs block">Operations Applied</span>
              <span className="font-semibold text-slate-200">{metricsSummary.operations_applied}</span>
            </div>
          </div>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="p-4 bg-rose-950/50 border border-rose-500/50 text-rose-300 rounded-xl text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">Preparation Error</span>
            {error}
          </div>
        </div>
      )}

      {/* Workbench Layout: Controls (Left) vs Plan & Lineage (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Operation Tabs */}
          <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
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
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-800/80 text-slate-300 hover:bg-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Operation Configuration Form */}
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4">
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
                  {profileData.columns.map((col) => (
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
                No operations queued. Add operations from the controls on the left.
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

            <button
              onClick={handleApplyPreparation}
              disabled={queuedOperations.length === 0 || isExecuting}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              {isExecuting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Executing Plan...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Apply Preparation Plan
                </>
              )}
            </button>
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
    </div>
  );
}
