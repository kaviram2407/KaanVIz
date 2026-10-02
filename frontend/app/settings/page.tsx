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
    <div className="max-w-6xl mx-auto space-y-8 pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--kaan-ink)] pb-5 font-mono">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[var(--kaan-cream)] border border-[var(--kaan-ink)] text-[var(--kaan-ink)] shadow-[2px_2px_0_var(--kaan-ink)]">
            <SettingsIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-wider text-[var(--kaan-ink)]">Settings & Preferences</h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Manage AI Analyst status, model provider configuration, workspace metrics, and privacy governance.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadSettingsData}
          disabled={loadingAI}
          className="border border-[var(--kaan-ink)] bg-[var(--kaan-paper)] text-[var(--kaan-ink)] hover:bg-[var(--kaan-cream)] font-mono text-xs uppercase rounded-none shadow-[2px_2px_0_var(--kaan-ink)]"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loadingAI ? "animate-spin" : ""}`} />
          Refresh Status
        </Button>
      </div>

      {/* Global Banners */}
      {successNotice && (
        <div className="p-4 bg-[var(--kaan-paper)] border border-[var(--kaan-ink)] text-[var(--kaan-green)] text-xs font-mono shadow-[3px_3px_0_var(--kaan-ink)] flex items-center justify-between gap-3 font-bold">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--kaan-green)]" />
            <span>{successNotice}</span>
          </div>
          <button
            onClick={() => setSuccessNotice(null)}
            className="text-[var(--kaan-ink)] hover:text-black font-bold text-sm"
          >
            ×
          </button>
        </div>
      )}

      {errorNotice && (
        <div className="p-4 bg-[#FDF0ED] border border-[var(--kaan-ink)] text-[var(--kaan-coral)] text-xs font-mono shadow-[3px_3px_0_var(--kaan-ink)] flex items-center justify-between gap-3 font-bold">
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 shrink-0 text-[var(--kaan-coral)]" />
            <span>{errorNotice}</span>
          </div>
          <button
            onClick={() => setErrorNotice(null)}
            className="text-[var(--kaan-ink)] hover:text-black font-bold text-sm"
          >
            ×
          </button>
        </div>
      )}

      {/* Section 1: AI Provider Settings */}
      <Card className="bg-[var(--kaan-paper)] border border-[var(--kaan-ink)] rounded-none shadow-[4px_4px_0_var(--kaan-ink)]">
        <CardHeader className="border-b border-[var(--kaan-ink)] bg-[var(--kaan-cream)] font-mono">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Bot className="h-5 w-5 text-[var(--kaan-ink)]" />
              <div>
                <CardTitle className="text-base font-bold uppercase tracking-wider text-[var(--kaan-ink)]">AI Analyst & LLM Provider Settings</CardTitle>
                <CardDescription className="text-xs text-slate-600">
                  Configure NVIDIA Nemotron integration, check status, and verify model responsiveness.
                </CardDescription>
              </div>
            </div>

            {aiStatus ? (
              isAIEnabled ? (
                <Badge variant="outline" className="border border-[var(--kaan-ink)] text-white bg-[var(--kaan-green)] text-xs uppercase font-mono font-bold rounded-none shadow-[1px_1px_0_var(--kaan-ink)]">
                  <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                  AI Active ({aiStatus.provider})
                </Badge>
              ) : (
                <Badge variant="outline" className="border border-[var(--kaan-ink)] text-[var(--kaan-ink)] bg-[var(--kaan-yellow)] text-xs uppercase font-mono font-bold rounded-none shadow-[1px_1px_0_var(--kaan-ink)]">
                  <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                  AI Disabled
                </Badge>
              )
            ) : (
              <Badge variant="outline" className="border border-[var(--kaan-ink)] text-[var(--kaan-ink)] bg-[var(--kaan-cream)] text-xs uppercase font-mono rounded-none">
                Checking Status...
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6 font-mono">
          {/* Controls & Badges Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* AI Status Toggle */}
            <div className="p-4 border border-[var(--kaan-ink)] bg-[var(--kaan-cream)] shadow-[2px_2px_0_var(--kaan-ink)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                  AI Switch
                </span>
                <button
                  onClick={handleToggleAI}
                  disabled={toggleLoading || loadingAI}
                  role="switch"
                  aria-checked={isAIEnabled}
                  aria-label="Toggle AI Analyst Enabled State"
                  data-testid="ai-status-toggle"
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer border border-[var(--kaan-ink)] transition-colors duration-150 ${
                    isAIEnabled ? "bg-[var(--kaan-green)]" : "bg-slate-400"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform bg-white border border-[var(--kaan-ink)] transition duration-150 ${
                      isAIEnabled ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span
                  data-testid="ai-status-label"
                  className={`text-xs font-bold uppercase ${isAIEnabled ? "text-[var(--kaan-green)]" : "text-[var(--kaan-coral)]"}`}
                >
                  {isAIEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>

            {/* Provider */}
            <div className="p-4 border border-[var(--kaan-ink)] bg-[var(--kaan-cream)] shadow-[2px_2px_0_var(--kaan-ink)] space-y-2">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                Configured Provider
              </span>
              <div className="flex items-center gap-2" data-testid="ai-provider-info">
                <Cpu className="h-4 w-4 text-[var(--kaan-ink)]" />
                <span className="font-bold text-xs text-[var(--kaan-ink)] uppercase tracking-wide">
                  {aiStatus?.provider || "NVIDIA"}
                </span>
              </div>
            </div>

            {/* Configured Model */}
            <div className="p-4 border border-[var(--kaan-ink)] bg-[var(--kaan-cream)] shadow-[2px_2px_0_var(--kaan-ink)] space-y-2">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                Model Identifier
              </span>
              <div className="font-mono text-[10px] text-[var(--kaan-ink)] bg-[var(--kaan-paper)] border border-[var(--kaan-ink)] px-2 py-0.5 font-bold truncate" data-testid="ai-model-info">
                {aiStatus?.model || "nvidia/nemotron-3-super-120b-a12b"}
              </div>
            </div>

            {/* API Key Status */}
            <div className="p-4 border border-[var(--kaan-ink)] bg-[var(--kaan-cream)] shadow-[2px_2px_0_var(--kaan-ink)] space-y-2">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                API Key Security
              </span>
              <div className="flex items-center gap-2 text-xs font-mono text-[var(--kaan-ink)]" data-testid="api-key-status">
                <Lock className="h-3.5 w-3.5 text-[var(--kaan-green)]" />
                <span>••••••••••••••••</span>
                <Badge variant="outline" className="text-[9px] bg-[var(--kaan-paper)] border border-[var(--kaan-ink)] text-[var(--kaan-ink)] font-bold rounded-none uppercase ml-auto">
                  SECURE
                </Badge>
              </div>
            </div>
          </div>

          {/* Test Connection Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-[var(--kaan-ink)] bg-[var(--kaan-paper)] shadow-[2px_2px_0_var(--kaan-ink)]">
            <div>
              <p className="text-xs font-bold uppercase text-[var(--kaan-ink)]">Verify AI Model Connectivity</p>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Executes a lightweight live health probe against the configured NVIDIA Nemotron API endpoint.
              </p>
            </div>

            <Button
              onClick={handleTestConnection}
              disabled={testingConnection || !isAIEnabled}
              data-testid="test-connection-btn"
              className="border border-[var(--kaan-ink)] bg-[var(--kaan-green)] text-white hover:bg-[var(--kaan-teal)] font-mono text-xs uppercase font-bold rounded-none shadow-[2px_2px_0_var(--kaan-ink)]"
            >
              <Sparkles className={`h-3.5 w-3.5 mr-1.5 ${testingConnection ? "animate-spin" : ""}`} />
              {testingConnection ? "Testing..." : "Test Connection"}
            </Button>
          </div>

          {/* Connection Test Result */}
          {testResult && (
            <div
              className={`p-4 border text-xs font-mono shadow-[2px_2px_0_var(--kaan-ink)] ${
                testResult.success
                  ? "bg-[var(--kaan-cream)] border-[var(--kaan-ink)] text-[var(--kaan-ink)]"
                  : "bg-[#FDF0ED] border-[var(--kaan-ink)] text-[var(--kaan-coral)] font-bold"
              }`}
              data-testid="test-connection-result"
            >
              <div className="flex items-center gap-2 font-bold mb-1 uppercase">
                {testResult.success ? (
                  <CheckCircle2 className="h-4 w-4 text-[var(--kaan-green)]" />
                ) : (
                  <XCircle className="h-4 w-4 text-[var(--kaan-coral)]" />
                )}
                <span>Test Result: {testResult.success ? "PASSED" : "FAILED"}</span>
              </div>
              <p>{testResult.message}</p>
              <div className="mt-2 text-[10px] opacity-90 flex gap-4 font-mono font-bold uppercase">
                <span>Provider: {testResult.provider}</span>
                <span>Model: {testResult.model}</span>
                <span>Configured: {testResult.configured ? "YES" : "NO"}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 2: Workspace Information */}
      <Card className="bg-[var(--kaan-paper)] border border-[var(--kaan-ink)] rounded-none shadow-[4px_4px_0_var(--kaan-ink)]">
        <CardHeader className="border-b border-[var(--kaan-ink)] bg-[var(--kaan-cream)] font-mono">
          <div className="flex items-center gap-2.5">
            <Server className="h-5 w-5 text-[var(--kaan-ink)]" />
            <div>
              <CardTitle className="text-base font-bold uppercase tracking-wider text-[var(--kaan-ink)]">Workspace System Telemetry</CardTitle>
              <CardDescription className="text-xs text-slate-600">
                Read-only runtime environment information, backend database status, and active asset metrics.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 font-mono">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border border-[var(--kaan-ink)] bg-[var(--kaan-paper)] shadow-[2px_2px_0_var(--kaan-ink)] space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Workspace ID
              </span>
              <p className="text-xs font-bold text-[var(--kaan-ink)]">default-workspace-id</p>
              <p className="text-[10px] text-slate-500">Default local isolation boundary</p>
            </div>

            <div className="p-4 border border-[var(--kaan-ink)] bg-[var(--kaan-paper)] shadow-[2px_2px_0_var(--kaan-ink)] space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Backend Services
              </span>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-[var(--kaan-green)]" />
                <span className="text-xs font-bold text-[var(--kaan-green)] uppercase">
                  {health?.status || "HEALTHY"}
                </span>
              </div>
              <p className="text-[10px] text-slate-500">FastAPI v{health?.version || "1.0.0"}</p>
            </div>

            <div className="p-4 border border-[var(--kaan-ink)] bg-[var(--kaan-paper)] shadow-[2px_2px_0_var(--kaan-ink)] space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Active Datasets
              </span>
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-[var(--kaan-ink)]" />
                <span className="text-xs font-bold text-[var(--kaan-ink)]">
                  {datasetsCount !== null ? datasetsCount : "—"} Registered
                </span>
              </div>
              <p className="text-[10px] text-slate-500">CSV uploads & Parquet plans</p>
            </div>

            <div className="p-4 border border-[var(--kaan-ink)] bg-[var(--kaan-paper)] shadow-[2px_2px_0_var(--kaan-ink)] space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Active Dashboards
              </span>
              <div className="flex items-center gap-2">
                <LayoutDashboard className="h-4 w-4 text-[var(--kaan-ink)]" />
                <span className="text-xs font-bold text-[var(--kaan-ink)]">
                  {dashboardsCount !== null ? dashboardsCount : "—"} Configured
                </span>
              </div>
              <p className="text-[10px] text-slate-500">Visual layouts & KPI cards</p>
            </div>
          </div>

          {/* Infrastructure Health Detail */}
          {health && (
            <div className="mt-4 p-4 border border-[var(--kaan-ink)] bg-[var(--kaan-cream)] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono shadow-[2px_2px_0_var(--kaan-ink)]">
              <div>
                <span className="text-slate-600">PostgreSQL:</span>{" "}
                <span className="font-bold text-[var(--kaan-green)] uppercase">{health.database?.status}</span>
              </div>
              <div>
                <span className="text-slate-600">Redis Cache:</span>{" "}
                <span className="font-bold text-[var(--kaan-green)] uppercase">{health.redis?.status}</span>
              </div>
              <div>
                <span className="text-slate-600">File Storage:</span>{" "}
                <span className="font-bold text-[var(--kaan-green)] uppercase">{health.storage?.status}</span>
              </div>
              <div>
                <span className="text-slate-600">AI Probe:</span>{" "}
                <span className="font-bold text-[var(--kaan-green)] uppercase">{health.ai?.status}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 3: Data Architecture & Privacy Governance */}
      <Card className="bg-[var(--kaan-paper)] border border-[var(--kaan-ink)] rounded-none shadow-[4px_4px_0_var(--kaan-ink)]">
        <CardHeader className="border-b border-[var(--kaan-ink)] bg-[var(--kaan-cream)] font-mono">
          <div className="flex items-center gap-2.5">
            <Lock className="h-5 w-5 text-[var(--kaan-ink)]" />
            <div>
              <CardTitle className="text-base font-bold uppercase tracking-wider text-[var(--kaan-ink)]">Data Architecture & Privacy Governance</CardTitle>
              <CardDescription className="text-xs text-slate-600">
                Factual summary of KaanViz data handling, raw file immutability, and AI security boundaries.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 font-mono">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border border-[var(--kaan-ink)] bg-[var(--kaan-paper)] shadow-[2px_2px_0_var(--kaan-ink)] space-y-2">
              <div className="flex items-center gap-2 text-[var(--kaan-ink)]">
                <HardDrive className="h-4 w-4" />
                <h3 className="font-bold text-xs uppercase">Raw Data Immutability</h3>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Uploaded raw CSV files are treated as untrusted, read-only artifacts. Original raw files are stored intact and are never directly modified by cleaning operations or AI queries.
              </p>
            </div>

            <div className="p-4 border border-[var(--kaan-ink)] bg-[var(--kaan-paper)] shadow-[2px_2px_0_var(--kaan-ink)] space-y-2">
              <div className="flex items-center gap-2 text-[var(--kaan-ink)]">
                <Layers className="h-4 w-4" />
                <h3 className="font-bold text-xs uppercase">Isolated Prepared Storage</h3>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Dataset cleaning, filtering, and type corrections generate versioned, columnar Parquet files stored separately in dedicated workspace storage directories.
              </p>
            </div>

            <div className="p-4 border border-[var(--kaan-ink)] bg-[var(--kaan-paper)] shadow-[2px_2px_0_var(--kaan-ink)] space-y-2">
              <div className="flex items-center gap-2 text-[var(--kaan-ink)]">
                <ShieldCheck className="h-4 w-4" />
                <h3 className="font-bold text-xs uppercase">AI Optionality Principle</h3>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                AI is strictly an enhancement layer. Core CSV ingestion, profiling, preparation, data modeling, server-side DuckDB analytics, and dashboards operate 100% offline.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

