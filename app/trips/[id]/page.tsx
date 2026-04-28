"use client";

import React, { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Map,
  Plus,
  ReceiptText,
  Loader2,
  CheckCircle2,
  ChevronRight,
  Trash2,
  Users,
  Calendar,
  Coins,
} from "lucide-react";
import AuthGuard from "@/components/auth/AuthGuard";
import ConnectWalletButton from "@/components/wallet/ConnectWalletButton";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import SplitCalculator from "@/components/expenses/SplitCalculator";
import ExpenseForm from "@/components/expenses/ExpenseForm";
import SettlementSummary from "@/components/trips/SettlementSummary";
import PaymentStatusDisplay from "@/components/payment/PaymentStatus";
import type { PaymentState } from "@/components/payment/PaymentStatus";
import { useWalletContext } from "@/context/WalletContext";
import { useAuth } from "@/context/AuthContext";
import { useTrip } from "@/context/TripContext";
import { useExpense } from "@/context/ExpenseContext";
import { useToast } from "@/components/ui/Toast";
import { formatXLM, formatAddress } from "@/lib/utils";
import type { Expense, SplitShare } from "@/types/expense";

/* ─── Member Color Palette ─── */
const MEMBER_COLORS = [
  "#2DD4BF", "#6366F1", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#14B8A6", "#F97316", "#06B6D4", "#84CC16",
];

function getMemberColor(idx: number): string {
  return MEMBER_COLORS[idx % MEMBER_COLORS.length];
}

function getInitial(name: string): string {
  return name?.trim().charAt(0).toUpperCase() || "?";
}

/* ═══════════════════════════════════════════════════
   TripExpenseCard — collapsible card per expense
   ═══════════════════════════════════════════════════ */
function TripExpenseCard({
  expense,
  currentUserPublicKey,
  onPayShare,
  payingShareId,
}: {
  expense: Expense;
  currentUserPublicKey: string | null;
  onPayShare: (expense: Expense, share: SplitShare) => void;
  payingShareId: string | null;
}) {
  const { deleteExpense } = useExpense();
  const toast = useToast();

  const [expanded, setExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [paymentState] = useState<PaymentState>({ status: "idle" });

  const paidCount = expense.shares.filter((s) => s.paid).length;
  const totalShares = expense.shares.length;
  const progressPercent =
    totalShares > 0 ? (paidCount / totalShares) * 100 : 0;
  const isSettled = expense.settled;

  const date = new Date(expense.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const payerMember = expense.members.find(
    (m) => m.id === expense.paidByMemberId
  );
  const isOwner =
    currentUserPublicKey && payerMember?.walletAddress === currentUserPublicKey;

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    try {
      await deleteExpense(expense.id);
      toast.success("Deleted", `"${expense.title}" removed.`);
    } catch {
      toast.error("Error", "Failed to delete expense.");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [deleteExpense, expense.id, expense.title, toast]);

  return (
    <div className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden hover:shadow-card transition-shadow duration-300">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left group"
      >
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            isSettled ? "bg-[#2DD4BF]/10" : "bg-[#F6F6F6]"
          }`}
        >
          <ReceiptText
            className={`w-4 h-4 ${isSettled ? "text-[#2DD4BF]" : "text-[#888]"}`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#0F0F14] truncate">
            {expense.title}
          </p>
          <p className="text-[11px] text-[#888]">
            {formatXLM(expense.totalAmount)} XLM · {expense.members.length} members · {date}
          </p>
        </div>
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
              {expense.description && (
                <p className="text-sm text-[#888] leading-relaxed">
                  {expense.description}
                </p>
              )}

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

              {paymentState.status !== "idle" && (
                <PaymentStatusDisplay state={paymentState} />
              )}

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
                      <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(false)} className="text-xs">
                        Cancel
                      </Button>
                      <Button variant="destructive" size="sm" loading={deleting} onClick={handleDelete} className="text-xs">
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
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Tab Button
   ═══════════════════════════════════════════════════ */
function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2 text-sm font-semibold rounded-xl transition-all duration-200 ${
        active
          ? "bg-[#0F0F14] text-white shadow-dark-card"
          : "text-[#888] hover:text-[#0F0F14] hover:bg-black/5"
      }`}
    >
      {children}
    </button>
  );
}

/* ═══════════════════════════════════════════════════
   Trip Detail View
   ═══════════════════════════════════════════════════ */
