"use client";

import Link from "next/link";
import { HealthIndicator } from "./health-indicator";
import { LineChart, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function Header() {
  return (
    <header className="border-b border-border bg-card px-4 py-3 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-3 group">
          <img
            src="/logo.png"
            alt="KaanViz Logo"
            className="h-8 w-auto object-contain rounded-md group-hover:opacity-90 transition-opacity"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight">KaanViz</span>
              <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal">
                v0.1.0
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground leading-none">
              See Beyond Data
            </p>
          </div>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <HealthIndicator />
      </div>
    </header>
  );
}
