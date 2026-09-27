"use client";

import { useState, useEffect } from "react";
import {
  DashboardItemSummaryResponse,
  DashboardDetailsResponse,
  DashboardItemResponse,
  DatasetItem,
  DatasetProfileResponse,
  VisualizationSpec,
  SimpleMeasure,
  fetchWorkspaceDashboards,
  fetchDashboardDetails,
  createDashboard,
  updateDashboard,
  deleteDashboard,
  addDashboardItem,
  deleteDashboardItem,
  fetchWorkspaceDatasets,
  fetchDatasetProfile,
} from "@/lib/api-client";
import { DashboardItemWidget } from "@/components/dashboard-item-widget";
import { DashboardAuthoringPanel } from "@/components/dashboard-authoring-panel";
import {
  LayoutDashboard,
  Plus,
  Trash2,
  Save,
  Edit3,
  Eye,
  Filter,
  X,
  AlertCircle,
  RefreshCw,
  Sliders,
  CheckCircle,
  Bot,
} from "lucide-react";
import { AIAnalystPanel } from "@/components/ai-analyst-panel";
import { AIVisualizationSuggestion } from "@/lib/ai-api";


export function DashboardBuilderView() {
  const [dashboards, setDashboards] = useState<DashboardItemSummaryResponse[]>([]);
  const [selectedDashboardId, setSelectedDashboardId] = useState<string>("");
  const [currentDashboard, setCurrentDashboard] = useState<DashboardDetailsResponse | null>(null);

  // Layout & Mode States
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});
  const [filterFieldInput, setFilterFieldInput] = useState<string>("");
  const [filterValueInput, setFilterValueInput] = useState<string>("");

  // Datasets & Side Panel States
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Power BI-Style Side Panel & Canvas Selection
  const [isAuthoringPanelOpen, setIsAuthoringPanelOpen] = useState<boolean>(true);
  const [showAiPanel, setShowAiPanel] = useState<boolean>(false);
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(null);
  const [panelDatasetId, setPanelDatasetId] = useState<string>("");
  const [panelDatasetProfile, setPanelDatasetProfile] = useState<DatasetProfileResponse | null>(null);

  const handleApproveAiVisual = async (suggestion: AIVisualizationSuggestion) => {
    if (!currentDashboard) return;
    const targetDsId = panelDatasetId || (datasets.length > 0 ? datasets[0].id : null);
    if (!targetDsId) return;

    try {
      setIsSaving(true);
      setError(null);
      const itemCount = currentDashboard.items.length;
      const newItem = await addDashboardItem(currentDashboard.id, {
        title: suggestion.title || "AI Generated Visual",
        visualization_spec: {
          chart_type: suggestion.chart_type,
          title: suggestion.title,
          dimensions: suggestion.dimensions,
          measures: suggestion.measures,
          kpi_measure: suggestion.kpi_measure,
        } as any,
        dataset_id: targetDsId,
        layout: { x: (itemCount % 2) * 6, y: Math.floor(itemCount / 2) * 4, w: 6, h: 4 },
      });
      setSuccessMsg("AI Suggestion approved and added to dashboard!");
      setSelectedWidgetId(newItem.id);
      await loadDashboard(currentDashboard.id);
    } catch (err: any) {
      setError(err.message || "Failed to add AI suggestion to dashboard");
    } finally {
      setIsSaving(false);
    }
  };


  // Modals
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newDashName, setNewDashName] = useState<string>("");

  const [showAddWidgetModal, setShowAddWidgetModal] = useState<boolean>(false);
  const [widgetTitle, setWidgetTitle] = useState<string>("");
  const [widgetDatasetId, setWidgetDatasetId] = useState<string>("");
  const [widgetProfile, setWidgetProfile] = useState<DatasetProfileResponse | null>(null);
  const [widgetChartType, setWidgetChartType] = useState<VisualizationSpec["chart_type"]>("bar");
  const [widgetDimension, setWidgetDimension] = useState<string>("");
  const [widgetMeasure, setWidgetMeasure] = useState<string>("");
  const [widgetAggregation, setWidgetAggregation] = useState<
    "sum" | "avg" | "count" | "distinct_count" | "min" | "max"
  >("sum");

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedDashboardId) {
      loadDashboard(selectedDashboardId);
    }
  }, [selectedDashboardId]);

  useEffect(() => {
    if (panelDatasetId) {
      fetchDatasetProfile(panelDatasetId).then((p) => {
        setPanelDatasetProfile(p);
      });
    }
  }, [panelDatasetId]);

  useEffect(() => {
    if (widgetDatasetId) {
      fetchDatasetProfile(widgetDatasetId).then((p) => {
        setWidgetProfile(p);
        if (p.columns && p.columns.length > 0) {
          const textCol = p.columns.find(
            (c) =>
              c.physical_type.toUpperCase() === "VARCHAR" ||
              c.physical_type.toUpperCase() === "STRING"
          );
          const numCol = p.columns.find((c) =>
            ["INTEGER", "BIGINT", "FLOAT", "DECIMAL", "NUMBER"].includes(
              c.physical_type.toUpperCase()
            )
          );
          setWidgetDimension(textCol ? textCol.name : p.columns[0].name);
          setWidgetMeasure(
            numCol ? numCol.name : p.columns[1] ? p.columns[1].name : p.columns[0].name
          );
        }
      });
    }
  }, [widgetDatasetId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [dashRes, dsRes] = await Promise.all([
        fetchWorkspaceDashboards(),
        fetchWorkspaceDatasets(),
      ]);
      setDashboards(dashRes.items || []);
      setDatasets(dsRes || []);

      if (dsRes.length > 0) {
        setWidgetDatasetId(dsRes[0].id);
        setPanelDatasetId(dsRes[0].id);
      }

      if (dashRes.items && dashRes.items.length > 0) {
        setSelectedDashboardId(dashRes.items[0].id);
      } else {
        const defaultDash = await createDashboard({
          name: "Executive Summary Dashboard",
          description: "Default analytics dashboard",
        });
        setDashboards([
          {
            id: defaultDash.id,
            workspace_id: defaultDash.workspace_id,
            name: defaultDash.name,
            description: defaultDash.description,
            status: defaultDash.status,
            items_count: 0,
            created_at: defaultDash.created_at,
            updated_at: defaultDash.updated_at,
          },
        ]);
        setSelectedDashboardId(defaultDash.id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard studio");
    } finally {
      setLoading(false);
    }
  };

  const loadDashboard = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const details = await fetchDashboardDetails(id);
      setCurrentDashboard(details);
      setActiveFilters(details.filters || {});

      if (details.items.length > 0 && !selectedWidgetId) {
        setSelectedWidgetId(details.items[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard details");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDashboard = async () => {
    if (!newDashName.trim()) return;

    try {
      setIsSaving(true);
      setError(null);
      const created = await createDashboard({ name: newDashName.trim() });
      setShowCreateModal(false);
      setNewDashName("");
      setSuccessMsg(`Dashboard '${created.name}' created successfully.`);

      const updatedList = await fetchWorkspaceDashboards();
      setDashboards(updatedList.items || []);
      setSelectedDashboardId(created.id);
    } catch (err: any) {
      setError(err.message || "Failed to create dashboard");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDashboard = async () => {
    if (!currentDashboard) return;
    if (
      !confirm(
        `Are you sure you want to delete dashboard '${currentDashboard.name}'? Raw datasets will NOT be deleted.`
      )
    )
      return;

    try {
      setIsSaving(true);
      await deleteDashboard(currentDashboard.id);
      setSuccessMsg(`Dashboard '${currentDashboard.name}' deleted.`);

      const updatedList = await fetchWorkspaceDashboards();
      setDashboards(updatedList.items || []);
      if (updatedList.items && updatedList.items.length > 0) {
        setSelectedDashboardId(updatedList.items[0].id);
      } else {
        setCurrentDashboard(null);
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete dashboard");
    } finally {
      setIsSaving(false);
    }
  };

  // Add Visual Widget from Side Panel
  const handleAddVisualTypeFromPanel = async (chartType: string) => {
    if (!currentDashboard) return;

    const targetDatasetId = panelDatasetId || (datasets.length > 0 ? datasets[0].id : "");
    if (!targetDatasetId) {
      setError("Please select a dataset to bind the visual.");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      let profile = panelDatasetProfile;
      if (!profile || profile.dataset_id !== targetDatasetId) {
        profile = await fetchDatasetProfile(targetDatasetId);
        setPanelDatasetProfile(profile);
      }
      const cols = profile?.columns || [];

      const textCol = cols.find(
        (c) =>
          c.physical_type.toUpperCase() === "VARCHAR" ||
          c.physical_type.toUpperCase() === "STRING"
      );
      const numCol = cols.find((c) =>
        ["INTEGER", "BIGINT", "FLOAT", "DECIMAL", "NUMBER"].includes(
          c.physical_type.toUpperCase()
        )
      );

      const dimField = textCol ? textCol.name : cols[0] ? cols[0].name : "category";
      const measField = numCol ? numCol.name : cols[1] ? cols[1].name : cols[0] ? cols[0].name : "revenue";

      let spec: VisualizationSpec;
      let title = "";

      if (chartType === "kpi") {
        const kpiMeasure: SimpleMeasure = {
          field: measField,
          aggregation: "sum",
          display_name: `Total ${measField.replace("_", " ").toUpperCase()}`,
          format: numCol?.physical_type.toUpperCase() === "DECIMAL" ? "currency" : "number",
        };
        spec = {
          chart_type: "kpi",
          title: `Total ${measField}`,
          kpi_measure: kpiMeasure,
        };
        title = `KPI: Total ${measField}`;
      } else {
        spec = {
          chart_type: chartType,
          title: `${chartType.toUpperCase()} Chart (${measField} by ${dimField})`,
          dimensions: chartType !== "kpi" ? [{ field: dimField }] : [],
          measures: [{ field: measField, aggregation: "sum" }],
        };
        title = `${chartType.toUpperCase()}: ${measField} by ${dimField}`;
      }

      const itemCount = currentDashboard.items.length;
      const newItem = await addDashboardItem(currentDashboard.id, {
        title,
        visualization_spec: spec,
        dataset_id: targetDatasetId,
        layout: { x: (itemCount % 2) * 6, y: Math.floor(itemCount / 2) * 4, w: 6, h: 4 },
      });

      setSuccessMsg(`Added ${chartType.toUpperCase()} visual to dashboard.`);
      setSelectedWidgetId(newItem.id);
      await loadDashboard(currentDashboard.id);
    } catch (err: any) {
      setError(err.message || "Failed to add visual to dashboard");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddWidgetModalSubmit = async () => {
    const targetDatasetId = widgetDatasetId || (datasets.length > 0 ? datasets[0].id : null);
    if (!currentDashboard || !targetDatasetId) {
      setError("Please select a valid dataset to attach.");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const spec: VisualizationSpec = {
        chart_type: widgetChartType,
        title: widgetTitle || undefined,
        dimensions: widgetDimension ? [{ field: widgetDimension }] : [],
        measures: widgetMeasure ? [{ field: widgetMeasure, aggregation: widgetAggregation }] : [],
      };

      const newItem = await addDashboardItem(currentDashboard.id, {
        title:
          widgetTitle ||
          `${widgetAggregation.toUpperCase()}(${widgetMeasure}) by ${widgetDimension}`,
        visualization_spec: spec,
        dataset_id: targetDatasetId,
        layout: { x: 0, y: 0, w: 6, h: 4 },
      });

      setShowAddWidgetModal(false);
      setWidgetTitle("");
      setSuccessMsg("Visualization widget added to dashboard.");
      setSelectedWidgetId(newItem.id);

      await loadDashboard(currentDashboard.id);
    } catch (err: any) {
      setError(err.message || "Failed to add widget to dashboard");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateWidgetConfig = async (
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
  ) => {
    if (!currentDashboard) return;

    const item = currentDashboard.items.find((i) => i.id === widgetId);
    if (!item) return;

    const existingSpec: VisualizationSpec = (item.visualization_spec as any) || {
      chart_type: "bar",
      dimensions: [],
      measures: [],
    };

    const newChartType = updates.chart_type || existingSpec.chart_type || "bar";
    const newTitle = updates.title !== undefined ? updates.title : item.title;

    let newDim = existingSpec.dimensions?.[0]?.field || "";
    if (updates.dimension !== undefined) newDim = updates.dimension;

    let newMeas = existingSpec.measures?.[0]?.field || existingSpec.kpi_measure?.field || "";
    if (updates.measure !== undefined) newMeas = updates.measure;

    let newAgg =
      updates.aggregation ||
      existingSpec.measures?.[0]?.aggregation ||
      existingSpec.kpi_measure?.aggregation ||
      "sum";

    let updatedSpec: VisualizationSpec = {
      ...existingSpec,
      chart_type: newChartType,
      title: newTitle || undefined,
    };

    if (newChartType === "kpi") {
      const kpiFormat = updates.kpiFormat || existingSpec.kpi_measure?.format || "number";
      const kpiDisplayName =
        updates.kpiDisplayName !== undefined
          ? updates.kpiDisplayName
          : existingSpec.kpi_measure?.display_name || newTitle || newMeas;

      updatedSpec.dimensions = [];
      updatedSpec.measures = [];
      updatedSpec.kpi_measure = {
        field: newMeas || "revenue",
        aggregation: newAgg,
        display_name: kpiDisplayName,
        format: kpiFormat,
      };
    } else {
      updatedSpec.dimensions = newDim ? [{ field: newDim }] : [];
      updatedSpec.measures = newMeas ? [{ field: newMeas, aggregation: newAgg as any }] : [];
      delete (updatedSpec as any).kpi_measure;
    }

    // Update local frontend state cleanly
    const updatedItems = currentDashboard.items.map((it) => {
      if (it.id === widgetId) {
        return {
          ...it,
          title: newTitle,
          visualization_spec: updatedSpec as any,
          dataset_id: updates.dataset_id || it.dataset_id,
        };
      }
      return it;
    });

    setCurrentDashboard({
      ...currentDashboard,
      items: updatedItems,
    });
  };

  const handleDropFieldOnWidget = (widgetId: string, fieldName: string) => {
    if (!currentDashboard) return;
    const item = currentDashboard.items.find((i) => i.id === widgetId);
    if (!item) return;

    const spec: VisualizationSpec = item.visualization_spec as any;
    const profileCols = panelDatasetProfile?.columns || widgetProfile?.columns || [];
    const targetCol = profileCols.find((c) => c.name === fieldName);
    const isNum = targetCol
      ? ["INTEGER", "BIGINT", "FLOAT", "DECIMAL", "NUMBER"].includes(
          targetCol.physical_type.toUpperCase()
        )
      : false;

    if (spec.chart_type === "kpi" || isNum) {
      handleUpdateWidgetConfig(widgetId, { measure: fieldName });
    } else {
      handleUpdateWidgetConfig(widgetId, { dimension: fieldName });
    }
  };

  const handleRemoveWidget = async (itemId: string) => {
    if (!currentDashboard) return;

    try {
      await deleteDashboardItem(currentDashboard.id, itemId);
      setSuccessMsg("Widget removed from dashboard.");
      if (selectedWidgetId === itemId) {
        setSelectedWidgetId(null);
      }
      await loadDashboard(currentDashboard.id);
    } catch (err: any) {
      setError(err.message || "Failed to remove widget");
    }
  };

  const handleSaveDashboardLayout = async () => {
    if (!currentDashboard) return;

    try {
      setIsSaving(true);
      setError(null);
      const itemPayloads = currentDashboard.items.map((it) => ({
        title: it.title,
        visualization_spec: it.visualization_spec as any,
        dataset_id: it.dataset_id,
        layout: (it.layout as any) || { x: 0, y: 0, w: 6, h: 4 },
      }));

      await updateDashboard(currentDashboard.id, {
        filters: activeFilters,
        items: itemPayloads,
      });
      setSuccessMsg("Dashboard layout and filters saved successfully.");
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || "Failed to save dashboard layout");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddFilter = () => {
    if (!filterFieldInput.trim() || !filterValueInput.trim()) return;
    setActiveFilters((prev) => ({
      ...prev,
      [filterFieldInput.trim()]: filterValueInput.trim(),
    }));
    setFilterFieldInput("");
    setFilterValueInput("");
  };

  const handleRemoveFilter = (field: string) => {
    setActiveFilters((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleResetFilters = () => {
    setActiveFilters({});
  };

  const selectedWidget =
    currentDashboard?.items.find((i) => i.id === selectedWidgetId) || null;

  return (
    <div className="flex h-full min-h-[calc(100vh-5rem)]" data-testid="dashboard-builder-view">
      {/* Main Workbench Canvas Area */}
      <div className="flex-1 space-y-6 pr-4 overflow-y-auto">
        {/* Header & Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-100">
              <LayoutDashboard className="w-5 h-5 text-indigo-500" />
              Interactive Dashboard Studio
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Power BI-style authoring workbench: drag, configure, filter, and persist analytics dashboards.
            </p>
          </div>

          {/* Action Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs">
              <Sliders className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedDashboardId}
                onChange={(e) => setSelectedDashboardId(e.target.value)}
                className="bg-transparent text-slate-200 focus:outline-none"
                data-testid="dashboard-selector"
              >
                {dashboards.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.items_count} visuals)
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Dashboard
            </button>

            {/* Mode Switcher */}
            <div className="flex items-center bg-slate-950 p-1 border border-slate-800 rounded-lg text-xs font-medium">
              <button
                onClick={() => setIsEditing(false)}
                data-testid="view-mode-btn"
                className={`flex items-center gap-1 px-3 py-1 rounded-md transition-colors ${
                  !isEditing
                    ? "bg-indigo-600 text-white font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                View Mode
              </button>
              <button
                onClick={() => {
                  setIsEditing(true);
                  setIsAuthoringPanelOpen(true);
                }}
                data-testid="edit-mode-btn"
                className={`flex items-center gap-1 px-3 py-1 rounded-md transition-colors ${
                  isEditing
                    ? "bg-amber-600 text-white font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Mode
              </button>
            </div>

            <button
              onClick={() => setShowAiPanel(!showAiPanel)}
              className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-semibold transition-colors ${
                showAiPanel
                  ? "bg-cyan-600 border-cyan-500 text-white"
                  : "bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-cyan-400" />
              AI Analyst
            </button>


            {isEditing && (
              <>
                <button
                  onClick={() => setShowAddWidgetModal(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Visualization
                </button>

                <button
                  onClick={handleSaveDashboardLayout}
                  disabled={isSaving}
                  className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Layout
                </button>
              </>
            )}

            {currentDashboard && (
              <button
                onClick={handleDeleteDashboard}
                className="p-1.5 text-slate-500 hover:text-rose-400 border border-slate-800 hover:border-rose-500/40 rounded-lg transition-colors"
                title="Delete current dashboard"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="p-4 bg-rose-950/50 border border-rose-500/50 text-rose-300 rounded-xl text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Dashboard Error</span>
              {error}
            </div>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs flex items-center justify-between">
            <span className="flex items-center gap-2 font-medium">
              <CheckCircle className="w-4 h-4" />
              {successMsg}
            </span>
            <button onClick={() => setSuccessMsg(null)} className="p-1 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* AI Analyst Section */}
        {showAiPanel && (
          <div className="mb-4">
            <AIAnalystPanel
              datasetId={panelDatasetId || (datasets.length > 0 ? datasets[0].id : undefined)}
              dashboardId={selectedDashboardId}
              onApproveVisual={handleApproveAiVisual}
            />
          </div>
        )}

        {/* Global Dashboard Filter Bar */}

        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-indigo-400" />
              Global Dashboard Filters & Cross-Filters
            </span>

            {Object.keys(activeFilters).length > 0 && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-rose-400 hover:text-rose-300 font-medium transition-colors"
              >
                Reset All Filters
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {Object.keys(activeFilters).length === 0 ? (
              <span className="text-xs text-slate-500 italic">
                No active filters. Add a filter or click a visualization item to cross-filter dashboard visuals.
              </span>
            ) : (
              Object.entries(activeFilters).map(([field, val]) => (
                <span
                  key={field}
                  className="px-2.5 py-1 bg-indigo-950/80 border border-indigo-500/50 text-indigo-200 rounded-lg text-xs font-mono flex items-center gap-1.5"
                >
                  <span className="font-bold text-slate-200">{field}:</span> {String(val)}
                  <button
                    onClick={() => handleRemoveFilter(field)}
                    className="p-0.5 hover:text-rose-400 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))
            )}
          </div>

          {/* Quick Filter Add Controls */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              placeholder="Field name (e.g. category)"
              value={filterFieldInput}
              onChange={(e) => setFilterFieldInput(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 w-44"
            />
            <input
              type="text"
              placeholder="Filter value (e.g. Electronics)"
              value={filterValueInput}
              onChange={(e) => setFilterValueInput(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 w-48"
            />
            <button
              onClick={handleAddFilter}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
            >
              Apply Filter
            </button>
          </div>
        </div>

        {/* Canvas Area with Drag-and-Drop Dropzone */}
        <div
          onDragOver={(e) => {
            if (isEditing) e.preventDefault();
          }}
          onDrop={(e) => {
            if (!isEditing) return;
            e.preventDefault();
            const raw = e.dataTransfer.getData("application/json");
            if (raw) {
              try {
                const parsed = JSON.parse(raw);
                if (parsed.type === "visual" && parsed.chartType) {
                  handleAddVisualTypeFromPanel(parsed.chartType);
                }
              } catch (err) {}
            }
          }}
          className="min-h-[400px] border border-dashed border-slate-800/80 rounded-2xl p-4 bg-slate-950/20"
        >
          {loading ? (
            <div className="py-16 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
              Loading dashboard items...
            </div>
          ) : !currentDashboard || currentDashboard.items.length === 0 ? (
            <div className="py-16 border border-slate-800/80 bg-slate-900/40 rounded-xl flex flex-col items-center justify-center text-slate-500 gap-3">
              <LayoutDashboard className="w-10 h-10 text-slate-600" />
              <span className="text-sm font-semibold text-slate-300">
                Dashboard '{currentDashboard?.name || "New"}' is empty
              </span>
              <span className="text-xs text-slate-500 text-center max-w-sm">
                Drag a visual type from the side Authoring Panel onto this canvas, or click 'Add Visualization'.
              </span>
              <button
                onClick={() => {
                  setIsEditing(true);
                  setShowAddWidgetModal(true);
                }}
                className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Add First Visualization
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="dashboard-items-grid">
              {currentDashboard.items.map((item) => (
                <DashboardItemWidget
                  key={item.id}
                  item={item}
                  activeFilters={activeFilters}
                  isEditing={isEditing}
                  isSelected={selectedWidgetId === item.id}
                  onSelectWidget={(id) => setSelectedWidgetId(id)}
                  onRemoveItem={handleRemoveWidget}
                  onDropField={handleDropFieldOnWidget}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Side Authoring Panel */}
      {isEditing && (
        <DashboardAuthoringPanel
          isOpen={isAuthoringPanelOpen}
          onTogglePanel={() => setIsAuthoringPanelOpen(!isAuthoringPanelOpen)}
          selectedWidget={selectedWidget}
          datasets={datasets}
          selectedDatasetId={panelDatasetId}
          onSelectDatasetId={(id) => setPanelDatasetId(id)}
          datasetProfile={panelDatasetProfile}
          onAddVisualType={handleAddVisualTypeFromPanel}
          onUpdateWidgetConfig={handleUpdateWidgetConfig}
          onDeleteWidget={handleRemoveWidget}
        />
      )}

      {/* MODAL 1: Create Dashboard */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center justify-between">
              Create New Dashboard
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </h3>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Dashboard Name</label>
              <input
                type="text"
                value={newDashName}
                onChange={(e) => setNewDashName(e.target.value)}
                placeholder="e.g. Q3 Sales & Operations"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDashboard}
                disabled={isSaving || !newDashName.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Add Visualization Widget */}
      {showAddWidgetModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-lg w-full space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center justify-between">
              Add Visualization Widget
              <button onClick={() => setShowAddWidgetModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Widget Title</label>
                <input
                  type="text"
                  value={widgetTitle}
                  onChange={(e) => setWidgetTitle(e.target.value)}
                  placeholder="e.g. Total Revenue by Category"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Source Dataset</label>
                <select
                  value={widgetDatasetId}
                  onChange={(e) => setWidgetDatasetId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                >
                  {datasets.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Chart Type</label>
                <select
                  value={widgetChartType}
                  onChange={(e) => setWidgetChartType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                >
                  <option value="bar">Bar Chart</option>
                  <option value="line">Line Chart</option>
                  <option value="area">Area Chart</option>
                  <option value="pie">Pie Chart</option>
                  <option value="donut">Donut Chart</option>
                  <option value="scatter">Scatter Plot</option>
                  <option value="table">Data Table</option>
                  <option value="kpi">KPI Card</option>
                </select>
              </div>

              {widgetChartType !== "kpi" && (
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">
                    Dimension (Grouping)
                  </label>
                  <select
                    value={widgetDimension}
                    onChange={(e) => setWidgetDimension(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                  >
                    {(widgetProfile?.columns || []).map((col) => (
                      <option key={col.name} value={col.name}>
                        {col.name} ({col.physical_type})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Measure Column</label>
                <select
                  value={widgetMeasure}
                  onChange={(e) => setWidgetMeasure(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 mb-2"
                >
                  {(widgetProfile?.columns || []).map((col) => (
                    <option key={col.name} value={col.name}>
                      {col.name} ({col.physical_type})
                    </option>
                  ))}
                </select>

                <label className="text-xs font-medium text-slate-300 block mb-1">Aggregation</label>
                <select
                  value={widgetAggregation}
                  onChange={(e) => setWidgetAggregation(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
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

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowAddWidgetModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleAddWidgetModalSubmit}
                disabled={isSaving}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
              >
                Add Widget
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
