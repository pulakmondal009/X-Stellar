"use client";

import { useTrip as useTripContext } from "@/context/TripContext";

/**
 * Re-exports all trip context values via a convenience hook.
 */
export function useTrip() {
  return useTripContext();
}
