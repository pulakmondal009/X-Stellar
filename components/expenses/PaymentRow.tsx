"use client";

import React from "react";
import { Receipt, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import { formatXLM, formatAddress } from "@/lib/utils";
import { STELLAR_EXPLORER } from "@/lib/utils/constants";
import type { SplitShare, Expense } from "@/types/expense";

/* ─── Props ─── */
interface PaymentRowProps {
  share: SplitShare;
  expense: Expense;
  currentUserPublicKey: string | null;
  onPay: (share: SplitShare) => void;
  paying: boolean;
}

/* ─── Color palette for member initials ─── */
const MEMBER_COLORS = [
  "#2DD4BF", "#6366F1", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#14B8A6", "#F97316", "#06B6D4", "#84CC16",
];

function getMemberColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return MEMBER_COLORS[Math.abs(hash) % MEMBER_COLORS.length];
}

function getInitial(name: string): string {
  return name?.trim().charAt(0).toUpperCase() || "?";
}

/* ─── Component ─── */
export default function PaymentRow({
  share,
  expense,
  currentUserPublicKey,
  onPay,
  paying,
}: PaymentRowProps) {
  const color = getMemberColor(share.name);
  const isCurrentUser =
    currentUserPublicKey && share.walletAddress === currentUserPublicKey;

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#E5E5E5] bg-white hover:bg-[#F6F6F6]/60 transition-colors">
      {/* Member Initial */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
        style={{ backgroundColor: color }}
      >
        {getInitial(share.name)}
      </div>

      {/* Info */}
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

      {/* Action */}
      <div className="flex items-center gap-2 shrink-0">
        {share.paid ? (
          <>
            <Receipt className="w-4 h-4 text-[#2DD4BF]" />
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
        ) : paying ? (
          <Spinner size={18} className="text-[#2DD4BF]" />
        ) : isCurrentUser ? (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onPay(share)}
            className="text-xs px-3 py-1.5"
          >
            Pay
          </Button>
        ) : (
          <span className="text-[10px] text-[#888] font-medium uppercase tracking-wider">
            Unpaid
          </span>
        )}
      </div>
    </div>
  );
}
