"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ReceiptText,
  Plus,
  Inbox,
  ChevronRight,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import AuthGuard from "@/components/auth/AuthGuard";
import ConnectWalletButton from "@/components/wallet/ConnectWalletButton";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import SplitCalculator from "@/components/expenses/SplitCalculator";
import ExpenseForm from "@/components/expenses/ExpenseForm";
import { useWalletContext } from "@/context/WalletContext";
import { useAuth } from "@/context/AuthContext";
import { useExpense } from "@/context/ExpenseContext";
import { useToast } from "@/components/ui/Toast";
import { formatXLM } from "@/lib/utils";
import type { Expense, SplitShare } from "@/types/expense";

/* ═══════════════════════════════════════════════════
   EmptyState
   ═══════════════════════════════════════════════════ */
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-20 px-6 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-[#F6F6F6] flex items-center justify-center mb-5">
        <Inbox className="w-8 h-8 text-[#E5E5E5]" />
      </div>
      <h3 className="text-lg font-bold text-[#0F0F14] mb-1">No expenses yet</h3>
      <p className="text-sm text-[#888] mb-6 max-w-xs">
        Create your first expense to start splitting bills with friends on the
        Stellar network.
      </p>
      <Button variant="dark" size="md" onClick={onAdd}>
        <Plus className="w-4 h-4" />
        Add your first expense
      </Button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   ExpenseCard
   ═══════════════════════════════════════════════════ */
function ExpenseCard({
  expense,
  currentUserPublicKey,
  currentUserName,
  onPayShare,
  payingShareId,
}: {
  expense: Expense;
  currentUserPublicKey: string | null;
  currentUserName: string;
  onPayShare: (expense: Expense, share: SplitShare) => void;
  payingShareId: string | null;
}) {
  const { deleteExpense } = useExpense();
  const toast = useToast();

  const [expanded, setExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const paidCount = expense.shares.filter((s) => s.paid).length;
  const totalShares = expense.shares.length;
  const progressPercent =
    totalShares > 0 ? (paidCount / totalShares) * 100 : 0;
  const isSettled = expense.settled;

  const date = new Date(expense.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Owner check: paidByMemberId → find that member → walletAddress matches
  const payerMember = expense.members.find(
    (m) => m.id === expense.paidByMemberId
  );
  const isOwner =
    currentUserPublicKey && payerMember?.walletAddress === currentUserPublicKey;

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    try {
      await deleteExpense(expense.id);
      toast.success("Deleted", `"${expense.title}" has been removed.`);
    } catch {
      toast.error("Error", "Failed to delete expense.");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [deleteExpense, expense.id, expense.title, toast]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden hover:shadow-card transition-shadow duration-300"
    >
      {/* Header Row (clickable) */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-4 text-left group"
      >
        {/* Icon */}
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isSettled ? "bg-[#2DD4BF]/10" : "bg-[#F6F6F6]"
          }`}
        >
          <ReceiptText
            className={`w-5 h-5 ${
              isSettled ? "text-[#2DD4BF]" : "text-[#888]"
            }`}
          />
        </div>

        {/* Title + Meta */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#0F0F14] truncate">
            {expense.title}
          </p>
          <p className="text-[11px] text-[#888]">
            {formatXLM(expense.totalAmount)} XLM ·{" "}
            {expense.members.length} members · {date}
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 shrink-0">
          {isSettled ? (
            <Badge variant="success" size="sm">
              <CheckCircle2 className="w-3 h-3" />
              Settled
            </Badge>
          ) : (
            <span className="text-[11px] text-[#888] font-medium">
              {paidCount}/{totalShares} paid
            </span>
          )}

          {/* Chevron */}
          <ChevronRight
            className={`w-4 h-4 text-[#E5E5E5] group-hover:text-[#888] transition-all duration-200 ${
              expanded ? "rotate-90" : ""
            }`}
          />
        </div>
      </button>

      {/* Progress Bar */}
      <div className="h-1 bg-[#F6F6F6] mx-4 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-[#2DD4BF] rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Expanded Detail */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 py-4 space-y-4 border-t border-[#E5E5E5]/40">
              {/* Description */}
              {expense.description && (
                <p className="text-sm text-[#888] leading-relaxed">
                  {expense.description}
                </p>
              )}

              {/* Split Calculator with Pay Buttons */}
              <SplitCalculator
                shares={expense.shares}
                payerName={payerMember?.name || "Payer"}
                payerWalletAddress={payerMember?.walletAddress}
                totalAmount={expense.totalAmount}
                expenseTitle={expense.title}
                onPay={(share) => onPayShare(expense, share)}
                payingShareId={payingShareId}
                connectedWalletAddress={currentUserPublicKey}
              />

              {/* Delete Section (owner only) */}
              {isOwner && (
                <div className="pt-2">
                  {!showDeleteConfirm ? (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="flex items-center gap-1.5 text-xs text-[#888] hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete expense
                    </button>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-200"
                    >
                      <p className="text-xs text-red-700 flex-1">
                        Delete <strong>&quot;{expense.title}&quot;</strong>?
                        Cannot be undone.
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        loading={deleting}
                        onClick={handleDelete}
                        className="text-xs"
                      >
                        Delete
                      </Button>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   Expenses View
   ═══════════════════════════════════════════════════ */
function ExpensesView() {
  const { publicKey } = useWalletContext();
  const { user } = useAuth();
  const { expenses, isLoading, markSharePaid } = useExpense();
  const toast = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [payingShareId, setPayingShareId] = useState<string | null>(null);

  const currentUserName = user?.displayName || "You";

  const handlePayShare = useCallback(
    async (expense: Expense, share: SplitShare) => {
      setPayingShareId(share.memberId);
      try {
        // In a real implementation, this would trigger a Stellar payment
        // For now, simulate a brief delay and mark as paid
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const fakeTxHash = `TX${Date.now().toString(36).toUpperCase()}${Math.random()
          .toString(36)
          .slice(2, 10)
          .toUpperCase()}`;

        await markSharePaid(expense.id, share.memberId, fakeTxHash);
        toast.success("Payment Sent", `${formatXLM(share.amount)} XLM sent to ${share.name}`);
      } catch (err) {
        console.error("Payment failed:", err);
        toast.error("Payment Failed", "Transaction could not be completed.");
      } finally {
        setPayingShareId(null);
      }
    },
    [markSharePaid, toast]
  );

  const handleFormSuccess = useCallback(
    (_id: string) => {
      setModalOpen(false);
    },
    []
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-[#2DD4BF] animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2DD4BF]/10 flex items-center justify-center">
            <ReceiptText className="w-5 h-5 text-[#2DD4BF]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0F0F14]">Expenses</h1>
            <p className="text-xs text-[#888]">
              {expenses.length} expense{expenses.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Button variant="dark" size="sm" onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4" />
          New Expense
        </Button>
      </div>

      {/* Expense List or Empty State */}
      {expenses.length === 0 ? (
        <EmptyState onAdd={() => setModalOpen(true)} />
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {expenses.map((expense) => (
              <ExpenseCard
                key={expense.id}
                expense={expense}
                currentUserPublicKey={publicKey}
                currentUserName={currentUserName}
                onPayShare={handlePayShare}
                payingShareId={payingShareId}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* New Expense Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New Expense"
        description="Create a new expense to split with friends"
        size="xl"
      >
        <ExpenseForm
          currentUserPublicKey={publicKey}
          currentUserName={currentUserName}
          onSuccess={handleFormSuccess}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </>
  );
}

/* ═══════════════════════════════════════════════════
   Page Export
   ═══════════════════════════════════════════════════ */
export default function ExpensesPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#F6F6F6]">
        {/* Nav */}
        <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-[#E5E5E5]/60">
          <div className="max-w-5xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-sm text-[#888] hover:text-[#0F0F14] transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Link>
            <h2 className="text-sm font-bold text-[#0F0F14] absolute left-1/2 -translate-x-1/2">
              Expenses
            </h2>
            <ConnectWalletButton />
          </div>
        </nav>

        {/* Content */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          <ExpensesView />
        </div>
      </div>
    </AuthGuard>
  );
}
