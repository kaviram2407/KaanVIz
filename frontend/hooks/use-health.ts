"use client";

import { useEffect, useState } from "react";
import { fetchBackendHealth, HealthResponse } from "@/lib/api-client";

export function useHealth() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function check() {
      const data = await fetchBackendHealth();
      if (mounted) {
        setHealth(data);
        setLoading(false);
      }
    }
    check();
    const interval = setInterval(check, 15000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return { health, loading };
}
