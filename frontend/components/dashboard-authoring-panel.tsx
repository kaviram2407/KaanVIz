"use client";

import React, { useState } from "react";
import {
  BarChart3,
  LineChart,
  AreaChart as AreaIcon,
  PieChart as PieIcon,
  ScatterChart,
  Table as TableIcon,
  Hash,
  Layers,
  Database,
  Sliders,
  ChevronRight,
  ChevronDown,
  Trash2,
  X,
  Sparkles,
  GripVertical,
  AlignLeft,
  Calendar,
  ToggleLeft,
} from "lucide-react";
import {
  DatasetItem,
  DatasetProfileResponse,
  DashboardItemResponse,
  VisualizationSpec,
} from "@/lib/api-client";

interface DashboardAuthoringPanelProps {
  isOpen: boolean;
  onTogglePanel: () => void;
  selectedWidget: DashboardItemResponse | null;
  datasets: DatasetItem[];
  selectedDatasetId: string;
  onSelectDatasetId: (id: string) => void;
  datasetProfile: DatasetProfileResponse | null;
  onAddVisualType: (chartType: string, fieldName?: string) => void;
  onUpdateWidgetConfig: (
    widgetId: string,
    updates: {
      title?: string;
      chart_type?: string;
      dimension?: string;
      measure?: string;
      aggregation?: string;
      kpiFormat?: string;
      kpiDisplayName?: string;
      dataset_id?: string;
    }
  ) => void;
  onDeleteWidget: (widgetId: string) => void;
}

const VISUAL_TYPES = [
  { id: "bar", name: "Bar Chart", icon: BarChart3, category: "Comparison" },
  { id: "line", name: "Line Chart", icon: LineChart, category: "Trends" },
  { id: "area", name: "Area Chart", icon: AreaIcon, category: "Trends" },
  { id: "pie", name: "Pie Chart", icon: PieIcon, category: "Composition" },
  { id: "donut", name: "Donut Chart", icon: PieIcon, category: "Composition" },
  { id: "scatter", name: "Scatter Plot", icon: ScatterChart, category: "Correlation" },
  { id: "table", name: "Data Table", icon: TableIcon, category: "Details" },
  { id: "kpi", name: "KPI / Card", icon: Hash, category: "Metric" },
];

