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
  Settings,
  HelpCircle,
  Info,
} from "lucide-react";

export const PRIMARY_NAV = [
  { title: "Home", href: "/", icon: Home },
  { title: "Data", href: "/data", icon: Database },
  { title: "Prepare", href: "/prepare", icon: Wrench },
  { title: "Model", href: "/model", icon: GitFork },
  { title: "Visualize", href: "/visualize", icon: BarChart3 },
  { title: "Dashboards", href: "/dashboards", icon: LayoutDashboard },
  { title: "AI Analyst", href: "/ai-analyst", icon: Bot, badge: "Optional" },
];

export const SECONDARY_NAV = [
  { title: "Settings", href: "/settings", icon: Settings },
  { title: "Help", href: "/help", icon: HelpCircle },
  { title: "About", href: "/about", icon: Info },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center justify-between border-b border-border bg-card px-4 py-2 text-sm font-medium">
      <div className="flex items-center space-x-1 overflow-x-auto py-1">
        {PRIMARY_NAV.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-1.5 transition-colors hover:bg-accent hover:text-accent-foreground text-muted-foreground whitespace-nowrap",
                isActive && "bg-accent text-accent-foreground font-semibold"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.title}</span>
              {item.badge && (
                <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="hidden lg:flex items-center space-x-1">
        {SECONDARY_NAV.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                isActive && "bg-accent text-accent-foreground font-semibold"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
