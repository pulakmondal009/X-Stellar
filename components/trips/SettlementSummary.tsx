"use client";

import React, { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Database,
  ArrowRight,
  Loader2,
  PartyPopper,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import TransactionHash from "@/components/payment/TransactionHash";
import { useWalletContext } from "@/context/WalletContext";
import { useExpense } from "@/context/ExpenseContext";
import { useToast } from "@/components/ui/Toast";
import {
  computeNetPayments,
  type RawDebt,
  type NetPayment,
} from "@/lib/settlement/netBalance";
import { buildPaymentTransaction } from "@/lib/stellar/buildTransaction";
import { submitSignedTransaction } from "@/lib/stellar/submitTransaction";
import { signXDR } from "@/lib/freighter";
import { NETWORK_PASSPHRASE } from "@/lib/utils/constants";
import { formatXLM } from "@/lib/utils";
import type { Trip } from "@/types/trip";
import type { Expense } from "@/types/expense";
import type { ContractPaymentEvent } from "@/types/contract";

/* ─── Props ─── */
interface SettlementSummaryProps {
  trip: Trip;
  expenses: Expense[];
  onChainEvents?: ContractPaymentEvent[];
}

/* ─── Derive raw debts from expenses ─── */
function deriveRawDebts(expenses: Expense[]): RawDebt[] {
  const debts: RawDebt[] = [];

  expenses.forEach((exp) => {
    const payer = exp.members.find((m) => m.id === exp.paidByMemberId);
    if (!payer) return;

    exp.shares.forEach((share) => {
      if (share.paid) return; // Already settled
      debts.push({
        from: share.name,
        to: payer.name,
        amount: parseFloat(share.amount),
        fromWallet: share.walletAddress,
        toWallet: payer.walletAddress,
      });
    });
  });

  return debts;
}

/* ─── Row State ─── */
type RowState = "idle" | "paying" | "done";

/* ─── NetPaymentRow ─── */
function NetPaymentRow({
  payment,
  isCurrentUser,
  isOnChain,
  onPaid,
}: {
  payment: NetPayment;
  isCurrentUser: boolean;
  isOnChain: boolean;
  onPaid: (hash: string) => void;
}) {
  const toast = useToast();
  const [rowState, setRowState] = useState<RowState>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);

  const handlePay = useCallback(async () => {
    setRowState("paying");
    try {
      // 1. Build transaction
      const { xdr } = await buildPaymentTransaction({
        sourcePublicKey: payment.fromWallet,
        destinationPublicKey: payment.toWallet,
        amount: payment.amount,
        memoText: `settle:${payment.to}`,
      });

      // 2. Sign with Freighter
      toast.info("Waiting for Freighter…", "Please confirm the transaction in your wallet.");
      const signedXDR = await signXDR(xdr, NETWORK_PASSPHRASE);

      // 3. Submit
      const result = await submitSignedTransaction(signedXDR);

      // 4. Done
      setTxHash(result.hash);
      setRowState("done");
      onPaid(result.hash);
      toast.success("Settlement paid!", `${formatXLM(payment.amount)} XLM sent to ${payment.to}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Transaction could not be completed.";
      console.error("Settlement payment failed:", err);
      toast.error("Payment failed", message);
      setRowState("idle");
    }
  }, [payment, toast, onPaid]);

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#E5E5E5] bg-white">
      {/* From → To */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-sm">
          <span className="font-semibold text-[#0F0F14] truncate">
            {payment.from}
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-[#888] shrink-0" />
          <span className="font-semibold text-[#0F0F14] truncate">
            {payment.to}
          </span>
        </div>
        <p className="text-xs text-[#888] font-mono mt-0.5">
          {formatXLM(payment.amount)} XLM
        </p>
      </div>

      {/* Status / Action */}
      <div className="flex items-center gap-2 shrink-0">
        {rowState === "done" && txHash ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-[#2DD4BF]" />
            <TransactionHash hash={txHash} compact />
          </>
        ) : rowState === "paying" ? (
          <span className="flex items-center gap-1.5 text-xs text-[#888]">
            <Spinner size={14} className="text-[#2DD4BF]" />
            Paying…
          </span>
        ) : isOnChain ? (
          <Badge variant="lime" size="sm">
            <Database className="w-3 h-3" />
            On-chain
          </Badge>
        ) : isCurrentUser ? (
          <Button
            variant="dark"
            size="sm"
            onClick={handlePay}
            className="text-xs"
          >
            Pay {formatXLM(payment.amount)} XLM
          </Button>
        ) : (
          <span className="text-[10px] text-[#AAAAAA] font-medium uppercase tracking-wider">
            Pending
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Component ─── */
export default function SettlementSummary({
  trip,
  expenses,
  onChainEvents = [],
}: SettlementSummaryProps) {
  const { publicKey } = useWalletContext();
  const { markSharePaid } = useExpense();

  const rawDebts = useMemo(() => deriveRawDebts(expenses), [expenses]);
  const netPayments = useMemo(
    () => computeNetPayments(rawDebts),
    [rawDebts]
  );

  const totalDebt = useMemo(
    () => netPayments.reduce((s, p) => s + p.amount, 0),
    [netPayments]
  );

  // Check if a payment has an on-chain record
  const isPaymentOnChain = useCallback(
    (payment: NetPayment): boolean => {
      return onChainEvents.some(
        (ev) =>
          ev.payerAddress === payment.fromWallet &&
          ev.payeeAddress === payment.toWallet
      );
    },
    [onChainEvents]
  );

  const handlePaid = useCallback(
    (payment: NetPayment, hash: string) => {
      // Mark all matching unpaid shares as paid
      expenses.forEach((exp) => {
        exp.shares.forEach((share) => {
          if (
            !share.paid &&
            share.walletAddress === payment.fromWallet
          ) {
            const payer = exp.members.find(
              (m) => m.id === exp.paidByMemberId
            );
            if (payer?.walletAddress === payment.toWallet) {
              markSharePaid(exp.id, share.memberId, hash);
            }
          }
        });
      });
    },
    [expenses, markSharePaid]
  );

  // All settled
  if (netPayments.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center justify-center py-12 px-6 text-center rounded-2xl border border-[#2DD4BF]/30 bg-[#F0FDFA]"
      >
        <div className="w-14 h-14 rounded-full bg-[#2DD4BF]/15 flex items-center justify-center mb-4">
          <PartyPopper className="w-7 h-7 text-[#2DD4BF]" />
        </div>
        <h3 className="text-lg font-bold text-[#14B8A6] mb-1">
          All settled! ✓
        </h3>
        <p className="text-sm text-[#888] max-w-xs">
          Everyone in this trip is squared up. No outstanding balances.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Payment Rows */}
      <div className="space-y-2">
        {netPayments.map((payment, idx) => (
          <NetPaymentRow
            key={`${payment.fromWallet}-${payment.toWallet}-${idx}`}
            payment={payment}
            isCurrentUser={publicKey === payment.fromWallet}
            isOnChain={isPaymentOnChain(payment)}
            onPaid={(hash) => handlePaid(payment, hash)}
          />
        ))}
      </div>

      {/* Summary Stats */}
      <div className="flex items-center gap-4 px-4 py-3 rounded-xl bg-[#F6F6F6] border border-[#E5E5E5]">
        <div className="flex-1">
          <p className="text-[10px] text-[#888] uppercase tracking-wider font-semibold">
            Total outstanding
          </p>
          <p className="text-sm font-bold text-[#0F0F14] font-mono">
            {formatXLM(totalDebt)} XLM
          </p>
        </div>
        <div className="flex-1 text-right">
          <p className="text-[10px] text-[#888] uppercase tracking-wider font-semibold">
            Transactions needed
          </p>
          <p className="text-sm font-bold text-[#0F0F14]">
            {netPayments.length}
          </p>
        </div>
      </div>
    </div>
  );
}
