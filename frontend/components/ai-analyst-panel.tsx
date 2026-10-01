"use client";

import React, { useState, useEffect } from "react";
import {
  fetchAIStatus,
  askAIQuestion,
  generateAIVisualization,
  explainAIVisual,
  fetchAIInsights,
  testAIConnection,
  toggleAIStatus,
  AIAvailabilityResponse,
  AITestConnectionResponse,
  NLQuestionResponse,
  AIVisualizeResponse,
  AIExplainResponse,
  AIInsight,
  AIVisualizationSuggestion,
} from "@/lib/ai-api";
import { VisualizationChart } from "@/components/visualization-chart";
import { Bot, Sparkles, HelpCircle, BarChart3, Lightbulb, Check, X, AlertTriangle, ShieldCheck, Activity, Cpu, Power } from "lucide-react";

interface AIAnalystPanelProps {
  datasetId?: string;
  dashboardId?: string;
  onApproveVisual?: (suggestion: AIVisualizationSuggestion) => void;
}

export function AIAnalystPanel({ datasetId, dashboardId, onApproveVisual }: AIAnalystPanelProps) {
  const [aiStatus, setAiStatus] = useState<AIAvailabilityResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"query" | "visualize" | "insights" | "explain">("query");

  // Toggle AI State
  const [toggleLoading, setToggleLoading] = useState(false);

  // Test Connection State
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<AITestConnectionResponse | null>(null);

  // NL Query State
  const [question, setQuestion] = useState("");
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryResult, setQueryResult] = useState<NLQuestionResponse | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);

  // Visualize State
  const [visPrompt, setVisPrompt] = useState("");
  const [visLoading, setVisLoading] = useState(false);
  const [visResult, setVisResult] = useState<AIVisualizeResponse | null>(null);
  const [visError, setVisError] = useState<string | null>(null);

  // Insights State
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  // Explain State
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainResult, setExplainResult] = useState<AIExplainResponse | null>(null);
  const [explainError, setExplainError] = useState<string | null>(null);

  // User approval feedback
  const [approvalFeedback, setApprovalFeedback] = useState<string | null>(null);

  useEffect(() => {
    fetchAIStatus().then(setAiStatus).catch(console.error);
  }, []);

  const handleToggleAI = async () => {
    if (!aiStatus) return;
    setToggleLoading(true);
    try {
      const nextState = !aiStatus.enabled;
      const updated = await toggleAIStatus(nextState);
      setAiStatus(updated);
      setTestResult(null);
    } catch (err: any) {
      console.error("Failed to toggle AI status:", err);
    } finally {
      setToggleLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const res = await testAIConnection();
      setTestResult(res);
      // Refresh AI status after test
      const statusRes = await fetchAIStatus();
      setAiStatus(statusRes);
    } catch (err: any) {
      setTestResult({
        success: false,
        provider: aiStatus?.provider || "unknown",
        model: aiStatus?.model || "unknown",
        configured: false,
        message: err?.message || "Failed to execute connection test.",
      });
    } finally {
      setTestLoading(false);
    }
  };

  const handleAskQuestion = async (qText?: string) => {
    const targetQ = qText || question;
    if (!targetQ.trim()) return;
    setQueryLoading(true);
    setQueryError(null);
    setQueryResult(null);
    setApprovalFeedback(null);
    try {
      const res = await askAIQuestion({
        question: targetQ,
        dataset_id: datasetId,
        dashboard_id: dashboardId,
      });
      setQueryResult(res);
    } catch (err: any) {
      setQueryError(err?.message || "Failed to process question");
    } finally {
      setQueryLoading(false);
    }
  };

  const handleGenerateVis = async () => {
    if (!visPrompt.trim() || !datasetId) return;
    setVisLoading(true);
    setVisError(null);
    setVisResult(null);
    setApprovalFeedback(null);
    try {
      const res = await generateAIVisualization({
        prompt: visPrompt,
        dataset_id: datasetId,
      });
      setVisResult(res);
    } catch (err: any) {
      setVisError(err?.message || "Failed to generate visualization");
    } finally {
      setVisLoading(false);
    }
  };

  const handleGetInsights = async () => {
    if (!datasetId) return;
    setInsightsLoading(true);
    setInsightsError(null);
    try {
      const res = await fetchAIInsights({ dataset_id: datasetId, dashboard_id: dashboardId });
      setInsights(res.insights || []);
    } catch (err: any) {
      setInsightsError(err?.message || "Failed to fetch AI insights");
    } finally {
      setInsightsLoading(false);
    }
  };

  const handleExplainVisual = async () => {
    if (!datasetId) return;
    setExplainLoading(true);
    setExplainError(null);
    try {
      const sampleSpec = visResult?.suggestion || queryResult?.visual_suggestion || {
        chart_type: "bar",
        title: "Active Visual Spec",
        dimensions: [{ field: "category" }],
        measures: [{ field: "revenue", aggregation: "sum" }],
      };
      const res = await explainAIVisual({
        visual_spec: sampleSpec,
        dataset_id: datasetId,
        dashboard_id: dashboardId,
      });
      setExplainResult(res);
    } catch (err: any) {
      setExplainError(err?.message || "Failed to generate visual explanation");
    } finally {
      setExplainLoading(false);
    }
  };

  const handleApprove = (suggestion?: AIVisualizationSuggestion) => {
    if (suggestion && onApproveVisual) {
      onApproveVisual(suggestion);
      setApprovalFeedback("Approved! Suggestion applied to Dashboard.");
    } else {
      setApprovalFeedback("Approved! AI suggestion recorded.");
    }
  };

  const handleReject = () => {
    setQueryResult(null);
    setVisResult(null);
    setApprovalFeedback("Rejected AI suggestion.");
  };

  const isAIEnabled = aiStatus?.status === "enabled" || aiStatus?.enabled === true;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-cyan-400">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              KaanViz AI Analyst
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium">
                Phase 8 — Optional
              </span>
            </h2>
            <p className="text-sm text-slate-400">
              Natural-language data Q&A, prompt-to-visual generation, Explain Visual & structured insights.
            </p>
          </div>
        </div>

        {/* AI Status Badge */}
        <div>
          {aiStatus ? (
            isAIEnabled ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                AI Active ({aiStatus.provider})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                <AlertTriangle className="w-3.5 h-3.5" />
                AI Disabled / Unconfigured
              </span>
            )
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 animate-pulse">
              Checking AI Status...
            </span>
          )}
        </div>
      </div>

      {/* AI Provider Settings & Control Bar */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-6 text-slate-300">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-400 font-medium">Provider:</span>
            <span className="font-semibold text-slate-100 uppercase tracking-wide">
              {aiStatus?.provider || "none"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Model:</span>
            <span className="font-mono text-cyan-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              {aiStatus?.model || "none"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">AI Status:</span>
            <button
              onClick={handleToggleAI}
              disabled={toggleLoading}
              role="switch"
              aria-checked={isAIEnabled}
              aria-label="Toggle AI Analyst Enabled State"
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 ${
                isAIEnabled ? "bg-cyan-600" : "bg-slate-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isAIEnabled ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
            <span
              className={`px-2 py-0.5 rounded font-semibold text-[11px] ${
                isAIEnabled
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
              }`}
            >
              {isAIEnabled ? "Enabled" : "Disabled"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Connection:</span>
            <span
              className={`px-2 py-0.5 rounded font-semibold text-[11px] flex items-center gap-1 ${
                !isAIEnabled
                  ? "bg-slate-800 text-slate-400 border border-slate-700"
                  : testResult
                  ? testResult.success
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                  : aiStatus?.configured
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
              }`}
            >
              {!isAIEnabled
                ? "Disabled"
                : testResult
                ? testResult.success
                  ? "Connected"
                  : "Unavailable"
                : aiStatus?.configured
                ? "Connected"
                : "Not Connected"}
            </span>
          </div>
        </div>

        <button
          onClick={handleTestConnection}
          disabled={testLoading || !isAIEnabled}
          className="px-3.5 py-1.5 bg-cyan-950/80 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/30 font-medium rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          {testLoading ? "Testing Connection..." : "Test Connection"}
        </button>
      </div>

      {/* Test Connection Result Banner */}
      {testResult && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
            testResult.success
              ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
              : "bg-rose-950/40 border-rose-500/40 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {testResult.success ? <Check className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
            <span>
              {testResult.success ? "Connected: NVIDIA Nemotron is available." : `Unavailable: ${testResult.message}`} (Provider: {testResult.provider}, Model: {testResult.model})
            </span>
          </div>
          <button onClick={() => setTestResult(null)} className="text-slate-400 hover:text-slate-200">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Disabled Banner Notice */}
      {!isAIEnabled && aiStatus && (
        <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-lg text-amber-300 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <span className="font-semibold text-amber-200">AI Analyst is currently unavailable or disabled.</span>
            <p className="mt-1 text-xs text-amber-300/80">
              {aiStatus.message || "Set AI_ENABLED=true and configure AI_PROVIDER in environment variables."} Core KaanViz deterministic analytics, query engine, and interactive dashboard builder remain 100% operational.
            </p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab("query")}
          className={`flex items-center gap-2 px-4 py-2.5 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "query"
              ? "border-cyan-400 text-cyan-400 bg-cyan-500/5"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          Natural-Language Question
        </button>
        <button
          onClick={() => setActiveTab("visualize")}
          className={`flex items-center gap-2 px-4 py-2.5 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "visualize"
              ? "border-cyan-400 text-cyan-400 bg-cyan-500/5"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Prompt-to-Visual
        </button>
        <button
          onClick={() => setActiveTab("insights")}
          className={`flex items-center gap-2 px-4 py-2.5 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "insights"
              ? "border-cyan-400 text-cyan-400 bg-cyan-500/5"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Lightbulb className="w-4 h-4" />
          AI Insights
        </button>
        <button
          onClick={() => setActiveTab("explain")}
          className={`flex items-center gap-2 px-4 py-2.5 font-medium text-sm border-b-2 transition-colors ${
            activeTab === "explain"
              ? "border-cyan-400 text-cyan-400 bg-cyan-500/5"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Explain Visual
        </button>
      </div>

      {/* Approval Feedback Banner */}
      {approvalFeedback && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-lg text-emerald-300 text-sm flex items-center justify-between">
          <span>{approvalFeedback}</span>
          <button onClick={() => setApprovalFeedback(null)} className="text-emerald-400 hover:text-emerald-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TAB 1: Natural Language Question */}
      {activeTab === "query" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              Ask a question about your dataset
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="e.g. What is total revenue by category?"
                disabled={!isAIEnabled || queryLoading}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
              />
              <button
                onClick={() => handleAskQuestion()}
                disabled={!isAIEnabled || queryLoading || !question.trim()}
                className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium rounded-lg text-sm flex items-center gap-2 transition-colors"
              >
                {queryLoading ? "Analyzing..." : "Ask AI"}
              </button>
            </div>
            {/* Quick Example Chips */}
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-xs text-slate-500 self-center">Try:</span>
              {[
                "What is revenue by category?",
                "Show sales by region",
                "Total orders count",
              ].map((chip) => (
                <button
                  key={chip}
                  onClick={() => {
                    setQuestion(chip);
                    handleAskQuestion(chip);
                  }}
                  disabled={!isAIEnabled || queryLoading}
                  className="text-xs px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-md border border-slate-700 transition-colors disabled:opacity-50"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {queryError && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-lg text-rose-300 text-sm">
              {queryError}
            </div>
          )}

          {queryResult && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-100 text-base">Answer</h3>
                  <p className="text-sm text-slate-300 mt-1">{queryResult.summary_answer}</p>
                </div>
                {/* User Approval Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(queryResult.visual_suggestion)}
                    className="px-3 py-1.5 bg-emerald-600/80 hover:bg-emerald-500 text-white text-xs font-semibold rounded-md flex items-center gap-1 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    onClick={handleReject}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-md flex items-center gap-1 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>

              {/* Analytics Result Chart Preview */}
              {queryResult.analytics_result && queryResult.visual_suggestion && (
                <div className="border border-slate-800 rounded-lg p-4 bg-slate-900">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Validated Analytical Output ({queryResult.visual_suggestion.chart_type})
                  </h4>
                  <VisualizationChart
                    spec={{
                      chart_type: queryResult.visual_suggestion.chart_type,
                      title: queryResult.visual_suggestion.title,
                      dimensions: queryResult.query_intent.dimensions,
                      measures: queryResult.query_intent.measures,
                      kpi_measure: queryResult.visual_suggestion.kpi_measure,
                    } as any}
                    queryResponse={queryResult.analytics_result as any}
                  />

                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Prompt-to-Visual */}
      {activeTab === "visualize" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">
              Describe the chart you want to build
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={visPrompt}
                onChange={(e) => setVisPrompt(e.target.value)}
                placeholder="e.g. Show sales by category as a bar chart"
                disabled={!isAIEnabled || visLoading || !datasetId}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
              />
              <button
                onClick={handleGenerateVis}
                disabled={!isAIEnabled || visLoading || !visPrompt.trim() || !datasetId}
                className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium rounded-lg text-sm flex items-center gap-2 transition-colors"
              >
                {visLoading ? "Generating..." : "Generate Chart"}
              </button>
            </div>
          </div>

          {visError && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-lg text-rose-300 text-sm">
              {visError}
            </div>
          )}

          {visResult && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-semibold ${
                      visResult.is_valid
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    {visResult.is_valid ? "Validated KaanViz Spec" : "Spec Validation Issues"}
                  </span>
                  <span className="text-sm font-semibold text-slate-200">
                    {visResult.suggestion.title || "AI Suggested Visual"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(visResult.suggestion)}
                    className="px-3 py-1.5 bg-emerald-600/80 hover:bg-emerald-500 text-white text-xs font-semibold rounded-md flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve & Apply
                  </button>
                  <button
                    onClick={handleReject}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-md flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>

              {visResult.suggestion.explanation && (
                <p className="text-sm text-slate-300">{visResult.suggestion.explanation}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: AI Insights */}
      {activeTab === "insights" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-300">
              Generate structured AI insights grounded in deterministic analytics.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleGetInsights}
                disabled={!isAIEnabled || insightsLoading || !datasetId}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors"
              >
                {insightsLoading ? "Analyzing..." : "Generate Insights"}
              </button>
              {insights.length > 0 && (
                <button
                  onClick={() => setInsights([])}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg"
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>

          {insightsError && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-lg text-rose-300 text-sm">
              {insightsError}
            </div>
          )}

          {!insightsLoading && !insightsError && insights.length === 0 && (
            <div className="p-6 text-center border border-slate-800/80 rounded-xl bg-slate-950/50">
              <p className="text-sm text-slate-400">No notable insights found for this visual.</p>
            </div>
          )}

          {insights.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.map((ins, i) => (
                <div key={i} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-semibold border border-cyan-500/20 uppercase">
                      {ins.type.replace("_", " ")}
                    </span>
                    {ins.severity && (
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        ins.severity === "notable"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                          : "bg-slate-800 text-slate-400"
                      }`}>
                        {ins.severity}
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold text-slate-100 text-base">{ins.title}</h4>
                  <p className="text-sm text-slate-300">{ins.description || ins.summary}</p>
                  {ins.evidence && ins.evidence.length > 0 && (
                    <div className="space-y-1 pt-1 border-t border-slate-900">
                      <span className="text-xs font-semibold text-slate-400">Grounded Evidence:</span>
                      <ul className="list-disc list-inside text-xs text-slate-400 space-y-0.5">
                        {ins.evidence.map((ev, ei) => (
                          <li key={ei}>{ev}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Explain Visual */}
      {activeTab === "explain" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-300">
              Get a detailed structured explanation of what your visual shows, observed patterns, and limitations.
            </p>
            <button
              onClick={handleExplainVisual}
              disabled={!isAIEnabled || explainLoading || !datasetId}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors"
            >
              {explainLoading ? "Explaining..." : "Explain Selected Visual"}
            </button>
          </div>

          {explainError && (
            <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-lg text-rose-300 text-sm">
              {explainError}
            </div>
          )}

          {explainResult && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-lg font-bold text-slate-100">{explainResult.title}</h3>
                <button
                  onClick={() => setExplainResult(null)}
                  className="px-3 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition-colors"
                  aria-label="Dismiss Explanation"
                >
                  Dismiss Explanation
                </button>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Summary</h4>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {explainResult.summary || explainResult.what_visual_shows}
                </p>
              </div>

              {((explainResult.observations && explainResult.observations.length > 0) ||
                (explainResult.observed_patterns && explainResult.observed_patterns.length > 0)) && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Key Observations</h4>
                  <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                    {(explainResult.observations || explainResult.observed_patterns || []).slice(0, 5).map((obs, idx) => (
                      <li key={idx} className="leading-normal">{obs}</li>
                    ))}
                  </ul>
                </div>
              )}

              {explainResult.limitations_and_context && explainResult.limitations_and_context.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Context & Bounds</h4>
                  <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
                    {explainResult.limitations_and_context.map((lm, li) => (
                      <li key={li}>{lm}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
