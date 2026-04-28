"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Loader2,
  Database,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import TransactionHash from "./TransactionHash";
import { cn } from "@/lib/utils";

/* ─── Payment State Types ─── */
export type PaymentStatus =
  | "idle"
  | "building"
  | "signing"
  | "submitting"
  | "recording"
  | "success"
  | "partial"
  | "error";

export type RecordingStep =
  | "simulating"
  | "signing"
  | "sending"
  | "confirming";

export interface PaymentState {
  status: PaymentStatus;
  txHash?: string;
  error?: string;
  onChain?: boolean;
  recordingStep?: RecordingStep;
}

/* ─── Status Labels ─── */
const STATUS_LABELS: Record<string, string> = {
  building: "Building transaction…",
  signing: "Waiting for wallet signature…",
  submitting: "Submitting to Stellar network…",
  recording: "Recording payment on-chain…",
};

const RECORDING_STEP_LABELS: Record<RecordingStep, string> = {
  simulating: "Simulating contract invocation…",
  signing: "Signing Soroban transaction…",
  sending: "Sending to Stellar network…",
  confirming: "Waiting for ledger confirmation…",
};

/* ─── Props ─── */
interface PaymentStatusProps {
  state: PaymentState;
  onReset?: () => void;
  onRetryOnChain?: () => void;
  className?: string;
}

/* ─── Animation Variants ─── */
const motionProps = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.2 },
};

/* ─── Component ─── */
export default function PaymentStatusDisplay({
  state,
  onReset,
  onRetryOnChain,
  className,
}: PaymentStatusProps) {
  if (state.status === "idle") return null;

  return (
    <div className={cn("w-full", className)}>
      <AnimatePresence mode="wait">
        {/* ── Loading States ── */}
        {(state.status === "building" ||
          state.status === "signing" ||
          state.status === "submitting" ||
          state.status === "recording") && (
          <motion.div
            key={state.status}
            {...motionProps}
            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-[#E5E5E5] bg-white"
          >
            {state.status === "recording" ? (
              <Database className="w-5 h-5 text-[#2DD4BF] animate-pulse shrink-0" />
            ) : (
              <Loader2 className="w-5 h-5 text-[#2DD4BF] animate-spin shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#0F0F14]">
                {STATUS_LABELS[state.status]}
              </p>
              {state.status === "recording" && state.recordingStep && (
                <p className="text-xs text-[#888] mt-0.5">
                  {RECORDING_STEP_LABELS[state.recordingStep]}
                </p>
              )}
              {state.status === "recording" && !state.recordingStep && (
                <p className="text-xs text-[#888] mt-0.5">
                  Storing settlement proof in the Soroban contract pool flow…
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Success State ── */}
        {state.status === "success" && (
          <motion.div
            key="success"
            {...motionProps}
            className="rounded-2xl border border-[#2DD4BF]/40 bg-[#F0FDFA] p-4 space-y-3"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#2DD4BF] shrink-0" />
              <p className="text-sm font-bold text-[#14B8A6] flex-1">
                Payment successful!
              </p>
              {state.onChain && (
                <Badge variant="lime" size="sm">
                  <Database className="w-3 h-3" />
                  On-chain
                </Badge>
              )}
            </div>

            {state.txHash && (
              <div className="pl-7">
                <p className="text-[10px] text-[#888] uppercase tracking-wider font-semibold mb-1">
                  Transaction
                </p>
                <TransactionHash hash={state.txHash} compact={false} />
              </div>
            )}

            {onReset && (
              <div className="pl-7 pt-1">
                <button
                  onClick={onReset}
                  className="text-xs text-[#888] hover:text-[#0F0F14] font-medium transition-colors"
                >
                  Dismiss
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Partial Success State ── */}
        {state.status === "partial" && (
          <motion.div
            key="partial"
            {...motionProps}
            className="rounded-2xl border border-amber-200 bg-amber-50 p-4 space-y-3"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="text-sm font-bold text-amber-700 flex-1">
                Payment sent, contract record pending
              </p>
              <Badge variant="warning" size="sm">
                Retry available
              </Badge>
            </div>

            {state.error && (
              <p className="text-xs text-amber-600 pl-7">{state.error}</p>
            )}

            {state.txHash && (
              <div className="pl-7">
                <p className="text-[10px] text-[#888] uppercase tracking-wider font-semibold mb-1">
                  Transaction
                </p>
                <TransactionHash hash={state.txHash} compact />
              </div>
            )}

            <div className="flex items-center gap-3 pl-7 pt-1">
              {onRetryOnChain && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetryOnChain}
                  className="text-xs border-amber-300 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry on-chain record
                </Button>
              )}
              {onReset && (
                <button
                  onClick={onReset}
                  className="text-xs text-[#888] hover:text-[#0F0F14] font-medium transition-colors"
                >
                  Dismiss
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Error State ── */}
        {state.status === "error" && (
          <motion.div
            key="error"
            {...motionProps}
            className="rounded-2xl border border-red-200 bg-red-50 p-4 space-y-2"
          >
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-sm font-bold text-red-700">Payment failed</p>
            </div>

            {state.error && (
              <p className="text-xs text-red-600 pl-7">{state.error}</p>
            )}

            {onReset && (
              <div className="pl-7 pt-1">
                <button
                  onClick={onReset}
                  className="text-xs text-red-600 hover:text-red-800 font-medium underline underline-offset-2 transition-colors"
                >
                  Try again
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