function TripDetailView() {
  const params = useParams();
  const tripId = params?.id as string;

  const { publicKey } = useWalletContext();
  const { user } = useAuth();
  const { trips } = useTrip();
  const { expenses, markSharePaid } = useExpense();
  const { addExpenseToTrip } = useTrip();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<"expenses" | "settle">("expenses");
  const [modalOpen, setModalOpen] = useState(false);
  const [payingShareId, setPayingShareId] = useState<string | null>(null);

  const trip = trips.find((t) => t.id === tripId);
  const currentUserName = user?.displayName || "You";

  const tripExpenses = useMemo(() => {
    if (!trip) return [];
    return expenses.filter((e) => trip.expenseIds.includes(e.id));
  }, [trip, expenses]);

  const totalXLM = useMemo(
    () =>
      tripExpenses.reduce(
        (sum, e) => sum + parseFloat(e.totalAmount || "0"),
        0
      ),
    [tripExpenses]
  );

  const handlePayShare = useCallback(
    async (expense: Expense, share: SplitShare) => {
      setPayingShareId(share.memberId);
      try {
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

  const handleExpenseSuccess = useCallback(
    async (expenseId: string) => {
      await addExpenseToTrip(tripId, expenseId);
      setModalOpen(false);
    },
    [addExpenseToTrip, tripId]
  );

  // Trip not found
  if (!trip) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Map className="w-12 h-12 text-[#E5E5E5] mb-4" />
        <h2 className="text-lg font-bold text-[#0F0F14] mb-2">
          Trip not found
        </h2>
        <p className="text-sm text-[#888] mb-6">
          This trip may have been deleted or doesn&apos;t exist.
        </p>
        <Link href="/trips">
          <Button variant="dark" size="sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Trips
          </Button>
        </Link>
      </div>
    );
  }

  const createdDate = new Date(trip.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
      {/* Trip Meta Bar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white rounded-2xl border border-[#E5E5E5] p-5 mb-5"
      >
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-[#2DD4BF]/10 flex items-center justify-center shrink-0">
            <Map className="w-6 h-6 text-[#2DD4BF]" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-[#0F0F14] truncate">
              {trip.name}
            </h1>
            {trip.description && (
              <p className="text-sm text-[#888] mt-0.5">{trip.description}</p>
            )}
          </div>
          {trip.settled ? (
            <Badge variant="success" size="md">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Settled
            </Badge>
          ) : (
            <Badge variant="dark" size="md">
              Active
            </Badge>
          )}
        </div>

        {/* Meta Row */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-[#888]">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {createdDate}
          </span>
          <span className="flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5" />
            {formatXLM(totalXLM)} XLM total
          </span>
          <span className="flex items-center gap-1.5">
            <ReceiptText className="w-3.5 h-3.5" />
            {tripExpenses.length} expense{tripExpenses.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Member Avatars */}
        <div className="flex items-center gap-1 mt-4">
          {trip.members.map((member, idx) => (
            <div
              key={member.id}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 border-2 border-white -ml-1 first:ml-0"
              style={{
                backgroundColor: getMemberColor(idx),
                zIndex: trip.members.length - idx,
              }}
              title={member.name}
            >
              {getInitial(member.name)}
            </div>
          ))}
          <span className="ml-2 text-xs text-[#888]">
            {trip.members.length} member{trip.members.length !== 1 ? "s" : ""}
          </span>
        </div>
      </motion.div>

      {/* Tab Bar */}
      <div className="sticky top-16 z-30 bg-[#F6F6F6] pb-3 pt-1">
        <div className="flex gap-1 p-1 bg-white rounded-xl border border-[#E5E5E5] w-fit">
          <TabButton
            active={activeTab === "expenses"}
            onClick={() => setActiveTab("expenses")}
          >
            Expenses
          </TabButton>
          <TabButton
            active={activeTab === "settle"}
            onClick={() => setActiveTab("settle")}
          >
            Settle
          </TabButton>
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === "expenses" && (
          <motion.div
            key="expenses"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Add Expense Button */}
            <div className="flex justify-end">
              <Button
                variant="dark"
                size="sm"
                onClick={() => setModalOpen(true)}
              >
                <Plus className="w-4 h-4" />
                Add Expense
              </Button>
            </div>

            {/* Expense List */}
            {tripExpenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#F6F6F6] flex items-center justify-center mb-4">
                  <ReceiptText className="w-7 h-7 text-[#E5E5E5]" />
                </div>
                <h4 className="text-sm font-bold text-[#0F0F14] mb-1">
                  No expenses yet
                </h4>
                <p className="text-xs text-[#888] mb-5 max-w-xs">
                  Add your first expense to start splitting costs.
                </p>
                <Button
                  variant="dark"
                  size="sm"
                  onClick={() => setModalOpen(true)}
                >
                  <Plus className="w-4 h-4" />
                  Add Expense
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {tripExpenses.map((expense) => (
                    <TripExpenseCard
                      key={expense.id}
                      expense={expense}
                      currentUserPublicKey={publicKey}
                      onPayShare={handlePayShare}
                      payingShareId={payingShareId}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "settle" && (
          <motion.div
            key="settle"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <SettlementSummary trip={trip} expenses={tripExpenses} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Expense Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Expense to Trip"
        description={`Adding to "${trip.name}"`}
        size="xl"
      >
        <ExpenseForm
          currentUserPublicKey={publicKey}
          currentUserName={currentUserName}
          defaultMembers={trip.members}
          tripId={tripId}
          onSuccess={handleExpenseSuccess}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </>
  );
}

/* ═══════════════════════════════════════════════════
   Page Export
   ═══════════════════════════════════════════════════ */
export default function TripDetailPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#F6F6F6]">
        {/* Nav */}
        <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-[#E5E5E5]/60">
          <div className="max-w-5xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
            <Link
              href="/trips"
              className="flex items-center gap-1.5 text-sm text-[#888] hover:text-[#0F0F14] transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Trips
            </Link>
            <ConnectWalletButton />
          </div>
        </nav>

        {/* Content */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          <TripDetailView />
        </div>
      </div>
    </AuthGuard>
  );
}
