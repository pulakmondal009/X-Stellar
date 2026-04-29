"use client";

import { useWalletContext } from "@/context/WalletContext";

/**
 * Re-exports all wallet context values via a convenience hook.
 */
export function useWallet() {
  return useWalletContext();
}
