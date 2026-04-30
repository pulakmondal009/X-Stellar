"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { WalletContextType } from "@/types/wallet";
import { LS_PUBLIC_KEY } from "@/lib/utils/constants";
import { getXLMBalance } from "@/lib/stellar/getBalance";

const WalletContext = createContext<WalletContextType | null>(null);

function syncPublicKeyCookie(publicKey: string | null) {
  if (typeof document === "undefined") return;

  if (publicKey) {
    document.cookie = `stellar_star_public_key=${publicKey}; path=/; max-age=604800; SameSite=Lax`;
  } else {
    document.cookie = "stellar_star_public_key=; path=/; max-age=0";
  }
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);

  const isConnected = !!publicKey;

  // ─── Fetch Balance ───
  const fetchBalance = useCallback(
    async (pk: string, silent = false) => {
      if (!pk) return;
      if (!silent) setIsLoadingBalance(true);
      try {
        const bal = await getXLMBalance(pk);
        setBalance(bal);
      } catch (err) {
        console.error("Failed to fetch balance:", err);
        if (!silent) setBalance("0.00");
      } finally {
        if (!silent) setIsLoadingBalance(false);
      }
    },
    []
  );

  // ─── Hydrate Network ───
  const hydrateNetwork = useCallback(async () => {
    try {
      const { getFreighterNetwork } = await import("@/lib/freighter");
      const net = await getFreighterNetwork();
      setNetwork(net);
    } catch {
      setNetwork("TESTNET");
    }
  }, []);

  // ─── Auto-Reconnect on Mount ───
  useEffect(() => {
    async function autoReconnect() {
      try {
        if (typeof window === "undefined") return;

        const savedKey = localStorage.getItem(LS_PUBLIC_KEY);
        if (savedKey) {
          const { isFreighterInstalled } = await import("@/lib/freighter");
          const installed = await isFreighterInstalled();
          if (installed) {
            setPublicKey(savedKey);
            setSelectedWalletId("freighter");
            syncPublicKeyCookie(savedKey);
            await Promise.all([fetchBalance(savedKey, true), hydrateNetwork()]);
          } else {
            // Freighter was uninstalled — clear saved state
            localStorage.removeItem(LS_PUBLIC_KEY);
          }
        }
      } catch (err) {
        console.error("Auto-reconnect failed:", err);
      } finally {
        setIsHydrated(true);
      }
    }

    autoReconnect();
  }, [fetchBalance, hydrateNetwork]);

  // ─── Connect ───
  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const { isFreighterInstalled, requestFreighterAccess } = await import(
        "@/lib/freighter"
      );
      const installed = await isFreighterInstalled();
      if (!installed) {
        setError("Freighter wallet is not installed");
        // Info: direct user to install Freighter
        console.info(
          "Install Freighter wallet from https://www.freighter.app/"
        );
        return;
      }

      const pk = await requestFreighterAccess();
      if (!pk) {
        setError("Failed to get public key from Freighter");
        return;
      }

      setPublicKey(pk);
      setSelectedWalletId("freighter");
      syncPublicKeyCookie(pk);
      if (typeof window !== "undefined") {
        localStorage.setItem(LS_PUBLIC_KEY, pk);
      }

      await Promise.all([fetchBalance(pk), hydrateNetwork()]);

      console.info("Wallet connected successfully");
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to connect wallet");
      setError(message);
      console.error("Wallet connection error:", message);
    } finally {
      setIsConnecting(false);
    }
  }, [fetchBalance, hydrateNetwork]);

  // ─── Disconnect ───
  const disconnect = useCallback(() => {
    setPublicKey(null);
    setBalance(null);
    setNetwork(null);
    setSelectedWalletId(null);
    setError(null);
    syncPublicKeyCookie(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(LS_PUBLIC_KEY);
    }
  }, []);

  // ─── Refresh Balance ───
  const refreshBalance = useCallback(async () => {
    if (publicKey) {
      await fetchBalance(publicKey);
    }
  }, [publicKey, fetchBalance]);

  const value: WalletContextType = {
    publicKey,
    balance,
    network,
    isConnected,
    isConnecting,
    isLoadingBalance,
    isHydrated,
    error,
    selectedWalletId,
    connect,
    disconnect,
    refreshBalance,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWalletContext(): WalletContextType {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWalletContext must be used within a WalletProvider");
  }
  return context;
}
