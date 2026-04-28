"use client";

import React from "react";
import { Zap, CheckCircle2 } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import { formatXLM } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { SplitShare } from "@/types/expense";

/* ─── Props ─── */
interface PayButtonProps {
  share: SplitShare;
  onPay: () => void;
  loading?: boolean;
  disabled?: boolean;
  size?: "sm" | "md";
}

/* ─── Size Config ─── */
const SIZE_CLASSES = {
  sm: "px-3 py-1.5 text-xs gap-1.5 rounded-xl",
  md: "px-4 py-2.5 text-sm gap-2 rounded-2xl",
};

/* ─── Component ─── */
export default function PayButton({
  share,
  onPay,
  loading = false,
  disabled = false,
  size = "md",
}: PayButtonProps) {
  /* ── Paid State ── */
  if (share.paid) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 font-semibold text-[#14B8A6]",
          size === "sm" ? "text-xs" : "text-sm"
        )}
      >
        <CheckCircle2 className={size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"} />
        Paid
      </span>
    );
  }

  /* ── Loading State ── */
  if (loading) {
    return (
      <button
        disabled
        className={cn(
          "inline-flex items-center font-semibold bg-[#0F0F14] text-white/60 cursor-wait",
          SIZE_CLASSES[size]
        )}
      >
        <Spinner
          size={size === "sm" ? 14 : 16}
          className="text-[#2DD4BF]"
        />
        Paying...
      </button>
    );
  }

  /* ── Disabled State (not current user's share) ── */
  if (disabled) {
    return (
      <button
        disabled
        className={cn(
          "inline-flex items-center font-semibold bg-[#F6F6F6] text-[#AAAAAA] border border-[#E5E5E5] cursor-not-allowed opacity-60",
          SIZE_CLASSES[size]
        )}
      >
        Pay
      </button>
    );
  }

  /* ── Active State ── */
  return (
    <button
      onClick={onPay}
      className={cn(
        "inline-flex items-center font-semibold bg-[#0F0F14] text-white transition-all duration-200",
        "hover:bg-[#1A1A22] hover:shadow-dark-card hover:-translate-y-0.5",
        "active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2DD4BF]",
        SIZE_CLASSES[size]
      )}
    >
      <Zap
        className={cn(
          "text-[#2DD4BF] fill-[#2DD4BF]",
          size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4"
        )}
      />
      {formatXLM(share.amount)} XLM
    </button>
  );
}
