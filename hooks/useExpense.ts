"use client";

import { useExpense as useExpenseContext } from "@/context/ExpenseContext";

/**
 * Re-exports all expense context values via a convenience hook.
 */
export function useExpense() {
  return useExpenseContext();
}
