"use client";

import React, { useEffect, useState } from "react";
import {
  GitFork,
  Database,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  Layers,
  FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  fetchWorkspaceDatasets,
  fetchWorkspaceDataModel,
  bindDatasetToModel,
  validateRelationship,
  createRelationship,
  deleteRelationship,
  fetchDatasetProfile,
  DatasetItem,
  DataModelDetailsResponse,
  ColumnProfileItem,
  RelationshipItem,
} from "@/lib/api-client";

interface DataModelingViewProps {
  workspaceId?: string;
}

export function DataModelingView({ workspaceId = "default" }: DataModelingViewProps) {
  const [model, setModel] = useState<DataModelDetailsResponse | null>(null);
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [datasetColumnsMap, setDatasetColumnsMap] = useState<Record<string, ColumnProfileItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [sourceDatasetId, setSourceDatasetId] = useState<string>("");
  const [sourceField, setSourceField] = useState<string>("");
  const [targetDatasetId, setTargetDatasetId] = useState<string>("");
  const [targetField, setTargetField] = useState<string>("");
  const [cardinality, setCardinality] = useState<"one_to_one" | "one_to_many" | "many_to_one" | "many_to_many">("many_to_one");

  // Validation State
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ is_valid: boolean; issues: string[] } | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [modelData, wsDatasets] = await Promise.all([
        fetchWorkspaceDataModel(workspaceId),
        fetchWorkspaceDatasets(workspaceId),
      ]);
      setModel(modelData);
      setDatasets(wsDatasets);

      // Fetch column details for available datasets
      const colMap: Record<string, ColumnProfileItem[]> = {};
      for (const ds of wsDatasets) {
        try {
          const profile = await fetchDatasetProfile(ds.id, workspaceId);
          colMap[ds.id] = profile.columns;
        } catch {
          // If profile not generated yet, keep empty list
          colMap[ds.id] = [];
        }
      }
      setDatasetColumnsMap(colMap);
    } catch (err: any) {
      setError(err.message || "Failed to load modeling workspace.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [workspaceId]);

  const handleBindDataset = async (datasetId: string) => {
    if (!model) return;
    setError(null);
    try {
      await bindDatasetToModel(model.id, datasetId, undefined, undefined, workspaceId);
      setActionSuccess("Dataset added to model successfully.");
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to add dataset to model.");
    }
  };

  const handleValidate = async () => {
    if (!model || !sourceDatasetId || !sourceField || !targetDatasetId || !targetField) {
      setError("Please select source and target datasets and fields.");
      return;
    }
    setIsValidating(true);
    setError(null);
    setValidationResult(null);
    try {
      const res = await validateRelationship(
        model.id,
        {
          source_dataset_id: sourceDatasetId,
          source_field: sourceField,
          target_dataset_id: targetDatasetId,
          target_field: targetField,
          cardinality,
        },
        workspaceId
      );
      setValidationResult(res);
    } catch (err: any) {
      setError(err.message || "Relationship validation failed.");
    } finally {
      setIsValidating(false);
    }
  };

  const handleApplyRelationship = async () => {
    if (!model || !sourceDatasetId || !sourceField || !targetDatasetId || !targetField) {
      setError("Please select source and target datasets and fields.");
      return;
    }
    setIsApplying(true);
    setError(null);
    setActionSuccess(null);
    try {
      await createRelationship(
        model.id,
        {
          source_dataset_id: sourceDatasetId,
          source_field: sourceField,
          target_dataset_id: targetDatasetId,
          target_field: targetField,
          cardinality,
        },
        workspaceId
      );
      setActionSuccess("Relationship created successfully!");
      setValidationResult(null);
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to persist relationship.");
    } finally {
      setIsApplying(false);
    }
  };

  const handleDeleteRelationship = async (relId: string) => {
    if (!model) return;
    setError(null);
    try {
      await deleteRelationship(model.id, relId, workspaceId);
      setActionSuccess("Relationship removed.");
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to remove relationship.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 text-muted-foreground space-x-2">
        <RefreshCw className="h-5 w-5 animate-spin text-primary" />
        <span>Loading Data Model...</span>
      </div>
    );
  }

  const modelDatasets = model?.datasets || [];
  const relationships = model?.relationships || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <GitFork className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Data Modeling & Relationships</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Explicitly model dataset tables, field semantics, and cardinalities. (Phase 5 Metadata Layer)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1">
            Workspace: {workspaceId}
          </Badge>
          <Badge variant="secondary" className="px-3 py-1">
            Status: {model?.status || "active"}
          </Badge>
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-md bg-destructive/15 text-destructive text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Model Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Model ID
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-sm font-mono text-foreground truncate">{model?.id}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Bound Tables
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold">{modelDatasets.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase">
              Active Relationships
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-2xl font-bold text-primary">{relationships.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Datasets Binding Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Available Workspace Datasets
          </CardTitle>
          <CardDescription>
            Select prepared dataset versions to include in the logical data model.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {datasets.map((ds) => {
              const isBound = modelDatasets.some((m) => m.dataset_id === ds.id);
              return (
                <div
                  key={ds.id}
                  className={`p-4 rounded-lg border text-sm flex flex-col justify-between ${
                    isBound ? "border-primary/50 bg-primary/5" : "border-border bg-card"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground flex items-center gap-1.5 truncate">
                        <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                        {ds.name}
                      </span>
                      {isBound ? (
                        <Badge variant="success" className="text-[10px]">Bound</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">Unbound</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-2 space-y-0.5">
                      <p>Rows: {ds.row_count ?? "N/A"}</p>
                      <p>Cols: {ds.column_count ?? "N/A"}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    {!isBound && (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full"
                        onClick={() => handleBindDataset(ds.id)}
                      >
                        <PlusCircle className="h-3.5 w-3.5 mr-1" />
                        Add to Model
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Model Schema Representation */}
      {modelDatasets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              Model Schema & Fields
            </CardTitle>
            <CardDescription>
              Inspect bound dataset versions and exposed fields. Available fields are clearly distinguished from applied relationships.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {modelDatasets.map((mds) => {
                const dsName = mds.dataset_name || datasets.find((d) => d.id === mds.dataset_id)?.name || mds.dataset_id;
                const columns = datasetColumnsMap[mds.dataset_id] || [];
                const tableRels = relationships.filter(
                  (r) => r.source_dataset_id === mds.dataset_id || r.target_dataset_id === mds.dataset_id
                );

                return (
                  <div key={mds.id} className="border border-border rounded-lg p-4 bg-background">
                    <div className="flex items-center justify-between pb-3 border-b border-border">
                      <div>
                        <span className="font-bold text-base">{dsName}</span>
                        <p className="text-[11px] font-mono text-muted-foreground">Version: {mds.dataset_version_id}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {columns.length} Fields
                      </Badge>
                    </div>
                    <div className="mt-3 space-y-2 max-h-64 overflow-y-auto pr-1">
                      {columns.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No field metadata loaded.</p>
                      ) : (
                        columns.map((col) => {
                          const matchingRel = tableRels.find(
                            (r) =>
                              (r.source_dataset_id === mds.dataset_id && r.source_field === col.name) ||
                              (r.target_dataset_id === mds.dataset_id && r.target_field === col.name)
                          );

                          return (
                            <div
                              key={col.id}
                              className="flex items-center justify-between p-2 rounded bg-muted/40 text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px] uppercase font-mono">
                                  {col.physical_type}
                                </Badge>
                                <span className="font-medium text-foreground">{col.name}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Badge variant="secondary" className="text-[10px]">
                                  Available Field
                                </Badge>
                                {matchingRel && (
                                  <Badge variant="success" className="text-[10px] flex items-center gap-1">
                                    <GitFork className="h-3 w-3" />
                                    Applied Rel ({matchingRel.cardinality})
                                  </Badge>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Relationship Definition Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <GitFork className="h-5 w-5 text-primary" />
            Create Explicit Relationship
          </CardTitle>
          <CardDescription>
            Configure directed metadata relationship between tables. Relationships must be validated before being applied.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            {/* Source Dataset */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Source Table</label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={sourceDatasetId}
                onChange={(e) => {
                  setSourceDatasetId(e.target.value);
                  setSourceField("");
                }}
              >
                <option value="">Select source dataset</option>
                {modelDatasets.map((mds) => (
                  <option key={mds.dataset_id} value={mds.dataset_id}>
                    {mds.dataset_name || datasets.find((d) => d.id === mds.dataset_id)?.name || mds.dataset_id}
                  </option>
                ))}
              </select>
            </div>

            {/* Source Field */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Source Field</label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={sourceField}
                onChange={(e) => setSourceField(e.target.value)}
                disabled={!sourceDatasetId}
              >
                <option value="">Select source field</option>
                {(datasetColumnsMap[sourceDatasetId] || []).map((col) => (
                  <option key={col.name} value={col.name}>
                    {col.name} ({col.physical_type})
                  </option>
                ))}
              </select>
            </div>

            {/* Target Dataset */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Target Table</label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={targetDatasetId}
                onChange={(e) => {
                  setTargetDatasetId(e.target.value);
                  setTargetField("");
                }}
              >
                <option value="">Select target dataset</option>
                {modelDatasets.map((mds) => (
                  <option key={mds.dataset_id} value={mds.dataset_id}>
                    {mds.dataset_name || datasets.find((d) => d.id === mds.dataset_id)?.name || mds.dataset_id}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Field */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Target Field</label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={targetField}
                onChange={(e) => setTargetField(e.target.value)}
                disabled={!targetDatasetId}
              >
                <option value="">Select target field</option>
                {(datasetColumnsMap[targetDatasetId] || []).map((col) => (
                  <option key={col.name} value={col.name}>
                    {col.name} ({col.physical_type})
                  </option>
                ))}
              </select>
            </div>

            {/* Cardinality */}
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Cardinality</label>
              <select
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={cardinality}
                onChange={(e) => setCardinality(e.target.value as any)}
              >
                <option value="many_to_one">Many-to-One (N:1)</option>
                <option value="one_to_many">One-to-Many (1:N)</option>
                <option value="one_to_one">One-to-One (1:1)</option>
                <option value="many_to_many">Many-to-Many (N:M)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleValidate}
              disabled={isValidating || !sourceDatasetId || !sourceField || !targetDatasetId || !targetField}
            >
              <ShieldCheck className="h-4 w-4 mr-1.5" />
              {isValidating ? "Validating..." : "Validate Relationship"}
            </Button>

            <Button
              onClick={handleApplyRelationship}
              disabled={
                isApplying ||
                !sourceDatasetId ||
                !sourceField ||
                !targetDatasetId ||
                !targetField ||
                (validationResult !== null && !validationResult.is_valid)
              }
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              {isApplying ? "Applying..." : "Apply Relationship"}
            </Button>
          </div>

          {/* Validation Result Box */}
          {validationResult && (
            <div
              className={`p-4 rounded-lg border text-xs space-y-1 ${
                validationResult.is_valid
                  ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border-destructive/50 bg-destructive/10 text-destructive"
              }`}
            >
              <p className="font-semibold flex items-center gap-1.5 text-sm">
                {validationResult.is_valid ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Valid Relationship Proposal
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4" /> Validation Failed
                  </>
                )}
              </p>
              {validationResult.issues.length > 0 && (
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  {validationResult.issues.map((issue, idx) => (
                    <li key={idx}>{issue}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Applied Relationships List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <GitFork className="h-5 w-5 text-primary" />
            Applied Model Relationships
          </CardTitle>
          <CardDescription>
            List of active relationship metadata persisted in the data model.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {relationships.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No relationships applied yet. Create and apply relationships above.
            </div>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-xs uppercase font-semibold text-muted-foreground border-b border-border">
                  <tr>
                    <th className="p-3">Source Table & Field</th>
                    <th className="p-3">Direction & Cardinality</th>
                    <th className="p-3">Target Table & Field</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {relationships.map((rel) => {
                    const srcName =
                      datasets.find((d) => d.id === rel.source_dataset_id)?.name || rel.source_dataset_id;
                    const tgtName =
                      datasets.find((d) => d.id === rel.target_dataset_id)?.name || rel.target_dataset_id;

                    return (
                      <tr key={rel.id} className="hover:bg-muted/30">
                        <td className="p-3 font-medium">
                          <span>{srcName}</span>
                          <span className="text-muted-foreground font-mono text-xs ml-1">.{rel.source_field}</span>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="flex items-center gap-1 w-fit text-xs">
                            <ArrowRight className="h-3 w-3 text-primary" />
                            {rel.cardinality}
                          </Badge>
                        </td>
                        <td className="p-3 font-medium">
                          <span>{tgtName}</span>
                          <span className="text-muted-foreground font-mono text-xs ml-1">.{rel.target_field}</span>
                        </td>
                        <td className="p-3">
                          <Badge variant="success" className="text-[10px]">
                            {rel.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteRelationship(rel.id)}
                            title="Remove Relationship"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
