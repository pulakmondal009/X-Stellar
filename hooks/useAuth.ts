"use client";

import { useAuth as useAuthContext } from "@/context/AuthContext";

/**
 * Re-exports all auth context values via a convenience hook.
 */
export function useAuth() {
  return useAuthContext();
}
