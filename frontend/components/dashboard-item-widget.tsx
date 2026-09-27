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
import { Trash2, Move, Filter } from "lucide-react";

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

  const spec = item.visualization_spec as VisualizationSpec;

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
    </div>
  );
}
