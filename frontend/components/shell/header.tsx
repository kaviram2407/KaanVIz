"use client";

import Link from "next/link";
import { HealthIndicator } from "./health-indicator";
import { LineChart, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function Header() {
  return (
    <header className="border-b border-border bg-card px-4 py-3 flex items-center justify-between shadow-xs">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold group-hover:opacity-90 transition-opacity">
            <LineChart className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight">KaanViz</span>
              <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal">
                v0.1.0 Setup
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