export function DashboardAuthoringPanel({
  isOpen,
  onTogglePanel,
  selectedWidget,
  datasets,
  selectedDatasetId,
  onSelectDatasetId,
  datasetProfile,
  onAddVisualType,
  onUpdateWidgetConfig,
  onDeleteWidget,
}: DashboardAuthoringPanelProps) {
  const [activeTab, setActiveTab] = useState<"visuals" | "data" | "build">("visuals");
  const [draggedField, setDraggedField] = useState<string | null>(null);

  if (!isOpen) {
    return (
      <button
        onClick={onTogglePanel}
        className="fixed right-4 top-24 z-40 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-l-xl shadow-2xl border border-indigo-400/40 text-xs font-bold flex items-center gap-1.5 transition-all"
        title="Open Power BI-style Authoring Panel"
        data-testid="toggle-authoring-panel-btn"
      >
        <Sliders className="w-4 h-4" />
        Authoring Panel
      </button>
    );
  }

  // Parse selected widget spec
  const spec: VisualizationSpec = (selectedWidget?.visualization_spec as any) || {
    chart_type: "bar",
    dimensions: [],
    measures: [],
  };

  const widgetChartType = spec.chart_type || "bar";
  const widgetDimension = spec.dimensions?.[0]?.field || "";
  const widgetMeasure = spec.measures?.[0]?.field || spec.kpi_measure?.field || "";
  const widgetAggregation =
    spec.measures?.[0]?.aggregation || spec.kpi_measure?.aggregation || "sum";
  const widgetKpiFormat = spec.kpi_measure?.format || "number";
  const widgetKpiDisplayName = spec.kpi_measure?.display_name || "";

  // Categorize columns from profile
  const columns = datasetProfile?.columns || [];
  const numericCols = columns.filter((c) =>
    ["INTEGER", "BIGINT", "FLOAT", "DECIMAL", "NUMBER"].includes(c.physical_type.toUpperCase())
  );
  const textCols = columns.filter((c) =>
    ["VARCHAR", "STRING", "TEXT"].includes(c.physical_type.toUpperCase())
  );
  const dateCols = columns.filter((c) =>
    ["DATE", "DATETIME", "TIMESTAMP"].includes(c.physical_type.toUpperCase())
  );
  const boolCols = columns.filter((c) =>
    ["BOOLEAN", "BOOL"].includes(c.physical_type.toUpperCase())
  );

  return (
    <div
      className="w-80 shrink-0 bg-slate-900 border-l border-slate-800 flex flex-col h-full z-30 transition-all shadow-2xl"
      data-testid="dashboard-authoring-panel"
    >
      {/* Authoring Panel Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-950 border border-indigo-500/40 rounded-lg text-indigo-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
              Visual Authoring Studio
            </h3>
            <span className="text-[10px] text-slate-400">Power BI-Style Workbench</span>
          </div>
        </div>
        <button
          onClick={onTogglePanel}
          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="grid grid-cols-3 border-b border-slate-800 bg-slate-950/40 text-xs font-medium">
        <button
          onClick={() => setActiveTab("visuals")}
          className={`py-2 text-center border-b-2 transition-colors ${
            activeTab === "visuals"
              ? "border-indigo-500 text-indigo-400 font-bold bg-slate-900"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
          data-testid="tab-visuals"
        >
          Visuals
        </button>
        <button
          onClick={() => setActiveTab("data")}
          className={`py-2 text-center border-b-2 transition-colors ${
            activeTab === "data"
              ? "border-indigo-500 text-indigo-400 font-bold bg-slate-900"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
          data-testid="tab-data"
        >
          Data
        </button>
        <button
          onClick={() => setActiveTab("build")}
          className={`py-2 text-center border-b-2 transition-colors relative ${
            activeTab === "build"
              ? "border-indigo-500 text-indigo-400 font-bold bg-slate-900"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
          data-testid="tab-build"
        >
          Build
          {selectedWidget && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>
      </div>

      {/* Tab Content Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* TAB 1: VISUALS GALLERY */}
        {activeTab === "visuals" && (
          <div className="space-y-4" data-testid="visuals-gallery">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Visual Types Gallery
            </span>

            <div className="grid grid-cols-2 gap-2.5">
              {VISUAL_TYPES.map((vis) => {
                const IconComp = vis.icon;
                return (
                  <div
                    key={vis.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData(
                        "application/json",
                        JSON.stringify({ type: "visual", chartType: vis.id })
                      );
                    }}
                    onClick={() => onAddVisualType(vis.id)}
                    className="p-3 bg-slate-950 hover:bg-indigo-950/60 border border-slate-800 hover:border-indigo-500/50 rounded-xl cursor-pointer group transition-all flex flex-col items-center justify-center text-center gap-1.5 shadow-sm"
                    data-testid={`add-visual-${vis.id}`}
                  >
                    <div className="p-2 bg-slate-900 group-hover:bg-indigo-600/20 text-slate-400 group-hover:text-indigo-400 rounded-lg transition-colors">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <span className="font-semibold text-slate-200 group-hover:text-white text-xs block">
                      {vis.name}
                    </span>
                    <span className="text-[10px] text-slate-500 block">{vis.category}</span>
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-400 space-y-1">
              <span className="font-semibold text-slate-300 block text-xs">Drag & Drop Authoring</span>
              <p className="text-[11px] text-slate-500">
                Drag any visual type directly onto the canvas, or click to append to the active layout.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: DATASET FIELDS TREE */}
        {activeTab === "data" && (
          <div className="space-y-4" data-testid="data-fields-tree">
            {/* Source Dataset Selector */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Active Source Dataset
              </label>
              <select
                value={selectedDatasetId}
                onChange={(e) => onSelectDatasetId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-medium"
                data-testid="panel-dataset-select"
              >
                {datasets.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Categorized Fields Tree */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Available Fields</span>
                <span className="text-slate-500 font-mono">{columns.length} columns</span>
              </div>

              {/* Numeric Fields Section */}
              {numericCols.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    Numeric Measures ({numericCols.length})
                  </span>
                  <div className="space-y-1 pl-1">
                    {numericCols.map((col) => (
                      <div
                        key={col.name}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData(
                            "application/json",
                            JSON.stringify({ type: "field", fieldName: col.name, physicalType: col.physical_type })
                          );
                        }}
                        className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg flex items-center justify-between cursor-grab group transition-colors"
                        data-testid={`field-item-${col.name}`}
                      >
                        <span className="font-mono text-slate-200 group-hover:text-white text-xs truncate">
                          {col.name}
                        </span>
                        <span className="text-[10px] bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                          {col.physical_type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Text Fields Section */}
              {textCols.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-indigo-400 flex items-center gap-1">
                    <AlignLeft className="w-3 h-3" />
                    Text Dimensions ({textCols.length})
                  </span>
                  <div className="space-y-1 pl-1">
                    {textCols.map((col) => (
                      <div
                        key={col.name}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData(
                            "application/json",
                            JSON.stringify({ type: "field", fieldName: col.name, physicalType: col.physical_type })
                          );
                        }}
                        className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg flex items-center justify-between cursor-grab group transition-colors"
                        data-testid={`field-item-${col.name}`}
                      >
                        <span className="font-mono text-slate-200 group-hover:text-white text-xs truncate">
                          {col.name}
                        </span>
                        <span className="text-[10px] bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 px-1.5 py-0.5 rounded font-mono">
                          {col.physical_type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Date Fields Section */}
              {dateCols.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Date / Time ({dateCols.length})
                  </span>
                  <div className="space-y-1 pl-1">
                    {dateCols.map((col) => (
                      <div
                        key={col.name}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData(
                            "application/json",
                            JSON.stringify({ type: "field", fieldName: col.name, physicalType: col.physical_type })
                          );
                        }}
                        className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg flex items-center justify-between cursor-grab group transition-colors"
                        data-testid={`field-item-${col.name}`}
                      >
                        <span className="font-mono text-slate-200 group-hover:text-white text-xs truncate">
                          {col.name}
                        </span>
                        <span className="text-[10px] bg-amber-950/80 border border-amber-500/40 text-amber-300 px-1.5 py-0.5 rounded font-mono">
                          {col.physical_type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Boolean Fields Section */}
              {boolCols.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-rose-400 flex items-center gap-1">
                    <ToggleLeft className="w-3 h-3" />
                    Boolean ({boolCols.length})
                  </span>
                  <div className="space-y-1 pl-1">
                    {boolCols.map((col) => (
                      <div
                        key={col.name}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData(
                            "application/json",
                            JSON.stringify({ type: "field", fieldName: col.name, physicalType: col.physical_type })
                          );
                        }}
                        className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg flex items-center justify-between cursor-grab group transition-colors"
                        data-testid={`field-item-${col.name}`}
                      >
                        <span className="font-mono text-slate-200 group-hover:text-white text-xs truncate">
                          {col.name}
                        </span>
                        <span className="text-[10px] bg-rose-950/80 border border-rose-500/40 text-rose-300 px-1.5 py-0.5 rounded font-mono">
                          {col.physical_type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: VISUAL & SIMPLE MEASURE BUILDER */}
        {activeTab === "build" && (
          <div className="space-y-4" data-testid="visual-build-config">
            {!selectedWidget ? (
              <div className="py-12 text-center text-slate-500 space-y-2">
                <Sliders className="w-8 h-8 text-slate-600 mx-auto" />
                <span className="font-semibold text-slate-300 block">No Visual Selected</span>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  Click any widget on the dashboard canvas to inspect, bind fields, configure measures, and format parameters.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-bold text-slate-200 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      Configure Visual
                    </span>
                    <button
                      onClick={() => onDeleteWidget(selectedWidget.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded"
                      title="Delete widget"
                      data-testid="delete-widget-panel-btn"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Widget Title */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Visual Title
                    </label>
                    <input
                      type="text"
                      value={selectedWidget.title || ""}
                      onChange={(e) =>
                        onUpdateWidgetConfig(selectedWidget.id, { title: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                      data-testid="config-title-input"
                    />
                  </div>

                  {/* Chart Type Selector */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Chart Type
                    </label>
                    <select
                      value={widgetChartType}
                      onChange={(e) =>
                        onUpdateWidgetConfig(selectedWidget.id, { chart_type: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                      data-testid="config-chart-type-select"
                    >
                      {VISUAL_TYPES.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Field Bindings & Dropzones */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block border-b border-slate-800 pb-1">
                    Field Bindings & Dropzones
                  </span>

                  {/* Dimension Dropzone (X Axis / Grouping) */}
                  {widgetChartType !== "kpi" && (
                    <div>
                      <label className="text-[10px] font-semibold text-slate-300 block mb-1">
                        X Axis / Dimension (Grouping)
                      </label>
                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const raw = e.dataTransfer.getData("application/json");
                          if (raw) {
                            try {
                              const parsed = JSON.parse(raw);
                              if (parsed.fieldName) {
                                onUpdateWidgetConfig(selectedWidget.id, { dimension: parsed.fieldName });
                              }
                            } catch (err) {}
                          }
                        }}
                        className="p-2 border border-dashed border-slate-700 bg-slate-900/60 rounded-lg flex items-center justify-between"
                      >
                        <select
                          value={widgetDimension}
                          onChange={(e) =>
                            onUpdateWidgetConfig(selectedWidget.id, { dimension: e.target.value })
                          }
                          className="bg-transparent text-slate-200 w-full focus:outline-none"
                          data-testid="config-dimension-select"
                        >
                          <option value="">-- Drop or Select Dimension --</option>
                          {columns.map((c) => (
                            <option key={c.name} value={c.name}>
                              {c.name} ({c.physical_type})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Measure Dropzone (Y Value / Aggregation) */}
                  <div>
                    <label className="text-[10px] font-semibold text-slate-300 block mb-1">
                      {widgetChartType === "kpi" ? "KPI Target Field" : "Y Axis / Measure"}
                    </label>
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const raw = e.dataTransfer.getData("application/json");
                        if (raw) {
                          try {
                            const parsed = JSON.parse(raw);
                            if (parsed.fieldName) {
                              onUpdateWidgetConfig(selectedWidget.id, { measure: parsed.fieldName });
                            }
                          } catch (err) {}
                        }
                      }}
                      className="p-2 border border-dashed border-slate-700 bg-slate-900/60 rounded-lg flex items-center justify-between mb-2"
                    >
                      <select
                        value={widgetMeasure}
                        onChange={(e) =>
                          onUpdateWidgetConfig(selectedWidget.id, { measure: e.target.value })
                        }
                        className="bg-transparent text-slate-200 w-full focus:outline-none"
                        data-testid="config-measure-select"
                      >
                        <option value="">-- Drop or Select Measure --</option>
                        {columns.map((c) => (
                          <option key={c.name} value={c.name}>
                            {c.name} ({c.physical_type})
                          </option>
                        ))}
                      </select>
                    </div>

                    <label className="text-[10px] font-semibold text-slate-300 block mb-1">
                      Aggregation Function
                    </label>
                    <select
                      value={widgetAggregation}
                      onChange={(e) =>
                        onUpdateWidgetConfig(selectedWidget.id, { aggregation: e.target.value })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                      data-testid="config-aggregation-select"
                    >
                      <option value="sum">SUM</option>
                      <option value="avg">AVERAGE</option>
                      <option value="count">COUNT</option>
                      <option value="distinct_count">DISTINCT COUNT</option>
                      <option value="min">MINIMUM</option>
                      <option value="max">MAXIMUM</option>
                    </select>
                  </div>
                </div>

                {/* KPI Simple Measure Specific Formatting */}
                {widgetChartType === "kpi" && (
                  <div className="p-3 bg-slate-950 border border-indigo-500/30 rounded-xl space-y-3">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block border-b border-slate-800 pb-1 flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5" />
                      KPI Simple Measure Model
                    </span>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-300 block mb-1">
                        Measure Display Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Total Net Revenue"
                        value={widgetKpiDisplayName}
                        onChange={(e) =>
                          onUpdateWidgetConfig(selectedWidget.id, {
                            kpiDisplayName: e.target.value,
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                        data-testid="config-kpi-name-input"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-300 block mb-1">
                        Number Formatting
                      </label>
                      <select
                        value={widgetKpiFormat}
                        onChange={(e) =>
                          onUpdateWidgetConfig(selectedWidget.id, {
                            kpiFormat: e.target.value,
                          })
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                        data-testid="config-kpi-format-select"
                      >
                        <option value="number">Standard Number (1,234.56)</option>
                        <option value="currency">Currency ($1,234.56)</option>
                        <option value="percentage">Percentage (12.3%)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
