"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useWalletContext } from "./WalletContext";
import { db, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Trip } from "@/types/trip";

const LS_TRIPS_KEY = "stellar_star_trips";

interface TripContextType {
  trips: Trip[];
  isLoading: boolean;
  loadTrips: (walletAddress: string) => Promise<void>;
  addTrip: (trip: Trip) => Promise<void>;
  updateTrip: (id: string, updates: Partial<Trip>) => Promise<void>;
  deleteTrip: (id: string) => Promise<void>;
  addExpenseToTrip: (tripId: string, expenseId: string) => Promise<void>;
}

const TripContext = createContext<TripContextType | null>(null);

function getLocalTrips(): Trip[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_TRIPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveLocalTrips(trips: Trip[]) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(LS_TRIPS_KEY, JSON.stringify(trips)); } catch {}
}

export function TripProvider({ children }: { children: ReactNode }) {
  const { publicKey } = useWalletContext();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadTrips = useCallback(async (walletAddress: string) => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured() && db) {
        const { data, error } = await db.from("trips").select("*")
          .eq("user_wallet_address", walletAddress).order("created_at", { ascending: false });
        if (error) throw error;
        const mapped: Trip[] = (data ?? []).map((row) => ({
          id: row.id, name: row.name, description: row.description ?? undefined,
          members: (typeof row.members === "string" ? JSON.parse(row.members) : row.members) as Trip["members"],
          expenseIds: (typeof row.expense_ids === "string" ? JSON.parse(row.expense_ids) : row.expense_ids) as string[],
          createdAt: row.created_at, settled: row.settled,
        }));
        setTrips(mapped);
      } else {
        setTrips(getLocalTrips());
      }
    } catch (err) { console.error("Failed to load trips:", err); setTrips([]); }
    finally { setIsLoading(false); }
  }, []);

  const addTrip = useCallback(async (trip: Trip) => {
    setTrips((prev) => [trip, ...prev]);
    try {
      if (isSupabaseConfigured() && db && publicKey) {
        const { error } = await db.from("trips").insert({
          id: trip.id, name: trip.name, description: trip.description ?? null,
          members: JSON.parse(JSON.stringify(trip.members)),
          expense_ids: JSON.parse(JSON.stringify(trip.expenseIds)),
          settled: trip.settled, user_wallet_address: publicKey,
        });
        if (error) throw error;
      } else {
        saveLocalTrips([trip, ...getLocalTrips()]);
      }
    } catch (err) {
      console.error("Failed to add trip:", err);
      setTrips((prev) => prev.filter((t) => t.id !== trip.id));
    }
  }, [publicKey]);

  const updateTrip = useCallback(async (id: string, updates: Partial<Trip>) => {
    setTrips((prev) => prev.map((t) => t.id === id ? { ...t, ...updates } : t));
    try {
      if (isSupabaseConfigured() && db) {
        const dbUpdates: Record<string, any> = {};
        if (updates.name !== undefined) dbUpdates.name = updates.name;
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.members !== undefined) dbUpdates.members = JSON.parse(JSON.stringify(updates.members));
        if (updates.expenseIds !== undefined) dbUpdates.expense_ids = JSON.parse(JSON.stringify(updates.expenseIds));
        if (updates.settled !== undefined) dbUpdates.settled = updates.settled;
        await db.from("trips").update(dbUpdates).eq("id", id);
      } else {
        const all = getLocalTrips();
        saveLocalTrips(all.map((t) => t.id === id ? { ...t, ...updates } : t));
      }
    } catch (err) { console.error("Failed to update trip:", err); }
  }, []);

  const deleteTrip = useCallback(async (id: string) => {
    const prev = trips;
    setTrips((c) => c.filter((t) => t.id !== id));
    try {
      if (isSupabaseConfigured() && db) {
        await db.from("trips").delete().eq("id", id);
      } else {
        saveLocalTrips(getLocalTrips().filter((t) => t.id !== id));
      }
    } catch (err) { console.error("Failed to delete trip:", err); setTrips(prev); }
  }, [trips]);

  const addExpenseToTrip = useCallback(async (tripId: string, expenseId: string) => {
    setTrips((prev) => prev.map((t) => {
      if (t.id !== tripId) return t;
      if (t.expenseIds.includes(expenseId)) return t;
      return { ...t, expenseIds: [...t.expenseIds, expenseId] };
    }));
    try {
      const trip = trips.find((t) => t.id === tripId);
      if (!trip) return;
      const updatedIds = trip.expenseIds.includes(expenseId) ? trip.expenseIds : [...trip.expenseIds, expenseId];
      if (isSupabaseConfigured() && db) {
        await db.from("trips").update({ expense_ids: JSON.parse(JSON.stringify(updatedIds)) }).eq("id", tripId);
      } else {
        const all = getLocalTrips();
        saveLocalTrips(all.map((t) => t.id === tripId ? { ...t, expenseIds: updatedIds } : t));
      }
    } catch (err) { console.error("Failed to add expense to trip:", err); }
  }, [trips]);

  useEffect(() => {
    if (publicKey) { loadTrips(publicKey); } else { setTrips([]); }
  }, [publicKey, loadTrips]);

  return (
    <TripContext.Provider value={{ trips, isLoading, loadTrips, addTrip, updateTrip, deleteTrip, addExpenseToTrip }}>
      {children}
    </TripContext.Provider>
  );
}

export function useTrip(): TripContextType {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error("useTrip must be used within a TripProvider");
  return ctx;
}
