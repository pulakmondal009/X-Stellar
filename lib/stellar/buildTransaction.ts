import {
  Asset,
  Memo,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { horizonServer } from "./client";
import { NETWORK_PASSPHRASE } from "@/lib/utils/constants";
import type { PaymentParams } from "@/types/stellar";

export async function buildPaymentTransaction({
  sourcePublicKey,
  destinationPublicKey,
  amount,
  memoText,
}: PaymentParams): Promise<{ xdr: string }> {
  if (isNaN(amount) || amount <= 0) {
    throw new Error(`Invalid payment amount: ${amount}`);
  }

  const account = await horizonServer.loadAccount(sourcePublicKey);

  const builder = new TransactionBuilder(account, {
    fee: "100",
    networkPassphrase: NETWORK_PASSPHRASE,
  });

  builder.addOperation(
    Operation.payment({
      destination: destinationPublicKey,
      asset: Asset.native(),
      amount: amount.toFixed(7),
    })
  );

  if (memoText) builder.addMemo(Memo.text(memoText.slice(0, 28)));

  builder.setTimeout(180);

  return { xdr: builder.build().toXDR() };
}
