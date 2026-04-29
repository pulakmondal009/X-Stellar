"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useWalletContext } from "./WalletContext";
import { db, isSupabaseConfigured } from "@/lib/supabase/client";
import { LS_USER } from "@/lib/utils/constants";

type UserRow = {
  id: string;
  wallet_address: string;
  display_name: string;
  created_at: string;
  updated_at: string;
  last_login_at: string;
};

export interface User {
  id: string;
  walletAddress: string;
  displayName: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signUp: (displayName: string) => Promise<User | null>;
  signIn: () => Promise<User | null>;
  signOut: () => void;
  updateProfile: (updates: Partial<Pick<User, "displayName">>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function cacheUser(user: User) {
  try {
    localStorage.setItem(LS_USER, JSON.stringify(user));
  } catch {}
}

function getCachedUser(): User | null {
  try {
    const raw = localStorage.getItem(LS_USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearUserCache() {
  try {
    localStorage.removeItem(LS_USER);
  } catch {}
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { publicKey, isConnected, isHydrated } = useWalletContext();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && isConnected;

  // ─── Restore cached user on mount ───
  useEffect(() => {
    const cached = getCachedUser();
    if (cached) setUser(cached);
  }, []);

  // ─── Watch wallet connection ───
  useEffect(() => {
    if (!isHydrated) return;

    async function loadUser() {
      if (!publicKey) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        if (isSupabaseConfigured() && db) {
          const { data, error } = await db
            .from("users")
            .select("*")
            .eq("wallet_address", publicKey)
            .single() as { data: UserRow | null; error: any };

          if (data && !error) {
            const u: User = {
              id: data.id,
              walletAddress: data.wallet_address,
              displayName: data.display_name,
              createdAt: data.created_at,
              updatedAt: data.updated_at,
              lastLoginAt: data.last_login_at,
            };
            setUser(u);
            cacheUser(u);
          } else {
            // User not found in DB — will need to sign up
            setUser(null);
          }
        } else {
          // Supabase not configured — create local demo user
          const demoUser: User = {
            id: `demo-${publicKey.slice(0, 8)}`,
            walletAddress: publicKey,
            displayName: `User ${publicKey.slice(0, 6)}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
          };
          setUser(demoUser);
          cacheUser(demoUser);
        }
      } catch (err) {
        console.error("Failed to load user:", err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadUser();
  }, [publicKey, isHydrated]);

  // ─── Sign Up ───
  const signUp = useCallback(
    async (displayName: string): Promise<User | null> => {
      if (!publicKey) return null;

      if (isSupabaseConfigured() && db) {
        const { data, error } = await db
          .from("users")
          .insert({
            id: crypto.randomUUID(),
            wallet_address: publicKey,
            display_name: displayName,
            last_login_at: new Date().toISOString(),
          })
          .select()
          .single() as { data: UserRow | null; error: any };

        if (error) throw new Error(error.message);
        if (!data) return null;

        const u: User = {
          id: data.id,
          walletAddress: data.wallet_address,
          displayName: data.display_name,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          lastLoginAt: data.last_login_at,
        };
        setUser(u);
        cacheUser(u);
        return u;
      }

      // Local fallback
      const u: User = {
        id: crypto.randomUUID(),
        walletAddress: publicKey,
        displayName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      setUser(u);
      cacheUser(u);
      return u;
    },
    [publicKey]
  );

  // ─── Sign In ───
  const signIn = useCallback(async (): Promise<User | null> => {
    if (!publicKey) return null;

    if (isSupabaseConfigured() && db) {
      const { data, error } = await db
        .from("users")
        .select("*")
        .eq("wallet_address", publicKey)
        .single() as { data: UserRow | null; error: any };

      if (error || !data) return null;

      // Update last login
      await db
        .from("users")
        .update({ last_login_at: new Date().toISOString() })
        .eq("id", data.id);

      const u: User = {
        id: data.id,
        walletAddress: data.wallet_address,
        displayName: data.display_name,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        lastLoginAt: new Date().toISOString(),
      };
      setUser(u);
      cacheUser(u);
      return u;
    }

    return user;
  }, [publicKey, user]);

  // ─── Sign Out ───
  const signOut = useCallback(() => {
    setUser(null);
    clearUserCache();
  }, []);

  // ─── Update Profile ───
  const updateProfile = useCallback(
    async (updates: Partial<Pick<User, "displayName">>) => {
      if (!user || !publicKey) return;

      if (isSupabaseConfigured() && db) {
        const dbUpdates: Record<string, any> = {};
        if (updates.displayName) dbUpdates.display_name = updates.displayName;

        await db.from("users").update(dbUpdates).eq("id", user.id);

        // Re-fetch
        const { data } = await db
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single() as { data: UserRow | null };

        if (data) {
          const u: User = {
            id: data.id,
            walletAddress: data.wallet_address,
            displayName: data.display_name,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
            lastLoginAt: data.last_login_at,
          };
          setUser(u);
          cacheUser(u);
        }
      } else {
        const updated = {
          ...user,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        setUser(updated);
        cacheUser(updated);
      }
    },
    [user, publicKey]
  );

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
