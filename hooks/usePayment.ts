"use client";

import { useState, useCallback } from "react";
import { buildPaymentTransaction } from "@/lib/stellar/buildTransaction";
import { signXDR } from "@/lib/freighter";
import { submitSignedTransaction } from "@/lib/stellar/submitTransaction";
import { recordPaymentOnChain } from "@/lib/stellar/contract";
import { useWalletContext } from "@/context/WalletContext";
import { NETWORK_PASSPHRASE } from "@/lib/utils/constants";

export type PaymentStatus =
  | "idle"
  | "building"
  | "signing"
  | "submitting"
  | "recording"
  | "success"
  | "partial_success"
  | "error";

interface SendPaymentParams {
  destination: string;
  amount: string;
  expenseId: string;
  memo?: string;
}

interface UsePaymentReturn {
  status: PaymentStatus;
  txHash: string | null;
  error: string | null;
  sendPayment: (params: SendPaymentParams) => Promise<void>;
  reset: () => void;
}

export function usePayment(): UsePaymentReturn {
  const { publicKey } = useWalletContext();
  const [status, setStatus] = useState<PaymentStatus>("idle");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setTxHash(null);
    setError(null);
  }, []);

  const sendPayment = useCallback(
    async ({ destination, amount, expenseId, memo }: SendPaymentParams) => {
      if (!publicKey) {
        setStatus("error");
        setError("Wallet not connected");
        throw new Error("Wallet not connected");
      }

      try {
        // 1. Build
        setStatus("building");
        const { xdr } = await buildPaymentTransaction({
          sourcePublicKey: publicKey,
          destinationPublicKey: destination,
          amount: parseFloat(amount),
          memoText: memo,
        });

        // 2. Sign
        setStatus("signing");
        const signedXdr = await signXDR(xdr, NETWORK_PASSPHRASE);

        // 3. Submit
        setStatus("submitting");
        const result = await submitSignedTransaction(signedXdr);
        setTxHash(result.hash);

        // 4. Record on-chain (optional — graceful degradation)
        setStatus("recording");
        try {
          await recordPaymentOnChain({
            expenseId,
            payerAddress: publicKey,
            payeeAddress: destination,
            amount: parseFloat(amount),
            sourcePublicKey: publicKey,
            signedXDR: signedXdr,
          });
          setStatus("success");
        } catch (contractErr) {
          // Payment succeeded but contract recording failed
          console.warn("Contract recording failed:", contractErr);
          setStatus("partial_success");
        }
      } catch (err: any) {
        const message = err?.message ?? "Payment failed";
        setError(message);
        setStatus("error");
        throw err;
      }
    },
    [publicKey]
  );

  return { status, txHash, error, sendPayment, reset };
}
