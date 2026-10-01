"use client";

import { useState, useEffect } from "react";
import {
  DashboardItemResponse,
  AnalyticsQueryResponse,
  VisualizationSpec,
  FilterSpec,
  executeAnalyticsQuery,
} from "@/lib/api-client";
import { VisualizationChart } from "@/components/visualization-chart";
import { Trash2, Move, Filter, Sparkles, Lightbulb } from "lucide-react";
import { explainAIVisual, fetchAIInsights, AIExplainResponse, AIInsight } from "@/lib/ai-api";

interface DashboardItemWidgetProps {
  item: DashboardItemResponse;
  activeFilters: Record<string, any>;
  isEditing: boolean;
  isSelected?: boolean;
  onSelectWidget?: (widgetId: string) => void;
  onRemoveItem?: (itemId: string) => void;
  onCrossFilterSelect?: (field: string, value: any) => void;
  onDropField?: (widgetId: string, fieldName: string) => void;
}

export function DashboardItemWidget({
  item,
  activeFilters,
  isEditing,
  isSelected,
  onSelectWidget,
  onRemoveItem,
  onCrossFilterSelect,
  onDropField,
}: DashboardItemWidgetProps) {
  const [queryResponse, setQueryResponse] = useState<AnalyticsQueryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [explainResult, setExplainResult] = useState<AIExplainResponse | null>(null);
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);

  const [insightsResult, setInsightsResult] = useState<AIInsight[] | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  const spec = item.visualization_spec as VisualizationSpec;

  const handleExplain = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.dataset_id) return;
    setInsightsResult(null);
    setExplainLoading(true);
    setExplainError(null);
    try {
      const res = await explainAIVisual({
        visual_spec: spec,
        dataset_id: item.dataset_id,
      });
      setExplainResult(res);
    } catch (err: any) {
      setExplainError(err.message || "Failed to explain visual.");
    } finally {
      setExplainLoading(false);
    }
  };

  const handleInsights = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.dataset_id) return;
    setExplainResult(null);
    setInsightsLoading(true);
    setInsightsError(null);
    try {
      const res = await fetchAIInsights({
        dataset_id: item.dataset_id,
        visual_spec: spec,
      });
      setInsightsResult(res.insights || []);
    } catch (err: any) {
      setInsightsError(err.message || "Failed to fetch AI insights.");
    } finally {
      setInsightsLoading(false);
    }
  };

  useEffect(() => {
    runWidgetQuery();
  }, [item.id, item.dataset_id, JSON.stringify(item.visualization_spec), JSON.stringify(activeFilters)]);

  const runWidgetQuery = async () => {
    if (!item.dataset_id) return;

    try {
      setIsLoading(true);
      setError(null);

      // Build filters array combining active global dashboard filters
      const filterSpecs: FilterSpec[] = [];
      Object.entries(activeFilters).forEach(([field, val]) => {
        if (val !== undefined && val !== null && val !== "") {
          filterSpecs.push({
            field,
            operator: "eq",
            value: val,
          });
        }
      });

      const queryMeasures =
        spec.measures && spec.measures.length > 0
          ? spec.measures
          : spec.kpi_measure
          ? [{ field: spec.kpi_measure.field, aggregation: spec.kpi_measure.aggregation as any }]
          : [];

      const res = await executeAnalyticsQuery({
        dataset_id: item.dataset_id,
        dimensions: spec.dimensions || [],
        measures: queryMeasures,
        filters: filterSpecs,
        sort: spec.sort,
        limit: spec.limit || 50,
      });

      setQueryResponse(res);
    } catch (err: any) {
      setError(err.message || "Failed to execute query for widget");
      setQueryResponse(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      onClick={() => onSelectWidget && onSelectWidget(item.id)}
      onDragOver={(e) => {
        if (isEditing) e.preventDefault();
      }}
      onDrop={(e) => {
        if (!isEditing || !onDropField) return;
        e.preventDefault();
        e.stopPropagation();
        const raw = e.dataTransfer.getData("application/json");
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed.fieldName) {
              onDropField(item.id, parsed.fieldName);
            }
          } catch (err) {}
        }
      }}
      className={`bg-slate-900/90 border rounded-xl p-4 flex flex-col justify-between space-y-3 relative group transition-all cursor-pointer shadow-lg ${
        isSelected
          ? "ring-2 ring-indigo-500 border-indigo-500 shadow-indigo-500/20"
          : "border-slate-800 hover:border-slate-700"
      }`}
      data-testid="dashboard-widget-card"
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2 truncate">
          {isEditing && <Move className="w-4 h-4 text-slate-500 cursor-move shrink-0" />}
          <span className="font-bold text-xs text-slate-200 truncate">
            {item.title || spec.title || "Untitled Visualization"}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {Object.keys(activeFilters).length > 0 && (
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded flex items-center gap-1">
              <Filter className="w-3 h-3" />
              Filtered
            </span>
          )}
          {item.dataset_id && (
            <div className="flex items-center gap-1">
              <button
                onClick={handleExplain}
                disabled={explainLoading || insightsLoading}
                className="p-1 text-slate-400 hover:text-cyan-400 disabled:opacity-50 rounded transition-colors flex items-center gap-1 text-[10px]"
                title="Explain this visual using AI Analyst"
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                {explainLoading ? "Explaining..." : "Explain"}
              </button>
              <button
                onClick={handleInsights}
                disabled={explainLoading || insightsLoading}
                className="p-1 text-slate-400 hover:text-amber-400 disabled:opacity-50 rounded transition-colors flex items-center gap-1 text-[10px]"
                title="Generate AI Insights for this visual"
              >
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                {insightsLoading ? "Analyzing..." : "Insights"}
              </button>
            </div>
          )}
          {isEditing && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onRemoveItem) onRemoveItem(item.id);
              }}
              className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
              title="Remove widget from dashboard"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Render Chart */}
      <VisualizationChart
        spec={spec}
        queryResponse={queryResponse}
        isLoading={isLoading}
        error={error}
      />

      {/* Explain Visual Result Overlay */}
      {explainError && (
        <div className="p-2 bg-rose-950/60 border border-rose-500/40 rounded text-rose-300 text-xs flex items-center justify-between">
          <span>{explainError}</span>
          <button onClick={() => setExplainError(null)} className="text-slate-400 hover:text-slate-200">×</button>
        </div>
      )}

      {explainResult && (
        <div className="bg-slate-950/95 border border-cyan-500/40 rounded-lg p-3 space-y-2 text-xs shadow-xl relative z-10">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              {explainResult.title}
            </span>
            <button
              onClick={() => setExplainResult(null)}
              className="text-slate-400 hover:text-slate-200 text-xs px-1.5 py-0.5 rounded bg-slate-800"
              aria-label="Dismiss Explanation"
            >
              Dismiss
            </button>
          </div>
          <p className="text-slate-300 leading-normal">
            {explainResult.summary || explainResult.what_visual_shows}
          </p>
          {((explainResult.observations && explainResult.observations.length > 0) ||
            (explainResult.observed_patterns && explainResult.observed_patterns.length > 0)) && (
            <ul className="list-disc list-inside text-slate-300 space-y-0.5 pt-1 border-t border-slate-900">
              {(explainResult.observations || explainResult.observed_patterns || []).slice(0, 5).map((obs, idx) => (
                <li key={idx}>{obs}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* AI Insights Overlay */}
      {insightsError && (
        <div className="p-2 bg-rose-950/60 border border-rose-500/40 rounded text-rose-300 text-xs flex items-center justify-between">
          <span>{insightsError}</span>
          <button onClick={() => setInsightsError(null)} className="text-slate-400 hover:text-slate-200">×</button>
        </div>
      )}

      {insightsResult && (
        <div className="bg-slate-950/95 border border-amber-500/40 rounded-lg p-3 space-y-2 text-xs shadow-xl relative z-10">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
              AI Insights
            </span>
            <button
              onClick={() => setInsightsResult(null)}
              className="text-slate-400 hover:text-slate-200 text-xs px-1.5 py-0.5 rounded bg-slate-800"
              aria-label="Dismiss Insights"
            >
              Dismiss
            </button>
          </div>
          {insightsResult.length === 0 ? (
            <p className="text-slate-400 italic">No notable insights found for this visual.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {insightsResult.map((ins, idx) => (
                <div key={idx} className="bg-slate-900/80 p-2 rounded border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200 text-xs">{ins.title}</span>
                    <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded uppercase font-bold">
                      {ins.type.replace("_", " ")}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-snug">{ins.description || ins.summary}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
