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
      <div className="flex items-center justify-center p-12 text-[var(--kaan-ink)] font-mono text-xs space-x-2 border border-[var(--kaan-ink)] bg-[var(--kaan-paper)] shadow-[4px_4px_0_var(--kaan-ink)]">
        <RefreshCw className="h-4 w-4 animate-spin text-[var(--kaan-green)]" />
        <span>Loading Data Model...</span>
      </div>
    );
  }

  const modelDatasets = model?.datasets || [];
  const relationships = model?.relationships || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--kaan-ink)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[var(--kaan-cream)] border border-[var(--kaan-ink)] text-[var(--kaan-ink)] shadow-[2px_2px_0_var(--kaan-ink)]">
              <GitFork className="h-5 w-5 text-[var(--kaan-ink)]" />
            </div>
            <h1 className="text-2xl font-mono font-bold text-[var(--kaan-ink)] tracking-wide uppercase">Data Modeling & Relationships</h1>
          </div>
          <p className="text-xs font-mono text-slate-600 mt-1">
            Explicitly model dataset tables, primary/foreign key field semantics, and relationship cardinalities.
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <Badge variant="outline" className="px-3 py-1 rounded-none border border-[var(--kaan-ink)] bg-[var(--kaan-cream)] text-[var(--kaan-ink)] shadow-[1px_1px_0_var(--kaan-ink)]">
            Workspace: {workspaceId}
          </Badge>
          <Badge variant="outline" className="px-3 py-1 rounded-none border border-[var(--kaan-ink)] bg-[var(--kaan-green)] text-white shadow-[1px_1px_0_var(--kaan-ink)] uppercase font-bold">
            Status: {model?.status || "active"}
          </Badge>
          <Button variant="outline" size="sm" onClick={loadData} className="border border-[var(--kaan-ink)] bg-[var(--kaan-paper)] text-[var(--kaan-ink)] hover:bg-[var(--kaan-cream)] text-xs uppercase font-mono rounded-none shadow-[2px_2px_0_var(--kaan-ink)]">
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 border border-[var(--kaan-ink)] bg-[#FDF0ED] text-[var(--kaan-ink)] text-xs font-mono shadow-[3px_3px_0_var(--kaan-ink)] flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-[var(--kaan-coral)] shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 border border-[var(--kaan-ink)] bg-[var(--kaan-paper)] text-[var(--kaan-green)] text-xs font-mono shadow-[3px_3px_0_var(--kaan-ink)] flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--kaan-green)]" />
          <span className="font-bold">{actionSuccess}</span>
        </div>
      )}

      {/* Model Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
        <Card className="bg-[var(--kaan-paper)] border border-[var(--kaan-ink)] rounded-none shadow-[4px_4px_0_var(--kaan-ink)]">
          <CardHeader className="p-4 pb-2 bg-[var(--kaan-cream)] border-b border-[var(--kaan-ink)]">
            <CardTitle className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Model Schema ID
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-3">
            <p className="text-xs font-bold text-[var(--kaan-ink)] truncate">{model?.id}</p>
          </CardContent>
        </Card>

        <Card className="bg-[var(--kaan-paper)] border border-[var(--kaan-ink)] rounded-none shadow-[4px_4px_0_var(--kaan-ink)]">
          <CardHeader className="p-4 pb-2 bg-[var(--kaan-cream)] border-b border-[var(--kaan-ink)]">
            <CardTitle className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Bound Dataset Nodes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-3">
            <p className="text-2xl font-bold text-[var(--kaan-ink)]">{modelDatasets.length}</p>
          </CardContent>
        </Card>

        <Card className="bg-[var(--kaan-paper)] border border-[var(--kaan-ink)] rounded-none shadow-[4px_4px_0_var(--kaan-ink)]">
          <CardHeader className="p-4 pb-2 bg-[var(--kaan-cream)] border-b border-[var(--kaan-ink)]">
            <CardTitle className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Active Relationships
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-3">
            <p className="text-2xl font-bold text-[var(--kaan-green)]">{relationships.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Datasets Binding Section */}
      <Card className="bg-[var(--kaan-paper)] border border-[var(--kaan-ink)] rounded-none shadow-[4px_4px_0_var(--kaan-ink)]">
        <CardHeader className="border-b border-[var(--kaan-ink)] bg-[var(--kaan-cream)]">
          <CardTitle className="text-base font-mono font-bold uppercase tracking-wider text-[var(--kaan-ink)] flex items-center gap-2">
            <Database className="h-4 w-4 text-[var(--kaan-ink)]" />
            Available Workspace Datasets
          </CardTitle>
          <CardDescription className="text-xs font-mono text-slate-600">
            Select prepared dataset versions to include in the logical data model schema.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-mono">
            {datasets.map((ds) => {
              const isBound = modelDatasets.some((m) => m.dataset_id === ds.id);
              return (
                <div
                  key={ds.id}
                  className={`p-4 border text-xs flex flex-col justify-between shadow-[2px_2px_0_var(--kaan-ink)] ${
                    isBound ? "border-[var(--kaan-ink)] bg-[var(--kaan-cream)]" : "border-[var(--kaan-ink)] bg-[var(--kaan-paper)]"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[var(--kaan-ink)] flex items-center gap-1.5 truncate">
                        <FileSpreadsheet className="h-4 w-4 text-slate-600" />
                        {ds.name}
                      </span>
                      {isBound ? (
                        <Badge variant="outline" className="border border-[var(--kaan-ink)] text-white bg-[var(--kaan-green)] text-[9px] uppercase font-bold rounded-none">Bound</Badge>
                      ) : (
                        <Badge variant="outline" className="border border-[var(--kaan-ink)] text-[var(--kaan-ink)] bg-[var(--kaan-paper)] text-[9px] uppercase font-bold rounded-none">Unbound</Badge>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-600 mt-2 space-y-0.5">
                      <p>Rows: {ds.row_count ?? "N/A"}</p>
                      <p>Cols: {ds.column_count ?? "N/A"}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    {!isBound && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full border border-[var(--kaan-ink)] bg-[var(--kaan-paper)] text-[var(--kaan-ink)] hover:bg-[var(--kaan-cream)] font-mono text-xs uppercase rounded-none shadow-[2px_2px_0_var(--kaan-ink)]"
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
        <Card className="bg-[var(--kaan-paper)] border border-[var(--kaan-ink)] rounded-none shadow-[4px_4px_0_var(--kaan-ink)]">
          <CardHeader className="border-b border-[var(--kaan-ink)] bg-[var(--kaan-cream)]">
            <CardTitle className="text-base font-mono font-bold uppercase tracking-wider text-[var(--kaan-ink)] flex items-center gap-2">
              <Layers className="h-4 w-4 text-[var(--kaan-ink)]" />
              Model Node Schemas & Fields
            </CardTitle>
            <CardDescription className="text-xs font-mono text-slate-600">
              Inspect bound dataset versions and exposed fields. Active key relationships are highlighted.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono">
              {modelDatasets.map((mds) => {
                const dsName = mds.dataset_name || datasets.find((d) => d.id === mds.dataset_id)?.name || mds.dataset_id;
                const columns = datasetColumnsMap[mds.dataset_id] || [];
                const tableRels = relationships.filter(
                  (r) => r.source_dataset_id === mds.dataset_id || r.target_dataset_id === mds.dataset_id
                );

                return (
                  <div key={mds.id} className="border border-[var(--kaan-ink)] p-4 bg-[var(--kaan-paper)] shadow-[3px_3px_0_var(--kaan-ink)]">
                    <div className="flex items-center justify-between pb-3 border-b border-[var(--kaan-ink)]">
                      <div>
                        <span className="font-bold text-sm text-[var(--kaan-ink)] uppercase">{dsName}</span>
                        <p className="text-[10px] text-slate-500">Version: {mds.dataset_version_id}</p>
                      </div>
                      <Badge variant="outline" className="border border-[var(--kaan-ink)] text-[var(--kaan-ink)] bg-[var(--kaan-cream)] text-[10px] uppercase font-bold rounded-none">
                        {columns.length} Fields
                      </Badge>
                    </div>
                    <div className="mt-3 space-y-1.5 max-h-64 overflow-y-auto pr-1">
                      {columns.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">No field metadata loaded.</p>
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
                              className="flex items-center justify-between p-2 border border-[var(--kaan-ink)]/30 bg-[var(--kaan-cream)] text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="border border-[var(--kaan-ink)] text-[var(--kaan-ink)] bg-[var(--kaan-paper)] text-[9px] uppercase font-bold rounded-none">
                                  {col.physical_type}
                                </Badge>
                                <span className="font-bold text-[var(--kaan-ink)]">{col.name}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                {matchingRel ? (
                                  <Badge variant="outline" className="border border-[var(--kaan-ink)] text-white bg-[var(--kaan-green)] text-[9px] uppercase font-bold rounded-none flex items-center gap-1">
                                    <GitFork className="h-3 w-3" />
                                    REL ({matchingRel.cardinality})
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="border border-[var(--kaan-ink)] text-[var(--kaan-ink)] bg-[var(--kaan-paper)] text-[9px] uppercase font-bold rounded-none">
                                    FIELD
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
      <Card className="bg-[var(--kaan-paper)] border border-[var(--kaan-ink)] rounded-none shadow-[4px_4px_0_var(--kaan-ink)]">
        <CardHeader className="border-b border-[var(--kaan-ink)] bg-[var(--kaan-cream)]">
          <CardTitle className="text-base font-mono font-bold uppercase tracking-wider text-[var(--kaan-ink)] flex items-center gap-2">
            <GitFork className="h-4 w-4 text-[var(--kaan-ink)]" />
            Create Explicit Relationship
          </CardTitle>
          <CardDescription className="text-xs font-mono text-slate-600">
            Configure directed metadata relationships between tables. Validate cardinality before persisting.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4 font-mono">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            {/* Source Dataset */}
            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-1 uppercase">Source Table</label>
              <select
                className="w-full h-9 rounded-none border border-[var(--kaan-ink)] bg-[var(--kaan-paper)] px-3 py-1 text-xs font-mono text-[var(--kaan-ink)] focus:outline-none shadow-[2px_2px_0_var(--kaan-ink)]"
                value={sourceDatasetId}
                onChange={(e) => {
                  setSourceDatasetId(e.target.value);
                  setSourceField("");
                }}
              >
                <option value="">SELECT SOURCE TABLE</option>
                {modelDatasets.map((mds) => (
                  <option key={mds.dataset_id} value={mds.dataset_id}>
                    {mds.dataset_name || datasets.find((d) => d.id === mds.dataset_id)?.name || mds.dataset_id}
                  </option>
                ))}
              </select>
            </div>

            {/* Source Field */}
            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-1 uppercase">Source Field (FK/PK)</label>
              <select
                className="w-full h-9 rounded-none border border-[var(--kaan-ink)] bg-[var(--kaan-paper)] px-3 py-1 text-xs font-mono text-[var(--kaan-ink)] focus:outline-none shadow-[2px_2px_0_var(--kaan-ink)]"
                value={sourceField}
                onChange={(e) => setSourceField(e.target.value)}
                disabled={!sourceDatasetId}
              >
                <option value="">SELECT FIELD</option>
                {(datasetColumnsMap[sourceDatasetId] || []).map((col) => (
                  <option key={col.name} value={col.name}>
                    {col.name} ({col.physical_type})
                  </option>
                ))}
              </select>
            </div>

            {/* Target Dataset */}
            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-1 uppercase">Target Table</label>
              <select
                className="w-full h-9 rounded-none border border-[var(--kaan-ink)] bg-[var(--kaan-paper)] px-3 py-1 text-xs font-mono text-[var(--kaan-ink)] focus:outline-none shadow-[2px_2px_0_var(--kaan-ink)]"
                value={targetDatasetId}
                onChange={(e) => {
                  setTargetDatasetId(e.target.value);
                  setTargetField("");
                }}
              >
                <option value="">SELECT TARGET TABLE</option>
                {modelDatasets.map((mds) => (
                  <option key={mds.dataset_id} value={mds.dataset_id}>
                    {mds.dataset_name || datasets.find((d) => d.id === mds.dataset_id)?.name || mds.dataset_id}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Field */}
            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-1 uppercase">Target Field (PK/FK)</label>
              <select
                className="w-full h-9 rounded-none border border-[var(--kaan-ink)] bg-[var(--kaan-paper)] px-3 py-1 text-xs font-mono text-[var(--kaan-ink)] focus:outline-none shadow-[2px_2px_0_var(--kaan-ink)]"
                value={targetField}
                onChange={(e) => setTargetField(e.target.value)}
                disabled={!targetDatasetId}
              >
                <option value="">SELECT FIELD</option>
                {(datasetColumnsMap[targetDatasetId] || []).map((col) => (
                  <option key={col.name} value={col.name}>
                    {col.name} ({col.physical_type})
                  </option>
                ))}
              </select>
            </div>

            {/* Cardinality */}
            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-1 uppercase">Cardinality</label>
              <select
                className="w-full h-9 rounded-none border border-[var(--kaan-ink)] bg-[var(--kaan-paper)] px-3 py-1 text-xs font-mono text-[var(--kaan-ink)] focus:outline-none shadow-[2px_2px_0_var(--kaan-ink)]"
                value={cardinality}
                onChange={(e) => setCardinality(e.target.value as any)}
              >
                <option value="many_to_one">MANY-TO-ONE (N:1)</option>
                <option value="one_to_many">ONE-TO-MANY (1:N)</option>
                <option value="one_to_one">ONE-TO-ONE (1:1)</option>
                <option value="many_to_many">MANY-TO-MANY (N:M)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleValidate}
              disabled={isValidating || !sourceDatasetId || !sourceField || !targetDatasetId || !targetField}
              className="border border-[var(--kaan-ink)] bg-[var(--kaan-cream)] text-[var(--kaan-ink)] hover:bg-[var(--kaan-paper)] font-mono text-xs uppercase rounded-none shadow-[2px_2px_0_var(--kaan-ink)]"
            >
              <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
              {isValidating ? "Validating..." : "Validate Cardinality"}
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
              className="border border-[var(--kaan-ink)] bg-[var(--kaan-green)] text-white hover:bg-[var(--kaan-teal)] font-mono text-xs uppercase rounded-none shadow-[2px_2px_0_var(--kaan-ink)] font-bold"
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
              {isApplying ? "Applying..." : "Persist Relationship"}
            </Button>
          </div>

          {/* Validation Result Box */}
          {validationResult && (
            <div
              className={`p-4 border text-xs space-y-1 font-mono shadow-[2px_2px_0_var(--kaan-ink)] ${
                validationResult.is_valid
                  ? "border-[var(--kaan-ink)] bg-[var(--kaan-paper)] text-[var(--kaan-green)] font-bold"
                  : "border-[var(--kaan-ink)] bg-[#FDF0ED] text-[var(--kaan-coral)] font-bold"
              }`}
            >
              <p className="font-bold flex items-center gap-1.5 text-xs uppercase">
                {validationResult.is_valid ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Valid Relationship Structure
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
      <Card className="bg-[var(--kaan-paper)] border border-[var(--kaan-ink)] rounded-none shadow-[4px_4px_0_var(--kaan-ink)]">
        <CardHeader className="border-b border-[var(--kaan-ink)] bg-[var(--kaan-cream)]">
          <CardTitle className="text-base font-mono font-bold uppercase tracking-wider text-[var(--kaan-ink)] flex items-center gap-2">
            <GitFork className="h-4 w-4 text-[var(--kaan-ink)]" />
            Applied Model Relationships
          </CardTitle>
          <CardDescription className="text-xs font-mono text-slate-600">
            List of active relationship metadata persisted in the DuckDB model engine.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {relationships.length === 0 ? (
            <div className="text-center py-8 text-slate-500 font-mono text-xs italic border border-dashed border-[var(--kaan-ink)] bg-[var(--kaan-paper)]">
              No relationships applied yet. Configure and persist relationships above.
            </div>
          ) : (
            <div className="border border-[var(--kaan-ink)] overflow-hidden font-mono text-xs shadow-[3px_3px_0_var(--kaan-ink)]">
              <table className="w-full text-left text-[var(--kaan-ink)]">
                <thead className="bg-[var(--kaan-cream)] border-b border-[var(--kaan-ink)] uppercase font-mono text-[10px] font-bold">
                  <tr>
                    <th className="p-3">Source Table & Field</th>
                    <th className="p-3">Direction & Cardinality</th>
                    <th className="p-3">Target Table & Field</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--kaan-ink)]/20 bg-[var(--kaan-paper)]">
                  {relationships.map((rel) => {
                    const srcName =
                      datasets.find((d) => d.id === rel.source_dataset_id)?.name || rel.source_dataset_id;
                    const tgtName =
                      datasets.find((d) => d.id === rel.target_dataset_id)?.name || rel.target_dataset_id;

                    return (
                      <tr key={rel.id} className="hover:bg-[var(--kaan-cream)]/50 transition-colors">
                        <td className="p-3 font-bold">
                          <span>{srcName}</span>
                          <span className="text-slate-500 text-[11px] ml-1">.{rel.source_field}</span>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="border border-[var(--kaan-ink)] text-[var(--kaan-ink)] bg-[var(--kaan-cream)] text-[10px] uppercase font-bold rounded-none flex items-center gap-1 w-fit">
                            <ArrowRight className="h-3 w-3 text-[var(--kaan-green)]" />
                            {rel.cardinality}
                          </Badge>
                        </td>
                        <td className="p-3 font-bold">
                          <span>{tgtName}</span>
                          <span className="text-slate-500 text-[11px] ml-1">.{rel.target_field}</span>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="border border-[var(--kaan-ink)] text-white bg-[var(--kaan-green)] text-[9px] uppercase font-bold rounded-none">
                            {rel.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0 border border-[var(--kaan-ink)] bg-[#FDF0ED] text-[var(--kaan-coral)] hover:bg-[var(--kaan-coral)] hover:text-white rounded-none shadow-[1px_1px_0_var(--kaan-ink)]"
                            onClick={() => handleDeleteRelationship(rel.id)}
                            title="Remove Relationship"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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

