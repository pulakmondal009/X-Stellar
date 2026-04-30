"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Coins, Trash2 } from "lucide-react";
import AuthGuard from "@/components/auth/AuthGuard";
import ConnectWalletButton from "@/components/wallet/ConnectWalletButton";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import SplitCalculator from "@/components/expenses/SplitCalculator";
import QRCodeDisplay from "@/components/payment/QRCodeDisplay";
import TransactionHash from "@/components/payment/TransactionHash";
import PaymentStatusDisplay from "@/components/payment/PaymentStatus";
import type { PaymentState } from "@/components/payment/PaymentStatus";
import { useWalletContext } from "@/context/WalletContext";
import { useAuth } from "@/context/AuthContext";
import { useExpense } from "@/context/ExpenseContext";
import { usePayment } from "@/hooks/usePayment";
import { useContractEvents } from "@/hooks/useContractEvents";
import { formatXLM } from "@/lib/utils";
import type { SplitShare } from "@/types/expense";

function ExpenseLoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F6F6]">
      <Spinner size={36} className="text-[#2DD4BF]" />
    </div>
  );
}

function mapPaymentState(status: string, txHash: string | null, error: string | null): PaymentState {
  if (status === "idle") return { status: "idle" };
  if (status === "partial_success") {
    return { status: "partial", txHash: txHash ?? undefined, error: error ?? undefined, onChain: true };
  }
  return { status: status as PaymentState["status"], txHash: txHash ?? undefined, error: error ?? undefined, onChain: status === "success" };
}

