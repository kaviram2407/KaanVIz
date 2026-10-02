"use client";

import React, { useState, useEffect } from "react";
import {
  Lightbulb,
  Sparkles,
  TrendingUp,
  Users,
  Package,
  Globe,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Database,
  Layers,
  BarChart2,
} from "lucide-react";
import Link from "next/link";
import { fetchWorkspaceDatasets, DatasetItem } from "@/lib/api-client";
import { fetchAIInsights, AIInsight } from "@/lib/ai-api";

const MOCK_INSIGHTS: Record<string, AIInsight[]> = {
  executive: [
    {
      type: "growth",
      title: "Q3 Revenue Expansion",
      summary: "Total sales volume grew by 18.4% compared to Q2, driven primarily by enterprise software subscriptions.",
      severity: "notable",
      evidence: ["Q3 Gross Revenue: $482,500", "Q2 Gross Revenue: $407,500", "Growth Delta: +$75,000"],
      related_fields: ["quarter", "gross_revenue", "segment"],
    },
    {
      type: "retention",
      title: "Customer Retention Baseline",
      summary: "Repeat customer purchasing frequency increased from 2.1 to 3.4 orders per quarter.",
      severity: "info",
      evidence: ["Average Orders / Customer: 3.4", "Retention Rate: 84.2%"],
      related_fields: ["customer_id", "order_id", "order_date"],
    },
  ],
  growth: [
    {
      type: "channel",
      title: "Direct Sales Channel Outperformance",
      summary: "Direct channel conversion rate is 3.2x higher than partner referrals with 24% lower acquisition cost.",
      severity: "notable",
      evidence: ["Direct Conversion: 14.8%", "Partner Conversion: 4.6%", "CAC Delta: -$120"],
      related_fields: ["channel", "conversion_rate", "acquisition_cost"],
    },
  ],
  customers: [
    {
      type: "segmentation",
      title: "High-Margin Mid-Market Segment",
      summary: "Mid-market accounts (100-500 employees) yield the highest net margin per account at 42.1%.",
      severity: "info",
      evidence: ["Mid-Market Net Margin: 42.1%", "Enterprise Net Margin: 31.5%"],
      related_fields: ["company_size", "net_margin", "annual_revenue"],
    },
  ],
  products: [
    {
      type: "product",
      title: "Analytics Add-On Attachment",
      summary: "Clients adopting the AI Analyst add-on exhibit 94% 12-month retention versus 71% baseline.",
      severity: "notable",
      evidence: ["Add-On Retention: 94%", "Baseline Retention: 71%"],
      related_fields: ["addon_type", "retention_months", "churn_flag"],
    },
  ],
  regional: [
    {
      type: "region",
      title: "North America & Europe Demand Lead",
      summary: "North America accounts for 54% of volume, while EMEA demonstrates fastest YoY acceleration at +29%.",
      severity: "info",
      evidence: ["NA Share: 54.2%", "EMEA Growth: +29.1% YoY"],
      related_fields: ["region", "revenue_usd", "yoy_growth"],
    },
  ],
  recommendations: [
    {
      type: "action",
      title: "Reallocate Marketing Budget to High-Converting Channels",
      summary: "Shift 15% of underperforming paid search spend toward direct account-based outreach campaigns.",
      severity: "notable",
      evidence: ["Projected Annual Lift: +$45,000", "Estimated ROI: 4.1x"],
      related_fields: ["channel", "budget_allocated", "roi"],
    },
  ],
};

