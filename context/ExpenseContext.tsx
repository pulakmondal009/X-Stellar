"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useWalletContext } from "./WalletContext";
import { db, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Expense, SplitShare } from "@/types/expense";

const LS_EXPENSES_KEY = "stellar_star_expenses";

interface ExpenseContextType {
  expenses: Expense[];
  isLoading: boolean;
  loadExpenses: (walletAddress: string) => Promise<void>;
  addExpense: (expense: Expense) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  markSharePaid: (expenseId: string, memberId: string, txHash: string) => Promise<void>;
}

const ExpenseContext = createContext<ExpenseContextType | null>(null);

function getLocalExpenses(): Expense[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LS_EXPENSES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveLocalExpenses(expenses: Expense[]) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(LS_EXPENSES_KEY, JSON.stringify(expenses)); } catch {}
}

export function ExpenseProvider({ children }: { children: ReactNode }) {
  const { publicKey } = useWalletContext();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadExpenses = useCallback(async (walletAddress: string) => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured() && db) {
        const { data, error } = await db.from("expenses").select("*")
          .eq("user_wallet_address", walletAddress).order("created_at", { ascending: false });
        if (error) throw error;
        const mapped: Expense[] = (data ?? []).map((row) => ({
          id: row.id, title: row.title, description: row.description ?? undefined,
          totalAmount: row.total_amount, splitMode: row.split_mode as Expense["splitMode"],
          members: (typeof row.members === "string" ? JSON.parse(row.members) : row.members) as Expense["members"],
          shares: (typeof row.shares === "string" ? JSON.parse(row.shares) : row.shares) as Expense["shares"],
          paidByMemberId: row.paid_by_member_id, settled: row.settled,
          createdAt: row.created_at, updatedAt: row.updated_at, tripId: row.trip_id ?? undefined,
        }));
        setExpenses(mapped);
      } else {
        setExpenses(getLocalExpenses());
      }
    } catch (err) { console.error("Failed to load expenses:", err); setExpenses([]); }
    finally { setIsLoading(false); }
  }, []);

  const addExpense = useCallback(async (expense: Expense) => {
    setExpenses((prev) => [expense, ...prev]);
    try {
      if (isSupabaseConfigured() && db && publicKey) {
        const { error } = await db.from("expenses").insert({
          id: expense.id, title: expense.title, description: expense.description ?? null,
          total_amount: expense.totalAmount, split_mode: expense.splitMode,
          members: JSON.parse(JSON.stringify(expense.members)),
          shares: JSON.parse(JSON.stringify(expense.shares)),
          paid_by_member_id: expense.paidByMemberId, settled: expense.settled,
          trip_id: expense.tripId ?? null, user_wallet_address: publicKey,
        });
        if (error) throw error;
      } else {
        saveLocalExpenses([expense, ...getLocalExpenses()]);
      }
    } catch (err) {
      console.error("Failed to add expense:", err);
      setExpenses((prev) => prev.filter((e) => e.id !== expense.id));
    }
  }, [publicKey]);

  const updateExpense = useCallback(async (id: string, updates: Partial<Expense>) => {
    setExpenses((prev) => prev.map((e) => e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e));
    try {
      if (isSupabaseConfigured() && db) {
        const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (updates.title !== undefined) dbUpdates.title = updates.title;
        if (updates.description !== undefined) dbUpdates.description = updates.description;
        if (updates.totalAmount !== undefined) dbUpdates.total_amount = updates.totalAmount;
        if (updates.splitMode !== undefined) dbUpdates.split_mode = updates.splitMode;
        if (updates.members !== undefined) dbUpdates.members = JSON.parse(JSON.stringify(updates.members));
        if (updates.shares !== undefined) dbUpdates.shares = JSON.parse(JSON.stringify(updates.shares));
        if (updates.settled !== undefined) dbUpdates.settled = updates.settled;
        await db.from("expenses").update(dbUpdates).eq("id", id);
      } else {
        const all = getLocalExpenses();
        saveLocalExpenses(all.map((e) => e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e));
      }
    } catch (err) { console.error("Failed to update expense:", err); }
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    const prev = expenses;
    setExpenses((c) => c.filter((e) => e.id !== id));
    try {
      if (isSupabaseConfigured() && db) {
        await db.from("expenses").delete().eq("id", id);
      } else {
        saveLocalExpenses(getLocalExpenses().filter((e) => e.id !== id));
      }
    } catch (err) { console.error("Failed to delete:", err); setExpenses(prev); }
  }, [expenses]);

  const markSharePaid = useCallback(async (expenseId: string, memberId: string, txHash: string) => {
    setExpenses((prev) => prev.map((exp) => {
      if (exp.id !== expenseId) return exp;
      const updShares: SplitShare[] = exp.shares.map((s) => s.memberId === memberId ? { ...s, paid: true, txHash } : s);
      return { ...exp, shares: updShares, settled: updShares.every((s) => s.paid), updatedAt: new Date().toISOString() };
    }));
    try {
      const expense = expenses.find((e) => e.id === expenseId);
      if (!expense) return;
      const updatedShares = expense.shares.map((s) => s.memberId === memberId ? { ...s, paid: true, txHash } : s);
      const allPaid = updatedShares.every((s) => s.paid);
      if (isSupabaseConfigured() && db) {
        await db.from("expenses").update({ shares: JSON.parse(JSON.stringify(updatedShares)), settled: allPaid, updated_at: new Date().toISOString() }).eq("id", expenseId);
      } else {
        const all = getLocalExpenses();
        saveLocalExpenses(all.map((e) => e.id === expenseId ? { ...e, shares: updatedShares, settled: allPaid, updatedAt: new Date().toISOString() } : e));
      }
    } catch (err) { console.error("Failed to mark share paid:", err); }
  }, [expenses]);

  useEffect(() => {
    if (publicKey) { loadExpenses(publicKey); } else { setExpenses([]); }
  }, [publicKey, loadExpenses]);

  return (
    <ExpenseContext.Provider value={{ expenses, isLoading, loadExpenses, addExpense, updateExpense, deleteExpense, markSharePaid }}>
      {children}
    </ExpenseContext.Provider>
  );
}

export function useExpense(): ExpenseContextType {
  const ctx = useContext(ExpenseContext);
  if (!ctx) throw new Error("useExpense must be used within an ExpenseProvider");
  return ctx;
}
