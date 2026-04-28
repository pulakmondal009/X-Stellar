"use client";

import React, { useState, useEffect, useCallback } from "react";
import { QrCode, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatXLM } from "@/lib/utils";
import { generateSEP0007QR } from "@/lib/qr/generator";

/* ─── Props ─── */
interface QRCodeDisplayProps {
  destinationAddress: string;
  amount: number;
  expenseTitle?: string;
  memo?: string;
}

/* ─── Component ─── */
export default function QRCodeDisplay({
  destinationAddress,
  amount,
  expenseTitle,
  memo,
}: QRCodeDisplayProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const dataUrl = await generateSEP0007QR(destinationAddress, amount, memo);
      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error("QR generation failed:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [destinationAddress, amount, memo]);

  useEffect(() => {
    generate();
  }, [generate]);

  return (
    <div className="flex flex-col items-center text-center p-5 rounded-2xl border border-[#E5E5E5] bg-white">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <QrCode className="w-4 h-4 text-[#2DD4BF]" />
        <h4 className="text-sm font-bold text-[#0F0F14]">Scan to Pay</h4>
      </div>

      {/* QR Code Area */}
      <div className="mb-4">
        {loading ? (
          /* Shimmer Skeleton */
          <div className="w-[256px] h-[256px] rounded-xl bg-[#F6F6F6] border border-[#E5E5E5] animate-pulse flex items-center justify-center">
            <QrCode className="w-12 h-12 text-[#E5E5E5]" />
          </div>
        ) : error ? (
          /* Error State */
          <div className="w-[256px] h-[256px] rounded-xl bg-red-50 border border-red-200 flex flex-col items-center justify-center gap-3 p-4">
            <AlertCircle className="w-8 h-8 text-red-400" />
            <p className="text-xs text-red-600 font-medium">
              Could not generate QR
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={generate}
              className="text-xs text-red-500 hover:text-red-700"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry
            </Button>
          </div>
        ) : (
          /* QR Code */
          <img
            src={qrDataUrl!}
            alt={`QR code to pay ${formatXLM(amount)} XLM`}
            width={256}
            height={256}
            className="rounded-xl border border-[#E5E5E5]"
          />
        )}
      </div>

      {/* Amount */}
      <p className="text-lg font-bold text-[#0F0F14] font-mono">
        {formatXLM(amount)}{" "}
        <span className="text-xs font-semibold text-[#888]">XLM</span>
      </p>

      {/* Title */}
      {expenseTitle && (
        <p className="text-xs text-[#888] mt-1 truncate max-w-[240px]">
          {expenseTitle}
        </p>
      )}

      {/* Caption */}
      <p className="text-[10px] text-[#AAAAAA] mt-3">
        Any Stellar wallet can scan this
      </p>
    </div>
  );
}
