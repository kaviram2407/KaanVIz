"use client";

import Link from "next/link";
import { Activity, ArrowUpRight } from "lucide-react";
import { HealthIndicator } from "./health-indicator";

export function Header() {
  return (
    <header className="border-b border-[var(--kaan-ink)] bg-[var(--kaan-paper)] px-5 py-3">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/"
          className="group flex items-center gap-3"
        >
          <div className="flex h-9 w-9 items-center justify-center border border-[var(--kaan-ink)] bg-[var(--kaan-green)] text-[var(--kaan-paper)] shadow-[3px_3px_0_var(--kaan-ink)]">
            <span className="text-sm font-black">KV</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-[-0.04em]">
                KaanViz
              </span>

              <span className="retro-stamp hidden sm:inline-block">
                DATA / 01
              </span>
            </div>

            <p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-[var(--kaan-green)]">
              See Beyond Data
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 border border-[var(--kaan-ink)] bg-[var(--kaan-yellow)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider sm:flex">
            <Activity className="h-3.5 w-3.5" />
            System online
          </div>

          <HealthIndicator />

          <Link
            href="/settings"
            className="flex items-center gap-1 border border-[var(--kaan-ink)] bg-[var(--kaan-paper)] px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-transform hover:-translate-y-0.5"
          >
            Settings
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </header>
  );
}