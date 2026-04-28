"use client";

import React, { useState, useCallback } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { formatAddress } from "@/lib/utils";
import { STELLAR_EXPLORER } from "@/lib/utils/constants";

/* ─── Props ─── */
interface TransactionHashProps {
  hash: string;
  compact?: boolean;
}

/* ─── Component ─── */
export default function TransactionHash({
  hash,
  compact = true,
}: TransactionHashProps) {
  const [copied, setCopied] = useState(false);
  const explorerUrl = `${STELLAR_EXPLORER}/tx/${hash}`;

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [hash]);

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-mono text-[#888]">
        {formatAddress(hash, 8)}

        <button
          onClick={handleCopy}
          className="p-0.5 rounded hover:bg-black/5 transition-colors"
          title="Copy hash"
        >
          {copied ? (
            <Check className="w-3 h-3 text-[#2DD4BF]" />
          ) : (
            <Copy className="w-3 h-3 text-[#888] hover:text-[#0F0F14]" />
          )}
        </button>

        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-0.5 rounded hover:bg-black/5 transition-colors"
          title="View on Stellar Expert"
        >
          <ExternalLink className="w-3 h-3 text-[#888] hover:text-[#2DD4BF]" />
        </a>
      </span>
    );
  }

  return (
    <div className="space-y-2">
      {/* Full hash */}
      <div className="flex items-center gap-2 p-3 rounded-xl bg-[#F6F6F6] border border-[#E5E5E5]">
        <code className="flex-1 text-xs font-mono text-[#0F0F14] break-all leading-relaxed select-all">
          {hash}
        </code>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-lg hover:bg-white transition-colors shrink-0"
          title="Copy hash"
        >
          {copied ? (
            <Check className="w-4 h-4 text-[#2DD4BF]" />
          ) : (
            <Copy className="w-4 h-4 text-[#888] hover:text-[#0F0F14]" />
          )}
        </button>
      </div>

      {/* Explorer link */}
      <a
        href={explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2DD4BF] hover:underline transition-colors"
      >
        View on Stellar Expert →
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}
