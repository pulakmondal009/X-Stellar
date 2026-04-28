"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ExternalLink, X, Copy, Check } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/Button";
import { formatAddress, formatXLM } from "@/lib/utils";
import { STELLAR_EXPLORER } from "@/lib/utils/constants";

/* ─── Props ─── */
interface ReceiptModalProps {
  txHash: string;
  expenseTitle: string;
  amount: string;
  from: string;
  to: string;
  open: boolean;
  onClose: () => void;
}

/* ─── Detail Row ─── */
function DetailRow({
  label,
  value,
  mono,
  copyable,
}: {
  label: string;
  value: string;
  mono?: boolean;
  copyable?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-white/5 last:border-0">
      <span className="text-xs text-white/40 uppercase tracking-wider font-semibold shrink-0">
        {label}
      </span>
      <div className="flex items-center gap-1.5 min-w-0">
        <span
          className={`text-sm text-white/90 text-right truncate ${
            mono ? "font-mono" : "font-medium"
          }`}
        >
          {value}
        </span>
        {copyable && (
          <button
            onClick={handleCopy}
            className="p-1 rounded-md hover:bg-white/10 transition-colors shrink-0"
          >
            {copied ? (
              <Check className="w-3 h-3 text-[#2DD4BF]" />
            ) : (
              <Copy className="w-3 h-3 text-white/40 hover:text-white/70" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── Component ─── */
export default function ReceiptModal({
  txHash,
  expenseTitle,
  amount,
  from,
  to,
  open,
  onClose,
}: ReceiptModalProps) {
  const txUrl = `${STELLAR_EXPLORER}/tx/${txHash}`;

  // Body scroll lock
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (typeof window === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-md bg-[#0F0F14] rounded-3xl overflow-hidden shadow-2xl border border-white/5"
          >
            {/* Gradient Top Bar */}
            <div className="h-1 bg-gradient-to-r from-[#2DD4BF] via-[#0D9488] to-[#2DD4BF]" />

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors z-20"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>

            {/* Content */}
            <div className="px-6 py-8 flex flex-col items-center text-center">
              {/* Success Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
                className="w-16 h-16 rounded-full bg-[#2DD4BF]/15 flex items-center justify-center mb-5"
              >
                <CheckCircle2 className="w-9 h-9 text-[#2DD4BF]" />
              </motion.div>

              <h2 className="text-xl font-bold text-white mb-1">
                Payment Confirmed
              </h2>
              <p className="text-sm text-white/40 mb-6">{expenseTitle}</p>

              {/* Amount */}
              <div className="text-3xl font-black text-[#2DD4BF] mb-6 font-mono">
                {formatXLM(amount)} <span className="text-lg font-semibold text-white/40">XLM</span>
              </div>

              {/* Details Grid */}
              <div className="w-full bg-white/5 rounded-2xl px-4 py-2 mb-6">
                <DetailRow label="From" value={formatAddress(from, 8)} mono copyable />
                <DetailRow label="To" value={formatAddress(to, 8)} mono copyable />
                <DetailRow label="Amount" value={`${formatXLM(amount)} XLM`} />
                <DetailRow
                  label="TX Hash"
                  value={formatAddress(txHash, 8)}
                  mono
                  copyable
                />
              </div>

              {/* QR Code */}
              <div className="bg-white rounded-2xl p-4 mb-6">
                <QRCodeSVG
                  value={txUrl}
                  size={160}
                  bgColor="#FFFFFF"
                  fgColor="#0F0F14"
                  level="M"
                  includeMargin={false}
                />
              </div>

              {/* Explorer Link */}
              <a
                href={txUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button
                  variant="outline-lime"
                  size="md"
                  className="w-full"
                >
                  <ExternalLink className="w-4 h-4" />
                  View on Stellar Expert
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
