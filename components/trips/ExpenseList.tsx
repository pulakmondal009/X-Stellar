"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Inbox,
  Plus,
  ChevronRight,
  CheckCircle2,
  ReceiptText,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import SplitCalculator from "@/components/expenses/SplitCalculator";
import { formatXLM } from "@/lib/utils";
import type { Expense } from "@/types/expense";

/* ─── Props ─── */
interface ExpenseListProps {
  expenses: Expense[];
  tripId: string;
  onAddExpense: () => void;
}

/* ─── Compact Expense Row ─── */
function CompactExpenseRow({ expense }: { expense: Expense }) {
  const [expanded, setExpanded] = useState(false);
  const paidCount = expense.shares.filter((s) => s.paid).length;
  const totalShares = expense.shares.length;
  const allPaid = expense.settled;

  const date = new Date(expense.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const payerMember = expense.members.find(
    (m) => m.id === expense.paidByMemberId
  );

  return (
    <div className="rounded-xl border border-[#E5E5E5] bg-white overflow-hidden hover:shadow-card transition-shadow duration-200">
      {/* Row Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left group"
      >
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            allPaid ? "bg-[#2DD4BF]/10" : "bg-[#F6F6F6]"
          }`}
        >
          <ReceiptText
            className={`w-4 h-4 ${allPaid ? "text-[#2DD4BF]" : "text-[#888]"}`}
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#0F0F14] truncate">
            {expense.title}
          </p>
          <p className="text-[10px] text-[#888]">{date}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm font-bold font-mono text-[#0F0F14]">
            {formatXLM(expense.totalAmount)}
          </span>
          <span className="text-[10px] text-[#888]">XLM</span>

          {allPaid ? (
            <CheckCircle2 className="w-4 h-4 text-[#2DD4BF]" />
          ) : (
            <span className="text-[10px] text-[#888] font-medium">
              {paidCount}/{totalShares}
            </span>
          )}

          <ChevronRight
            className={`w-4 h-4 text-[#E5E5E5] group-hover:text-[#888] transition-all duration-200 ${
              expanded ? "rotate-90" : ""
            }`}
          />
        </div>
      </button>

      {/* Expanded: SplitCalculator */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1">
              <SplitCalculator
                shares={expense.shares}
                payerName={payerMember?.name || "Payer"}
                payerWalletAddress={payerMember?.walletAddress}
                totalAmount={expense.totalAmount}
                expenseTitle={expense.title}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Component ─── */
export default function ExpenseList({
  expenses,
  tripId,
  onAddExpense,
}: ExpenseListProps) {
  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#F6F6F6] flex items-center justify-center mb-4">
          <Inbox className="w-7 h-7 text-[#E5E5E5]" />
        </div>
        <h4 className="text-sm font-bold text-[#0F0F14] mb-1">
          No expenses yet for this trip
        </h4>
        <p className="text-xs text-[#888] mb-5 max-w-xs">
          Add your first expense to start splitting costs with your group.
        </p>
        <Button variant="dark" size="sm" onClick={onAddExpense}>
          <Plus className="w-4 h-4" />
          Add Expense
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {expenses.map((expense) => (
        <CompactExpenseRow key={expense.id} expense={expense} />
      ))}
    </div>
  );
}
