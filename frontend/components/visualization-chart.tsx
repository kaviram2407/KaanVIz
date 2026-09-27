"use client";

import React from "react";
import ReactECharts from "echarts-for-react";
import { AnalyticsQueryResponse, VisualizationSpec } from "@/lib/api-client";
import { AlertCircle, RefreshCw, BarChart3, Hash } from "lucide-react";

interface VisualizationChartProps {
  spec: VisualizationSpec;
  queryResponse: AnalyticsQueryResponse | null;
  isLoading?: boolean;
  error?: string | null;
}

const PALETTE = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#3b82f6", "#14b8a6"];

export function VisualizationChart({
  spec,
  queryResponse,
  isLoading,
  error,
}: VisualizationChartProps) {
  if (isLoading) {
    return (
      <div className="h-80 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-400 gap-3">
        <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
        <span className="text-sm font-medium">Executing analytics aggregation...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-80 bg-rose-950/40 border border-rose-500/40 rounded-xl p-6 flex items-center justify-center">
        <div className="flex items-start gap-3 max-w-lg text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
          <div>
            <span className="font-semibold block mb-1">Visualization Query Error</span>
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!queryResponse || !queryResponse.data || queryResponse.data.length === 0) {
    return (
      <div className="h-80 bg-slate-900/40 border border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-500 gap-2">
        <BarChart3 className="w-8 h-8 text-slate-600" />
        <span className="text-sm font-medium text-slate-400">No data returned for this query</span>
        <span className="text-xs text-slate-500">Configure dimensions, measures, and click Run Query</span>
      </div>
    );
  }

  const { data, columns } = queryResponse;
  const chartType = spec.chart_type.toLowerCase();

  // Identify dimension and measure column names from metadata
  const dimCols = columns.filter((c) => c.role === "dimension").map((c) => c.name);
  const measureCols = columns.filter((c) => c.role === "measure").map((c) => c.name);

  const primaryDim = dimCols[0] || (columns[0] ? columns[0].name : "");
  const primaryMeasure = measureCols[0] || (columns[1] ? columns[1].name : "");

  // 1. KPI Metric Visual
  if (chartType === "kpi") {
    const kpiVal = data[0] && primaryMeasure in data[0] ? data[0][primaryMeasure] : 0;
    const formattedVal =
      typeof kpiVal === "number"
        ? kpiVal % 1 === 0
          ? kpiVal.toLocaleString()
          : kpiVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : String(kpiVal ?? "N/A");

    return (
      <div className="h-80 bg-gradient-to-br from-indigo-950/50 via-slate-900 to-slate-950 border border-indigo-500/30 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-3 shadow-xl">
        <div className="p-3 bg-indigo-600/20 border border-indigo-500/40 rounded-full text-indigo-400">
          <Hash className="w-8 h-8" />
        </div>
        <div>
          <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider block mb-1">
            {spec.title || primaryMeasure || "KPI Metric"}
          </span>
          <div className="text-4xl sm:text-5xl font-extrabold text-slate-100 font-mono tracking-tight">
            {formattedVal}
          </div>
        </div>
      </div>
    );
  }

  // 2. Data Table Visual
  if (chartType === "table") {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
        {spec.title && <h4 className="text-sm font-bold text-slate-200">{spec.title}</h4>}
        <div className="overflow-x-auto max-h-80 border border-slate-800 rounded-lg">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950 text-slate-300 font-semibold sticky top-0 border-b border-slate-800">
              <tr>
                <th className="p-2.5 border-r border-slate-800 text-slate-500 font-mono w-10 text-center">#</th>
                {columns.map((col) => (
                  <th key={col.name} className="p-2.5 border-r border-slate-800 font-semibold">
                    <span className="text-slate-200 block">{col.name}</span>
                    <span className="text-[10px] text-indigo-400 uppercase font-mono block">
                      {col.aggregation ? `${col.aggregation}` : col.physical_type}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300 bg-slate-900/40">
              {data.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-2 border-r border-slate-800 text-slate-500 text-center text-[11px]">
                    {rIdx + 1}
                  </td>
                  {columns.map((col) => {
                    const val = row[col.name];
                    return (
                      <td key={col.name} className="p-2 border-r border-slate-800 whitespace-nowrap text-slate-200">
                        {val === null || val === undefined ? (
                          <span className="text-slate-500 italic">NULL</span>
                        ) : typeof val === "number" ? (
                          val.toLocaleString()
                        ) : (
                          String(val)
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // 3. ECharts Options Construction for Bar, Line, Area, Pie/Donut, Scatter
  const categories = data.map((d) => String(d[primaryDim] ?? "N/A"));

  let option: any = {
    backgroundColor: "transparent",
    color: PALETTE,
    title: {
      text: spec.title || `${primaryMeasure} by ${primaryDim}`,
      left: "center",
      textStyle: { color: "#e2e8f0", fontSize: 14, fontWeight: "bold" },
    },
    tooltip: {
      trigger: chartType === "pie" || chartType === "donut" ? "item" : "axis",
      backgroundColor: "#0f172a",
      borderColor: "#334155",
      textStyle: { color: "#f8fafc", fontSize: 12 },
    },
    legend: {
      bottom: 0,
      textStyle: { color: "#94a3b8", fontSize: 11 },
    },
    grid: {
      left: "4%",
      right: "4%",
      bottom: "12%",
      top: "15%",
      containLabel: true,
    },
  };

  if (chartType === "pie" || chartType === "donut") {
    const pieData = data.map((d) => ({
      name: String(d[primaryDim] ?? "N/A"),
      value: d[primaryMeasure] || 0,
    }));

    option.series = [
      {
        name: primaryMeasure,
        type: "pie",
        radius: chartType === "donut" ? ["40%", "70%"] : "70%",
        center: ["50%", "50%"],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 6,
          borderColor: "#090d16",
          borderWidth: 2,
        },
        label: {
          show: true,
          color: "#cbd5e1",
          fontSize: 11,
        },
        data: pieData,
      },
    ];
  } else if (chartType === "scatter") {
    const secMeasure = measureCols[1] || primaryMeasure;
    const scatterData = data.map((d) => [d[primaryMeasure] || 0, d[secMeasure] || 0]);

    option.xAxis = {
      type: "value",
      name: primaryMeasure,
      nameTextStyle: { color: "#94a3b8" },
      axisLine: { lineStyle: { color: "#334155" } },
      splitLine: { lineStyle: { color: "#1e293b" } },
      axisLabel: { color: "#94a3b8" },
    };
    option.yAxis = {
      type: "value",
      name: secMeasure,
      nameTextStyle: { color: "#94a3b8" },
      axisLine: { lineStyle: { color: "#334155" } },
      splitLine: { lineStyle: { color: "#1e293b" } },
      axisLabel: { color: "#94a3b8" },
    };
    option.series = [
      {
        symbolSize: 12,
        data: scatterData,
        type: "scatter",
        itemStyle: { color: "#6366f1" },
      },
    ];
  } else {
    // Bar, Line, Area
    option.xAxis = {
      type: "category",
      data: categories,
      axisLine: { lineStyle: { color: "#334155" } },
      axisLabel: { color: "#94a3b8", interval: 0, rotate: categories.length > 8 ? 30 : 0 },
    };
    option.yAxis = {
      type: "value",
      axisLine: { lineStyle: { color: "#334155" } },
      splitLine: { lineStyle: { color: "#1e293b" } },
      axisLabel: { color: "#94a3b8" },
    };

    const seriesList = (measureCols.length > 0 ? measureCols : [primaryMeasure]).map((mCol, idx) => {
      const sData = data.map((d) => d[mCol] || 0);
      const isArea = chartType === "area";
      const isLine = chartType === "line" || isArea;

      return {
        name: mCol,
        type: isLine ? "line" : "bar",
        smooth: true,
        data: sData,
        areaStyle: isArea ? { opacity: 0.3 } : undefined,
        itemStyle: {
          borderRadius: chartType === "bar" ? [4, 4, 0, 0] : 0,
        },
      };
    });

    option.series = seriesList;
  }

  return (
    <div className="h-80 bg-slate-900/80 border border-slate-800 rounded-xl p-4 relative flex flex-col justify-center">
      <ReactECharts
        option={option}
        style={{ height: "100%", width: "100%" }}
        theme="dark"
        opts={{ renderer: "canvas" }}
      />
    </div>
  );
}