function ExpenseDetailContent() {
  const router = useRouter();
  const params = useParams<{ id?: string }>();
  const expenseId = params?.id ?? "";
  const { publicKey, isConnected } = useWalletContext();
  const { user } = useAuth();
  const { expenses, isLoading, deleteExpense, markSharePaid } = useExpense();
  const { status, txHash, error, sendPayment, reset } = usePayment();

  const expense = useMemo(
    () => expenses.find((entry) => entry.id === expenseId) ?? null,
    [expenses, expenseId]
  );
  const { events: contractEvents } = useContractEvents(expense);

  const [selectedShareId, setSelectedShareId] = useState<string | null>(null);
  const [pendingShareId, setPendingShareId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!expense) {
      setSelectedShareId(null);
      return;
    }

    const firstUnpaid = expense.shares.find((share) => !share.paid);
    setSelectedShareId(firstUnpaid?.memberId ?? expense.shares[0]?.memberId ?? null);
  }, [expense]);

  const handlePay = useCallback(
    async (share: SplitShare) => {
      setPendingShareId(share.memberId);
      try {
        const paymentHash = await sendPayment({
          destination: share.walletAddress,
          amount: share.amount,
          expenseId: expense?.id ?? expenseId,
          memo: expense?.title,
        });

        if (paymentHash) {
          await markSharePaid(expense?.id ?? expenseId, share.memberId, paymentHash);
        }
      } finally {
        setPendingShareId(null);
      }
    },
    [sendPayment, markSharePaid, expense, expenseId]
  );

  const handleDelete = useCallback(async () => {
    if (!expense) return;
    setDeleting(true);
    try {
      await deleteExpense(expense.id);
      router.push("/expenses");
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [deleteExpense, expense, router]);

  if (isLoading && !expense) {
    return <ExpenseLoadingState />;
  }

  if (!expense) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-[#F6F6F6] px-4 py-6">
          <div className="max-w-3xl mx-auto">
            <Link href="/expenses" className="inline-flex items-center gap-2 text-sm font-semibold text-[#2DD4BF] hover:underline">
              <ArrowLeft className="w-4 h-4" /> Expenses
            </Link>
            <div className="mt-8 rounded-3xl border border-[#E5E5E5] bg-white p-8 text-center shadow-card">
              <h1 className="text-2xl font-black text-[#0F0F14]">Expense not found</h1>
              <p className="mt-2 text-sm text-[#888]">The expense you requested no longer exists or you do not have access to it.</p>
              <Link href="/expenses" className="mt-6 inline-flex items-center justify-center rounded-2xl bg-[#0F0F14] px-5 py-3 text-sm font-semibold text-white">
                Back to Expenses
              </Link>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  const paidShares = expense.shares.filter((share) => share.paid);
  const unpaidShares = expense.shares.filter((share) => !share.paid);
  const selectedShare = expense.shares.find((share) => share.memberId === selectedShareId) ?? unpaidShares[0] ?? null;
  const paidCount = paidShares.length;
  const totalShares = expense.shares.length;
  const progress = totalShares > 0 ? (paidCount / totalShares) * 100 : 0;
  const owner = expense.members.find((member) => member.id === expense.paidByMemberId);
  const isOwner = !!publicKey && owner?.walletAddress === publicKey;
  const splitModeLabel = expense.splitMode.charAt(0).toUpperCase() + expense.splitMode.slice(1);
  const paymentState = mapPaymentState(status, txHash, error);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#F6F6F6]">
        <div className="border-b border-[#E5E5E5] bg-white/90 backdrop-blur-xl sticky top-0 z-30">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
            <Link href="/expenses" className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F0F14] hover:text-[#2DD4BF] transition-colors shrink-0">
              <ArrowLeft className="w-4 h-4" /> Expenses
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm sm:text-base font-bold text-[#0F0F14] truncate">{expense.title}</h1>
            </div>
            <ConnectWalletButton />
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          <section className="rounded-3xl bg-[#0F0F14] text-white p-6 shadow-dark-card">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={expense.settled ? "lime" : "warning"} size="sm">
                {expense.settled ? "Settled" : "Pending"}
              </Badge>
              <Badge variant="dark" size="sm">
                {splitModeLabel}
              </Badge>
            </div>

            <h2 className="mt-4 text-xl sm:text-2xl font-black tracking-tight truncate">{expense.title}</h2>
            <p className="mt-2 text-sm text-[#2DD4BF]">
              {owner?.name ?? "Unknown"} paid {formatXLM(expense.totalAmount)} XLM
            </p>
            <p className="mt-1 text-sm text-white/50 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date(expense.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>

            <div className="mt-5">
              <div className="flex items-center justify-between text-sm text-white/70 mb-2">
                <span>{paidCount} of {totalShares} shares paid</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-[#2DD4BF]" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-white border border-[#E5E5E5] shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E5E5E5]/60">
              <h3 className="text-sm font-bold text-[#0F0F14]">Split Breakdown</h3>
            </div>
            <div className="p-4 space-y-4">
              <SplitCalculator
                shares={expense.shares}
                payerName={owner?.name ?? "Payer"}
                payerWalletAddress={owner?.walletAddress}
                totalAmount={expense.totalAmount}
                expenseTitle={expense.title}
                onPay={handlePay}
                payingShareId={pendingShareId}
                connectedWalletAddress={publicKey}
              />

              {paymentState.status !== "idle" && (
                <PaymentStatusDisplay state={paymentState} onReset={reset} />
              )}
            </div>
          </section>

          <section className="rounded-2xl bg-white border border-[#E5E5E5] shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E5E5E5]/60">
              <h3 className="text-sm font-bold text-[#0F0F14]">Pay via QR Code</h3>
            </div>
            <div className="p-4 space-y-4">
              {unpaidShares.length === 0 ? (
                <div className="rounded-2xl bg-[#F6F6F6] p-6 text-center text-sm text-[#888]">
                  All shares are already paid.
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    {unpaidShares.map((share) => (
                      <button
                        key={share.memberId}
                        type="button"
                        onClick={() => setSelectedShareId(share.memberId)}
                        className={`rounded-full px-3 py-2 text-xs font-semibold transition-colors ${
                          selectedShare?.memberId === share.memberId
                            ? "bg-[#0F0F14] text-white"
                            : "bg-[#F6F6F6] text-[#555] hover:bg-[#E5E5E5]"
                        }`}
                      >
                        {share.name}
                      </button>
                    ))}
                  </div>

                  {selectedShare && (
                    <QRCodeDisplay
                      destinationAddress={selectedShare.walletAddress}
                      amount={parseFloat(selectedShare.amount)}
                      expenseTitle={`${expense.title} · ${selectedShare.name}`}
                      memo={expense.title}
                    />
                  )}
                </>
              )}
            </div>
          </section>

          <section className="rounded-2xl bg-white border border-[#E5E5E5] shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E5E5E5]/60">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-[#0F0F14]">Transaction History</h3>
                {contractEvents.length > 0 && <Badge variant="lime" size="sm">On-chain</Badge>}
              </div>
            </div>
            <div className="p-4 space-y-3">
              {contractEvents.length === 0 ? (
                <div className="rounded-2xl bg-[#F6F6F6] p-6 text-center text-sm text-[#888]">
                  No payments yet.
                </div>
              ) : (
                contractEvents.map((event) => {
                  const share = expense.shares.find((entry) => entry.txHash === event.txHash) ?? paidShares.find((entry) => entry.txHash === event.txHash);
                  return (
                    <div key={event.txHash} className="rounded-2xl border border-[#E5E5E5] p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#0F0F14] truncate">{share?.name ?? event.payeeAddress}</p>
                        <p className="text-xs text-[#888] font-mono">{formatXLM(event.amount)} XLM</p>
                        <p className="text-[10px] text-[#AAAAAA] mt-1">{new Date(event.timestamp).toLocaleString()}</p>
                      </div>
                      <TransactionHash hash={event.txHash} compact />
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {isOwner && (
            <section className="rounded-2xl bg-white border border-red-200 shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-red-100">
                <h3 className="text-sm font-bold text-red-600">Danger Zone</h3>
              </div>
              <div className="p-4">
                {!showDeleteConfirm ? (
                  <Button variant="destructive" size="md" onClick={() => setShowDeleteConfirm(true)}>
                    <Trash2 className="w-4 h-4" /> Delete expense
                  </Button>
                ) : (
                  <div className="rounded-2xl bg-red-50 border border-red-200 p-4 space-y-3">
                    <p className="text-sm text-red-700">Delete this expense? This cannot be undone.</p>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                      <Button variant="destructive" size="sm" loading={deleting} onClick={handleDelete}>Delete</Button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}

export default function ExpenseDetailPage() {
  return <ExpenseDetailContent />;
}