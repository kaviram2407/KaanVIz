import React from "react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card px-4 py-3 text-xs text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2">
      <div>
        <span>KaanViz Analytics Engine &copy; 2026. All rights reserved.</span>
      </div>
      <div className="flex items-center gap-4">
        <span>AI is an enhancement, not a dependency.</span>
        <span>Raw data remains immutable.</span>
      </div>
    </footer>
  );
}
