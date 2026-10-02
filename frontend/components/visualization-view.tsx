"use client";

import { useState, useEffect } from "react";
import {
  DatasetItem,
  DatasetProfileResponse,
  AnalyticsQueryResponse,
  VisualizationSpec,
  fetchWorkspaceDatasets,
  fetchDatasetProfile,
  executeAnalyticsQuery,
  validateVisualizationSpec,
} from "@/lib/api-client";
import { VisualizationChart } from "@/components/visualization-chart";
import {
  BarChart3,
  Play,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Sliders,
  Database,
  Table as TableIcon,
  Layers,
  Filter,
  LayoutGrid,
  PieChart,
  LineChart,
  Sparkles,
} from "lucide-react";

export function VisualizationView() {
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");
  const [profileData, setProfileData] = useState<DatasetProfileResponse | null>(null);

  // Chart & Query Config State
  const [chartType, setChartType] = useState<VisualizationSpec["chart_type"]>("bar");
  const [chartTitle, setChartTitle] = useState<string>("");
  const [selectedDimension, setSelectedDimension] = useState<string>("");
  const [selectedMeasure, setSelectedMeasure] = useState<string>("");
  const [selectedAggregation, setSelectedAggregation] = useState<
    "count" | "distinct_count" | "sum" | "avg" | "min" | "max"
  >("sum");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [limit, setLimit] = useState<number>(20);

  // Canvas Filters State
  const [regionFilter, setRegionFilter] = useState<string>("All Regions");
  const [dateRangeFilter, setDateRangeFilter] = useState<string>("Last 30 Days");

  // Query Execution States
  const [isExecuting, setIsExecuting] = useState(false);
  const [loadingDatasets, setLoadingDatasets] = useState(true);
  const [queryResponse, setQueryResponse] = useState<AnalyticsQueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationIssues, setValidationIssues] = useState<string[]>([]);

  useEffect(() => {
    loadDatasets();
  }, []);

  useEffect(() => {
    if (selectedDatasetId) {
      loadProfile(selectedDatasetId);
    }
  }, [selectedDatasetId]);

  const loadDatasets = async () => {
    try {
      setLoadingDatasets(true);
      const items = await fetchWorkspaceDatasets();
      setDatasets(items);
      if (items.length > 0) {
        setSelectedDatasetId(items[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load datasets.");
    } finally {
      setLoadingDatasets(false);
    }
  };

  const loadProfile = async (dsId: string) => {
    try {
      const p = await fetchDatasetProfile(dsId);
      setProfileData(p);
      if (p.columns && p.columns.length > 0) {
        // Find default dimension (text/category/date) & measure (numeric)
        const textCol = p.columns.find((c) => c.physical_type.toUpperCase() === "VARCHAR" || c.physical_type.toUpperCase() === "STRING");
        const numCol = p.columns.find((c) => ["INTEGER", "BIGINT", "FLOAT", "DECIMAL", "NUMBER"].includes(c.physical_type.toUpperCase()));

        setSelectedDimension(textCol ? textCol.name : p.columns[0].name);
        setSelectedMeasure(numCol ? numCol.name : (p.columns[1] ? p.columns[1].name : p.columns[0].name));
      }
    } catch (err: any) {
      console.error("Failed to load dataset profile:", err);
    }
  };

  const currentSpec: VisualizationSpec = {
    chart_type: chartType,
    title: chartTitle || undefined,
    dimensions: selectedDimension ? [{ field: selectedDimension }] : [],
    measures: selectedMeasure ? [{ field: selectedMeasure, aggregation: selectedAggregation }] : [],
    sort: selectedMeasure ? { field: `${selectedAggregation.toUpperCase()}(${selectedMeasure})`, direction: sortDirection } : undefined,
    limit,
  };

  const handleRunQuery = async () => {
    if (!selectedDatasetId) {
      setError("Please select a dataset to visualize.");
      return;
    }

    try {
      setIsExecuting(true);
      setError(null);
      setValidationIssues([]);

      // 1. Client & Server Spec Validation
      const valRes = await validateVisualizationSpec(currentSpec, selectedDatasetId);
      if (!valRes.is_valid) {
        setValidationIssues(valRes.issues);
        setIsExecuting(false);
        return;
      }

      // 2. Execute Analytics Query
      const res = await executeAnalyticsQuery({
        dataset_id: selectedDatasetId,
        dimensions: currentSpec.dimensions,
        measures: currentSpec.measures,
        sort: currentSpec.sort,
        limit: currentSpec.limit,
      });

      setQueryResponse(res);
    } catch (err: any) {
      setError(err.message || "Failed to execute analytics query.");
      setQueryResponse(null);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans bg-[#0F172A] -m-6 p-6 min-h-[calc(100vh-4rem)] text-slate-100" data-testid="visualization-view">
      {/* Modern Studio Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2 text-white">
            <LayoutGrid className="w-5 h-5 text-indigo-400" />
            Visualization & Analytics Studio
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            High-density dashboard builder, visual toolboxes, canvas-level filters, and real-time ECharts aggregation.
          </p>
        </div>

        {/* Dataset Selector */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 px-3 py-1.5 rounded-lg shadow-sm">
          <Database className="w-4 h-4 text-indigo-400" />
          <select
            value={selectedDatasetId}
            onChange={(e) => setSelectedDatasetId(e.target.value)}
            disabled={loadingDatasets || datasets.length === 0}
            className="bg-transparent text-xs text-slate-100 font-semibold focus:outline-none cursor-pointer"
            data-testid="dataset-selector"
          >
            {datasets.map((d) => (
              <option key={d.id} value={d.id} className="bg-slate-900 text-slate-100">
                {d.name} ({d.row_count || 0} rows)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error & Validation Alerts */}
      {error && (
        <div className="p-4 bg-rose-950/60 border border-rose-500/50 text-rose-200 rounded-xl text-xs flex items-start gap-3 shadow-md">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-sm">Analytics Execution Error</span>
            {error}
          </div>
        </div>
      )}

      {validationIssues.length > 0 && (
        <div className="p-4 bg-amber-950/60 border border-amber-500/50 text-amber-200 rounded-xl text-xs space-y-1 shadow-md">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            Specification Validation Issue
          </div>
          <ul className="list-disc list-inside text-xs space-y-0.5 pl-1">
            {validationIssues.map((issue, idx) => (
              <li key={idx}>{issue}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 3-Column Studio Layout: Visual Toolbox (Left 20%) | Main Canvas (Center 60%) | Filters Panel (Right 20%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: VISUAL TOOLBOX & Config (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-4 shadow-xl">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              Chart & Analytics Config
            </h3>

            {/* Chart Type Selector Grid */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1.5 uppercase">Chart Type</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: "bar", label: "Bar" },
                  { id: "line", label: "Line" },
                  { id: "area", label: "Area" },
                  { id: "pie", label: "Pie" },
                  { id: "donut", label: "Donut" },
                  { id: "scatter", label: "Scatter" },
                  { id: "table", label: "Table" },
                  { id: "kpi", label: "KPI" },
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setChartType(type.id as any)}
                    className={`py-1.5 px-1 text-[11px] font-bold rounded transition-all ${
                      chartType === type.id
                        ? "bg-indigo-600 text-white shadow-md scale-[1.02]"
                        : "bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Title */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Widget Title</label>
              <input
                type="text"
                value={chartTitle}
                onChange={(e) => setChartTitle(e.target.value)}
                placeholder="e.g. Monthly Revenue Trend"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Dimension Selection */}
            {chartType !== "kpi" && (
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">
                  Dimension (Grouping Axis)
                </label>
                <select
                  value={selectedDimension}
                  onChange={(e) => setSelectedDimension(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">-- Select Dimension --</option>
                  {(profileData?.columns || []).map((col) => (
                    <option key={col.name} value={col.name}>
                      {col.name} ({col.physical_type})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Measure & Aggregation Selection */}
            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Measure Column</label>
              <select
                value={selectedMeasure}
                onChange={(e) => setSelectedMeasure(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 mb-2"
              >
                <option value="">-- Select Measure --</option>
                {(profileData?.columns || []).map((col) => (
                  <option key={col.name} value={col.name}>
                    {col.name} ({col.physical_type})
                  </option>
                ))}
              </select>

              <label className="text-xs font-semibold text-slate-400 block mb-1">Aggregation Function</label>
              <select
                value={selectedAggregation}
                onChange={(e) => setSelectedAggregation(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="sum">SUM (Numeric)</option>
                <option value="avg">AVERAGE (Numeric)</option>
                <option value="count">COUNT (Rows)</option>
                <option value="distinct_count">DISTINCT COUNT</option>
                <option value="min">MINIMUM</option>
                <option value="max">MAXIMUM</option>
              </select>
            </div>

            {/* Sort & Limit */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Sort Order</label>
                <select
                  value={sortDirection}
                  onChange={(e) => setSortDirection(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="desc">Desc (High → Low)</option>
                  <option value="asc">Asc (Low → High)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Limit</label>
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="10">Top 10</option>
                  <option value="20">Top 20</option>
                  <option value="50">Top 50</option>
                  <option value="100">Top 100</option>
                </select>
              </div>
            </div>

            {/* Run Query Action Button */}
            <button
              onClick={handleRunQuery}
              disabled={isExecuting || !selectedDatasetId}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-indigo-600/30"
              data-testid="run-query-btn"
            >
              {isExecuting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Rendering Canvas...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Render Visual Canvas
                </>
              )}
            </button>
          </div>
        </div>

        {/* Center: MODERN ANALYTICAL CANVAS (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Query Execution Status Bar */}
          {queryResponse && (
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-indigo-300 flex items-center justify-between shadow-sm">
              <span className="flex items-center gap-2 font-medium">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Query executed in {queryResponse.execution_time_ms} ms
              </span>
              <span className="font-mono text-slate-400">
                {queryResponse.row_count} rows aggregated
              </span>
            </div>
          )}

          {/* Clean Light Analytical Canvas Card */}
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 text-slate-900 min-h-[460px] flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">
                  {chartTitle || `${selectedAggregation.toUpperCase()} of ${selectedMeasure || "Metrics"} by ${selectedDimension || "Dimension"}`}
                </h3>
                <p className="text-xs text-slate-500">Live ECharts Interactive Analytical Visual</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold rounded-md">
                  {chartType.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Interactive ECharts Surface */}
            <div className="flex-1 min-h-[340px]">
              <VisualizationChart
                spec={currentSpec}
                queryResponse={queryResponse}
                isLoading={isExecuting}
                error={error}
              />
            </div>
          </div>

          {/* Aggregated Results Table */}
          {queryResponse && chartType !== "table" && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <TableIcon className="w-4 h-4 text-indigo-400" />
                  Aggregated Query Result Matrix ({queryResponse.row_count} rows)
                </span>
              </div>

              <div className="overflow-x-auto max-h-52 border border-slate-800 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-950 text-slate-300 font-semibold sticky top-0 border-b border-slate-800">
                    <tr>
                      <th className="p-2 border-r border-slate-800 text-slate-500 font-mono w-10 text-center">#</th>
                      {queryResponse.columns.map((col) => (
                        <th key={col.name} className="p-2 border-r border-slate-800 font-semibold">
                          <span className="text-slate-200 block">{col.name}</span>
                          <span className="text-[10px] text-indigo-400 font-mono uppercase block">
                            {col.aggregation || col.physical_type}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300 bg-slate-900/40">
                    {queryResponse.data.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-2 border-r border-slate-800 text-slate-500 text-center text-[11px]">
                          {rIdx + 1}
                        </td>
                        {queryResponse.columns.map((col) => {
                          const val = row[col.name];
                          return (
                            <td key={col.name} className="p-2 border-r border-slate-800 whitespace-nowrap text-slate-200">
                              {val === null || val === undefined ? (
                                <span className="text-slate-500 italic">NULL</span>
                              ) : typeof val === "number" ? (
                                val.toLocaleString()
                              ) : (
                                String(val)
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right: CANVAS-LEVEL FILTERS PANEL (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-4 shadow-xl">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Filter className="w-4 h-4 text-emerald-400" />
              Canvas-Level Filters
            </h3>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Time Horizon</label>
              <select
                value={dateRangeFilter}
                onChange={(e) => setDateRangeFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
              >
                <option value="All Time">All Time</option>
                <option value="Last 7 Days">Last 7 Days</option>
                <option value="Last 30 Days">Last 30 Days</option>
                <option value="Year to Date">Year to Date</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 block mb-1">Geography / Region</label>
              <select
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
              >
                <option value="All Regions">All Regions</option>
                <option value="North America">North America</option>
                <option value="Europe">Europe</option>
                <option value="Asia Pacific">Asia Pacific</option>
                <option value="Latin America">Latin America</option>
              </select>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-lg text-xs text-slate-400 space-y-1">
              <span className="font-semibold text-slate-200 block flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Canvas Interaction
              </span>
              <p className="text-[11px]">
                Filters update all visual widgets on this canvas dynamically without re-uploading raw files.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