export default function InsightsPage() {
  const [datasets, setDatasets] = useState<DatasetItem[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [liveInsights, setLiveInsights] = useState<AIInsight[] | null>(null);

  useEffect(() => {
    loadDatasets();
  }, []);

  async function loadDatasets() {
    try {
      const items = await fetchWorkspaceDatasets("default-workspace-id");
      if (Array.isArray(items) && items.length > 0) {
        setDatasets(items);
        setSelectedDatasetId(items[0].id);
        fetchDatasetInsights(items[0].id);
      }
    } catch (err) {
      console.warn("Using default insights preset.");
    }
  }

  async function fetchDatasetInsights(datasetId: string) {
    if (!datasetId) return;
    setLoading(true);
    try {
      const res = await fetchAIInsights({ dataset_id: datasetId });
      if (res && res.insights && res.insights.length > 0) {
        setLiveInsights(res.insights);
      } else {
        setLiveInsights(null);
      }
    } catch (err) {
      setLiveInsights(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-16">
      {/* Header */}
      <div className="border-b border-[var(--kaan-ink)] pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="retro-label text-[var(--kaan-green)] mb-2">
              Intelligence / Executive Findings
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Workspace Insights Engine
            </h1>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">
              Grounded, structured analytical findings discovered from your workspace datasets.
            </p>
          </div>

          {datasets.length > 0 && (
            <div className="flex items-center gap-3">
              <select
                value={selectedDatasetId}
                onChange={(e) => {
                  setSelectedDatasetId(e.target.value);
                  fetchDatasetInsights(e.target.value);
                }}
                className="h-9 rounded border border-[var(--kaan-ink)] bg-[var(--kaan-paper)] px-3 text-xs font-bold shadow-[2px_2px_0_var(--kaan-ink)]"
              >
                {datasets.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.row_count || 0} rows)
                  </option>
                ))}
              </select>

              <button
                onClick={() => fetchDatasetInsights(selectedDatasetId)}
                disabled={loading}
                className="flex h-9 items-center gap-2 border border-[var(--kaan-ink)] bg-[var(--kaan-yellow)] px-3 text-xs font-bold uppercase tracking-wider shadow-[2px_2px_0_var(--kaan-ink)] hover:bg-[var(--kaan-paper)] disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                Analyze
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2 border-b border-[var(--kaan-ink)] pb-4">
        {[
          { id: "all", label: "All Findings", icon: Layers },
          { id: "executive", label: "Executive Summary", icon: TrendingUp },
          { id: "growth", label: "Growth Drivers", icon: Sparkles },
          { id: "customers", label: "Customer Insights", icon: Users },
          { id: "products", label: "Product Performance", icon: Package },
          { id: "regional", label: "Regional Analysis", icon: Globe },
          { id: "recommendations", label: "Recommendations", icon: CheckCircle2 },
        ].map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 border px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition-all ${
                isActive
                  ? "border-[var(--kaan-ink)] bg-[var(--kaan-green)] text-[var(--kaan-paper)] shadow-[2px_2px_0_var(--kaan-ink)]"
                  : "border-[var(--kaan-ink)] bg-[var(--kaan-paper)] text-[var(--kaan-ink)] hover:bg-[var(--kaan-yellow)]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Live AI Insights if available */}
      {liveInsights && liveInsights.length > 0 && (
        <div className="space-y-4">
          <div className="retro-label text-[var(--kaan-coral)]">
            ✦ AI Discovered Findings for Dataset
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {liveInsights.map((insight, idx) => (
              <InsightCard key={idx} insight={insight} category="live" />
            ))}
          </div>
        </div>
      )}

      {/* Structured Category Findings */}
      {(activeCategory === "all" || activeCategory === "executive") && (
        <InsightSection title="Executive Summary" icon={TrendingUp} insights={MOCK_INSIGHTS.executive} />
      )}

      {(activeCategory === "all" || activeCategory === "growth") && (
        <InsightSection title="Growth Drivers" icon={Sparkles} insights={MOCK_INSIGHTS.growth} />
      )}

      {(activeCategory === "all" || activeCategory === "customers") && (
        <InsightSection title="Customer Insights" icon={Users} insights={MOCK_INSIGHTS.customers} />
      )}

      {(activeCategory === "all" || activeCategory === "products") && (
        <InsightSection title="Product Performance" icon={Package} insights={MOCK_INSIGHTS.products} />
      )}

      {(activeCategory === "all" || activeCategory === "regional") && (
        <InsightSection title="Regional Analysis" icon={Globe} insights={MOCK_INSIGHTS.regional} />
      )}

      {(activeCategory === "all" || activeCategory === "recommendations") && (
        <InsightSection title="Recommendations" icon={CheckCircle2} insights={MOCK_INSIGHTS.recommendations} />
      )}
    </div>
  );
}

function InsightSection({
  title,
  icon: Icon,
  insights,
}: {
  title: string;
  icon: React.ElementType;
  insights: AIInsight[];
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 border-b border-[var(--kaan-ink)] pb-2">
        <Icon className="h-4 w-4 text-[var(--kaan-green)]" />
        <h2 className="text-sm font-black uppercase tracking-wider">{title}</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {insights.map((insight, idx) => (
          <InsightCard key={idx} insight={insight} category={title} />
        ))}
      </div>
    </div>
  );
}

function InsightCard({ insight, category }: { insight: AIInsight; category: string }) {
  const isNotable = insight.severity === "notable";

  return (
    <div className="retro-panel flex flex-col justify-between p-5 transition-transform hover:-translate-y-0.5">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="retro-label text-[var(--kaan-green)] truncate">
            {insight.type}
          </span>
          <span
            className={`border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
              isNotable
                ? "border-[var(--kaan-ink)] bg-[var(--kaan-coral)] text-[var(--kaan-paper)]"
                : "border-[var(--kaan-ink)] bg-[var(--kaan-yellow)] text-[var(--kaan-ink)]"
            }`}
          >
            {insight.severity || "info"}
          </span>
        </div>

        <h3 className="text-base font-black tracking-tight">{insight.title}</h3>
        <p className="mt-2 text-xs leading-relaxed text-[var(--muted-foreground)]">
          {insight.summary || insight.description}
        </p>

        {insight.evidence && insight.evidence.length > 0 && (
          <div className="mt-4 space-y-1.5 border-t border-dashed border-[var(--kaan-ink)] pt-3">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--kaan-ink)]">
              Supporting Evidence:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {insight.evidence.map((ev, i) => (
                <span
                  key={i}
                  className="border border-[var(--kaan-ink)] bg-[var(--kaan-cream)] px-2 py-0.5 text-[10px] font-mono font-semibold"
                >
                  {ev}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[var(--kaan-ink)] pt-3 text-[9px]">
        <div className="flex gap-1.5 font-mono text-[var(--muted-foreground)]">
          {insight.related_fields.map((f) => (
            <span key={f}>#{f}</span>
          ))}
        </div>

        <Link
          href="/visualize"
          className="flex items-center gap-1 font-bold uppercase tracking-wider text-[var(--kaan-green)] hover:underline"
        >
          View Visual
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
