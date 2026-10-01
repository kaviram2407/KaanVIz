"use client";

import React, { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  Bot,
  ShieldCheck,
  AlertTriangle,
  Cpu,
  RefreshCw,
  Database,
  LayoutDashboard,
  HardDrive,
  FileText,
  Lock,
  Layers,
  Sparkles,
  CheckCircle2,
  XCircle,
  Moon,
  Info,
  Server,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  fetchAIStatus,
  toggleAIStatus,
  testAIConnection,
  AIAvailabilityResponse,
  AITestConnectionResponse,
} from "@/lib/ai-api";
import {
  fetchBackendHealth,
  fetchWorkspaceDatasets,
  fetchWorkspaceDashboards,
  HealthResponse,
  DatasetItem,
} from "@/lib/api-client";

export default function SettingsPage() {
  const [aiStatus, setAIStatus] = useState<AIAvailabilityResponse | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [datasetsCount, setDatasetsCount] = useState<number | null>(null);
  const [dashboardsCount, setDashboardsCount] = useState<number | null>(null);

  const [loadingAI, setLoadingAI] = useState<boolean>(true);
  const [toggleLoading, setToggleLoading] = useState<boolean>(false);
  const [testingConnection, setTestingConnection] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<AITestConnectionResponse | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  useEffect(() => {
    loadSettingsData();
  }, []);

  async function loadSettingsData() {
    setLoadingAI(true);
    setErrorNotice(null);
    try {
      const [aiRes, healthRes, datasetsRes, dashboardsRes] = await Promise.allSettled([
        fetchAIStatus(),
        fetchBackendHealth(),
        fetchWorkspaceDatasets("default-workspace-id"),
        fetchWorkspaceDashboards("default-workspace-id"),
      ]);

      if (aiRes.status === "fulfilled") {
        setAIStatus(aiRes.value);
      }
      if (healthRes.status === "fulfilled") {
        setHealth(healthRes.value);
      }
      if (datasetsRes.status === "fulfilled" && Array.isArray(datasetsRes.value)) {
        setDatasetsCount(datasetsRes.value.length);
      } else {
        setDatasetsCount(0);
      }
      if (dashboardsRes.status === "fulfilled" && Array.isArray(dashboardsRes.value)) {
        setDashboardsCount(dashboardsRes.value.length);
      } else {
        setDashboardsCount(0);
      }
    } catch (err: any) {
      setErrorNotice("Failed to load workspace settings telemetry.");
    } finally {
      setLoadingAI(false);
    }
  }

  async function handleToggleAI() {
    if (!aiStatus) return;
    setToggleLoading(true);
    setTestResult(null);
    setErrorNotice(null);
    setSuccessNotice(null);

    const nextState = !aiStatus.enabled;
    try {
      const updated = await toggleAIStatus(nextState);
      setAIStatus(updated);
      setSuccessNotice(`AI Analyst successfully ${nextState ? "enabled" : "disabled"}.`);
    } catch (err: any) {
      setErrorNotice(err?.message || "Failed to change AI status.");
    } finally {
      setToggleLoading(false);
    }
  }

  async function handleTestConnection() {
    setTestingConnection(true);
    setTestResult(null);
    setErrorNotice(null);
    setSuccessNotice(null);

    try {
      const result = await testAIConnection();
      setTestResult(result);
      if (result.success) {
        setSuccessNotice(`Connection test successful: ${result.message}`);
      } else {
        setErrorNotice(`Connection test failed: ${result.message}`);
      }
    } catch (err: any) {
      setErrorNotice("AI test connection request failed.");
    } finally {
      setTestingConnection(false);
    }
  }

  const isAIEnabled = aiStatus?.enabled ?? false;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-primary">
            <SettingsIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Settings & Preferences</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage AI Analyst status, model provider configuration, workspace metrics, and privacy governance.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadSettingsData}
          disabled={loadingAI}
          className="self-start sm:self-auto gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loadingAI ? "animate-spin" : ""}`} />
          Refresh Settings
        </Button>
      </div>

      {/* Global Banners */}
      {successNotice && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-sm text-emerald-400 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>{successNotice}</span>
          </div>
          <button
            onClick={() => setSuccessNotice(null)}
            className="text-emerald-400 hover:text-emerald-300 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {errorNotice && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-lg text-sm text-rose-400 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 shrink-0" />
            <span>{errorNotice}</span>
          </div>
          <button
            onClick={() => setErrorNotice(null)}
            className="text-rose-400 hover:text-rose-300 font-bold"
          >
            ×
          </button>
        </div>
      )}

      {/* Section 1: AI Provider Settings */}
      <Card className="border-border bg-card">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Bot className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-lg font-bold">AI Analyst & LLM Provider Settings</CardTitle>
                <CardDescription className="text-xs">
                  Configure NVIDIA Nemotron integration, check status, and verify model responsiveness.
                </CardDescription>
              </div>
            </div>

            {aiStatus ? (
              isAIEnabled ? (
                <Badge variant="success" className="w-fit px-3 py-1 text-xs gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  AI Active ({aiStatus.provider})
                </Badge>
              ) : (
                <Badge variant="outline" className="w-fit px-3 py-1 text-xs gap-1.5 border-amber-500/40 text-amber-400 bg-amber-500/10">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  AI Disabled
                </Badge>
              )
            ) : (
              <Badge variant="outline" className="w-fit text-xs animate-pulse">
                Checking AI Status...
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Controls & Badges Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* AI Status Toggle */}
            <div className="p-4 rounded-lg border border-border bg-muted/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  AI Status
                </span>
                <button
                  onClick={handleToggleAI}
                  disabled={toggleLoading || loadingAI}
                  role="switch"
                  aria-checked={isAIEnabled}
                  aria-label="Toggle AI Analyst Enabled State"
                  data-testid="ai-status-toggle"
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 ${
                    isAIEnabled ? "bg-primary" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isAIEnabled ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span
                  data-testid="ai-status-label"
                  className={`text-sm font-bold ${isAIEnabled ? "text-emerald-400" : "text-amber-400"}`}
                >
                  {isAIEnabled ? "Enabled" : "Disabled"}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({isAIEnabled ? "Active for Q&A & Insights" : "AI features suspended"})
                </span>
              </div>
            </div>

            {/* Provider */}
            <div className="p-4 rounded-lg border border-border bg-muted/40 space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Configured Provider
              </span>
              <div className="flex items-center gap-2" data-testid="ai-provider-info">
                <Cpu className="h-4 w-4 text-primary" />
                <span className="font-bold text-sm text-foreground uppercase tracking-wide">
                  {aiStatus?.provider || "NVIDIA"}
                </span>
              </div>
            </div>

            {/* Configured Model */}
            <div className="p-4 rounded-lg border border-border bg-muted/40 space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Model Identifier
              </span>
              <div className="font-mono text-xs text-primary bg-primary/10 border border-primary/20 px-2 py-1 rounded truncate" data-testid="ai-model-info">
                {aiStatus?.model || "nvidia/nemotron-3-super-120b-a12b"}
              </div>
            </div>

            {/* API Key Status */}
            <div className="p-4 rounded-lg border border-border bg-muted/40 space-y-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                API Key Security
              </span>
              <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground" data-testid="api-key-status">
                <Lock className="h-3.5 w-3.5 text-emerald-400" />
                <span>••••••••••••••••</span>
                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/30 ml-auto">
                  Secure Backend
                </Badge>
              </div>
            </div>
          </div>

          {/* Test Connection Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg border border-border bg-background">
            <div>
              <p className="text-sm font-semibold text-foreground">Verify AI Model Connectivity</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Executes a lightweight live health probe against the configured NVIDIA Nemotron API endpoint.
              </p>
            </div>

            <Button
              onClick={handleTestConnection}
              disabled={testingConnection || !isAIEnabled}
              data-testid="test-connection-btn"
              className="gap-2 shrink-0"
            >
              <Sparkles className={`h-4 w-4 ${testingConnection ? "animate-spin" : ""}`} />
              {testingConnection ? "Testing Connection..." : "Test Connection"}
            </Button>
          </div>

          {/* Connection Test Result */}
          {testResult && (
            <div
              className={`p-4 rounded-lg border text-xs leading-relaxed ${
                testResult.success
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-300"
              }`}
              data-testid="test-connection-result"
            >
              <div className="flex items-center gap-2 font-bold mb-1">
                {testResult.success ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <XCircle className="h-4 w-4 text-rose-400" />
                )}
                <span>Test Result: {testResult.success ? "Passed" : "Failed"}</span>
              </div>
              <p>{testResult.message}</p>
              <div className="mt-2 text-[11px] opacity-80 flex gap-4 font-mono">
                <span>Provider: {testResult.provider}</span>
                <span>Model: {testResult.model}</span>
                <span>Configured: {testResult.configured ? "Yes" : "No"}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 2: Workspace Information */}
      <Card className="border-border bg-card">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <Server className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg font-bold">Workspace System Telemetry</CardTitle>
              <CardDescription className="text-xs">
                Read-only runtime environment information, backend database status, and active asset metrics.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border border-border bg-background space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Workspace ID
              </span>
              <p className="font-mono text-xs font-bold text-foreground">default-workspace-id</p>
              <p className="text-[11px] text-muted-foreground">Default local isolation boundary</p>
            </div>

            <div className="p-4 rounded-lg border border-border bg-background space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Backend Services
              </span>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-bold text-emerald-400 uppercase">
                  {health?.status || "Healthy"}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">FastAPI v{health?.version || "1.0.0"}</p>
            </div>

            <div className="p-4 rounded-lg border border-border bg-background space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Active Datasets
              </span>
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold text-foreground">
                  {datasetsCount !== null ? datasetsCount : "—"} Registered
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">CSV uploads & Parquet plans</p>
            </div>

            <div className="p-4 rounded-lg border border-border bg-background space-y-1">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Active Dashboards
              </span>
              <div className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4 text-primary" />
                <span className="text-sm font-bold text-foreground">
                  {dashboardsCount !== null ? dashboardsCount : "—"} Configured
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">Visual layouts & KPI cards</p>
            </div>
          </div>

          {/* Infrastructure Health Detail */}
          {health && (
            <div className="mt-4 p-4 rounded-lg border border-border bg-muted/30 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-muted-foreground">PostgreSQL:</span>{" "}
                <span className="font-semibold text-emerald-400 uppercase">{health.database?.status}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Redis Cache:</span>{" "}
                <span className="font-semibold text-emerald-400 uppercase">{health.redis?.status}</span>
              </div>
              <div>
                <span className="text-muted-foreground">File Storage:</span>{" "}
                <span className="font-semibold text-emerald-400 uppercase">{health.storage?.status}</span>
              </div>
              <div>
                <span className="text-muted-foreground">AI Probe:</span>{" "}
                <span className="font-semibold text-emerald-400 uppercase">{health.ai?.status}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 3: Data Architecture & Privacy Governance */}
      <Card className="border-border bg-card">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <Lock className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg font-bold">Data Architecture & Privacy Governance</CardTitle>
              <CardDescription className="text-xs">
                Factual summary of KaanViz data handling, raw file immutability, and AI security boundaries.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border border-border bg-background space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <HardDrive className="h-4 w-4" />
                <h3 className="font-bold text-sm text-foreground">Raw Data Immutability</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Uploaded raw CSV files are treated as untrusted, read-only artifacts. Original raw files are stored intact and are never directly modified by cleaning operations or AI queries.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border bg-background space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <Layers className="h-4 w-4" />
                <h3 className="font-bold text-sm text-foreground">Isolated Prepared Storage</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Dataset cleaning, filtering, and type corrections generate versioned, columnar Parquet files stored separately in dedicated workspace storage directories.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border bg-background space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <ShieldCheck className="h-4 w-4" />
                <h3 className="font-bold text-sm text-foreground">AI Optionality Principle</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                AI is strictly an enhancement layer. Core CSV ingestion, profiling, preparation, data modeling, server-side DuckDB analytics, and dashboards operate 100% offline.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border bg-background space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <FileText className="h-4 w-4" />
                <h3 className="font-bold text-sm text-foreground">Bounded Structured Context</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                AI requests transmit strictly bounded JSON schemas (column names, physical types, aggregations). Raw database rows are never bulk-transmitted to external AI models.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border bg-background space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <XCircle className="h-4 w-4" />
                <h3 className="font-bold text-sm text-foreground">Cascading Dataset Deletion</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Deleting a dataset permanently purges its raw CSV, versioned Parquet artifacts, profiles, transformations, model bindings, relationships, and associated dashboard widgets.
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border bg-background space-y-2">
              <div className="flex items-center gap-2 text-primary">
                <Lock className="h-4 w-4" />
                <h3 className="font-bold text-sm text-foreground">Backend API Key Isolation</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The NVIDIA API key (`NVIDIA_API_KEY`) is stored securely in backend server environment variables and is never exposed to browser clients or DOM elements.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: Appearance */}
      <Card className="border-border bg-card">
        <CardHeader className="border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <Moon className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg font-bold">Workspace Appearance</CardTitle>
              <CardDescription className="text-xs">
                Theme configuration and visual design system options.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-background">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
                <Moon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Dark Analytical Visual Language</p>
                <p className="text-xs text-muted-foreground">
                  KaanViz uses a unified slate/dark color palette designed for high-contrast chart readability.
                </p>
              </div>
            </div>

            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
              Dark Mode (Default)
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
