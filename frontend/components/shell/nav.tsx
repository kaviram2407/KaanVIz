"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Database,
  Wrench,
  GitFork,
  BarChart3,
  LayoutDashboard,
  Bot,
  Lightbulb,
  Settings,
  HelpCircle,
  Info,
  Sparkles,
} from "lucide-react";

export const PRIMARY_NAV = [
  { title: "Home", href: "/", icon: Home },
  { title: "Data", href: "/data", icon: Database },
  { title: "Prepare", href: "/prepare", icon: Wrench },
  { title: "Model", href: "/model", icon: GitFork },
  { title: "Canvas", href: "/visualize", icon: BarChart3 },
  { title: "Dashboards", href: "/dashboards", icon: LayoutDashboard },
  { title: "AI Analyst", href: "/ai-analyst", icon: Bot },
  { title: "Insights", href: "/insights", icon: Lightbulb },
];

export const SECONDARY_NAV = [
  { title: "Settings", href: "/settings", icon: Settings },
  { title: "Help", href: "/help", icon: HelpCircle },
  { title: "About", href: "/about", icon: Info },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <aside className="flex min-h-[calc(100vh-65px)] w-[220px] shrink-0 flex-col border-r border-[var(--kaan-ink)] bg-[var(--kaan-cream)]">
      <div className="border-b border-[var(--kaan-ink)] p-4">
        <div className="retro-label text-[var(--kaan-green)]">
          Workspace
        </div>

        <div className="mt-2 flex items-center justify-between">
          <span className="text-sm font-black">MY WORKSPACE</span>

          <Sparkles className="h-4 w-4 text-[var(--kaan-coral)]" />
        </div>
      </div>

      <div className="flex-1 p-3">
        <div className="mb-2 px-2 text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
          Navigate
        </div>

        <div className="space-y-1">
          {PRIMARY_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 border px-3 py-2.5 text-xs font-bold uppercase tracking-wide transition-all",
                  isActive
                    ? "translate-x-[3px] border-[var(--kaan-ink)] bg-[var(--kaan-green)] text-[var(--kaan-paper)] shadow-[3px_3px_0_var(--kaan-ink)]"
                    : "border-transparent text-[var(--kaan-ink)] hover:border-[var(--kaan-ink)] hover:bg-[var(--kaan-paper)]"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />

                <span>{item.title}</span>
                {item.title === "Canvas" && <span className="sr-only">Visualize</span>}

                {item.title === "AI Analyst" && (
                  <span className="ml-auto text-[var(--kaan-coral)]">✦</span>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="border-t border-[var(--kaan-ink)] p-3">
        <div className="mb-2 px-2 text-[9px] font-bold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
          System
        </div>

        <div className="space-y-1">
          {SECONDARY_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 border px-3 py-2 text-xs font-bold uppercase tracking-wide transition-colors",
                  isActive
                    ? "border-[var(--kaan-ink)] bg-[var(--kaan-yellow)]"
                    : "border-transparent hover:border-[var(--kaan-ink)] hover:bg-[var(--kaan-paper)]"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </div>

        <div className="mt-4 border-t border-dashed border-[var(--kaan-ink)] pt-3 text-[9px] leading-relaxed text-[var(--muted-foreground)]">
          KAANVIZ / 0.1
          <br />
          ANALYTICAL WORKSPACE
        </div>
      </div>
    </aside>
  );
}