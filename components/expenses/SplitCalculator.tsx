"use client";

import React from "react";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { formatXLM, formatAddress } from "@/lib/utils";
import { STELLAR_EXPLORER } from "@/lib/utils/constants";
import type { SplitShare } from "@/types/expense";

/* ─── Color palette for member initials ─── */
const MEMBER_COLORS = [
  "#2DD4BF", "#6366F1", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#14B8A6", "#F97316", "#06B6D4", "#84CC16",
];

function getMemberColor(index: number): string {
  return MEMBER_COLORS[index % MEMBER_COLORS.length];
}

function getInitial(name: string): string {
  return name?.trim().charAt(0).toUpperCase() || "?";
}

/* ─── Props ─── */
interface SplitCalculatorProps {
  shares: SplitShare[];
  payerName: string;
  payerWalletAddress?: string;
  totalAmount: string;
  expenseTitle: string;
  onPay?: (share: SplitShare) => void;
  payingShareId?: string | null;
  connectedWalletAddress?: string | null;
}

/* ─── Component ─── */
export default function SplitCalculator({
  shares,
  payerName,
  payerWalletAddress,
  totalAmount,
  expenseTitle,
  onPay,
  payingShareId,
  connectedWalletAddress,
}: SplitCalculatorProps) {
  return (
    <div className="rounded-2xl border border-[#E5E5E5] overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E5E5]/60 bg-[#FAFAFA]">
        <h4 className="text-xs font-bold text-[#0F0F14] uppercase tracking-wider">
          Split Breakdown
        </h4>
        <span className="text-xs font-bold text-[#2DD4BF]">
          {formatXLM(totalAmount)} XLM
        </span>
      </div>

      {/* Share Rows */}
      <div className="divide-y divide-[#E5E5E5]/40">
        {shares.map((share, idx) => {
          const color = getMemberColor(idx);
          const isPaying = payingShareId === share.memberId;
          const isCurrentUser =
            connectedWalletAddress &&
            share.walletAddress === connectedWalletAddress;
          const canPay = !share.paid && isCurrentUser && !!onPay;

          return (
            <div
              key={share.memberId}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[#F6F6F6]/60"
            >
              {/* Initial Circle */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ backgroundColor: color }}
              >
                {getInitial(share.name)}
              </div>

              {/* Name + Amount */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#0F0F14] truncate">
                  {share.name}
                  {isCurrentUser && (
                    <span className="ml-1.5 text-[10px] text-[#888] font-medium">(You)</span>
                  )}
                </p>
                <p className="text-xs text-[#888] font-mono">
                  {formatXLM(share.amount)} XLM
                </p>
              </div>

              {/* Status / Action */}
              <div className="flex items-center gap-2 shrink-0">
                {share.paid ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#2DD4BF]" />
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#2DD4BF]/10 text-[10px] font-semibold text-[#14B8A6] uppercase tracking-wider">
                      Paid
                    </span>
                    {share.txHash && (
                      <a
                        href={`${STELLAR_EXPLORER}/tx/${share.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[10px] font-mono text-[#888] hover:text-[#2DD4BF] transition-colors"
                      >
                        {formatAddress(share.txHash, 4)}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </>
                ) : canPay ? (
                  isPaying ? (
                    <Spinner size={18} className="text-[#2DD4BF]" />
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onPay!(share)}
                      className="text-xs px-3 py-1.5"
                    >
                      Pay
                    </Button>
                  )
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-[#E5E5E5]" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Payer Row */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#2DD4BF]/5 border-t border-[#2DD4BF]/20">
        <div className="w-8 h-8 rounded-full bg-[#2DD4BF] flex items-center justify-center text-white text-xs font-bold shrink-0">
          {getInitial(payerName)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#0F0F14]">
            <span className="text-[#14B8A6]">{payerName}</span> paid{" "}
            <span className="font-mono font-bold">{formatXLM(totalAmount)} XLM</span>
          </p>
          {payerWalletAddress && (
            <p className="text-[10px] text-[#888] font-mono truncate">
              {formatAddress(payerWalletAddress, 6)}
            </p>
          )}
        </div>
        <CheckCircle2 className="w-5 h-5 text-[#2DD4BF] shrink-0" />
      </div>
    </div>
  );
}
