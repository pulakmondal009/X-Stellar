"use client";

import { useState, useEffect } from "react";

/**
 * Returns true once the component has hydrated on the client.
 * Prevents hydration mismatches for components that depend on
 * browser-only APIs (localStorage, window, etc.).
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}
