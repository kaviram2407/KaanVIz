"use client";

import * as React from "react";

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  React.useEffect(() => {
    // Default to dark or system theme
    document.documentElement.classList.add("dark");
  }, []);

  return <>{children}</>;
}
