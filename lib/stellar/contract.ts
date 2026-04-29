import {
  rpc,
  Contract,
  TransactionBuilder,
  xdr,
  Address,
  nativeToScVal,
  scValToNative,
} from "@stellar/stellar-sdk";
import { sorobanServer } from "./soroban";
import { horizonServer } from "./client";
import { NETWORK_PASSPHRASE, CONTRACT_ID } from "@/lib/utils/constants";

export interface RecordPaymentParams {
  expenseId: string;
  payerAddress: string;
  payeeAddress: string;
  amount: number;
  sourcePublicKey: string;
  signedXDR?: string;
}

export async function recordPaymentOnChain({
  expenseId,
  payerAddress,
  payeeAddress,
  amount,
  sourcePublicKey,
  signedXDR,
}: RecordPaymentParams): Promise<{ txHash: string }> {
  if (!CONTRACT_ID) {
    throw new Error("Contract not configured");
  }

  try {
    const contract = new Contract(CONTRACT_ID);

    // Convert parameters to Soroban ScVal types
    const expenseIdScVal = nativeToScVal(expenseId, { type: "string" });
    const payerScVal = new Address(payerAddress).toScVal();
    const payeeScVal = new Address(payeeAddress).toScVal();
    const amountScVal = nativeToScVal(
      BigInt(Math.round(amount * 10_000_000)),
      { type: "i128" }
    );

    // Build the contract invocation operation
    const account = await horizonServer.loadAccount(sourcePublicKey);

    const builder = new TransactionBuilder(account, {
      fee: "100",
      networkPassphrase: NETWORK_PASSPHRASE,
    });

    builder.addOperation(
      contract.call(
        "record_payment",
        expenseIdScVal,
        payerScVal,
        payeeScVal,
        amountScVal
      )
    );

    builder.setTimeout(180);
    const builtTx = builder.build();

    // Prepare transaction via Soroban RPC (simulates and adds resource info)
    const preparedTx = await sorobanServer.prepareTransaction(builtTx);

    // In testnet demo mode, return simulated result
    // In production, the signedXDR would be submitted
    if (signedXDR) {
      const result = await sorobanServer.sendTransaction(preparedTx);
      return { txHash: result.hash };
    }

    return { txHash: "simulated" };
  } catch (error: any) {
    throw new Error(
      `Failed to record payment on-chain: ${error?.message ?? "Unknown error"}`
    );
  }
}

export async function getContractExpense(
  expenseId: string
): Promise<any> {
  if (!CONTRACT_ID) return null;

  try {
    const contract = new Contract(CONTRACT_ID);
    const expenseIdScVal = nativeToScVal(expenseId, { type: "string" });

    // Simulate the contract call to query expense data
    const account = await horizonServer.loadAccount(
      "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF"
    );

    const builder = new TransactionBuilder(account, {
      fee: "100",
      networkPassphrase: NETWORK_PASSPHRASE,
    });

    builder.addOperation(
      contract.call("get_expense", expenseIdScVal)
    );

    builder.setTimeout(180);
    const builtTx = builder.build();

    const simResult = await sorobanServer.simulateTransaction(builtTx);

    if (
      rpc.Api.isSimulationSuccess(simResult) &&
      simResult.result
    ) {
      return scValToNative(simResult.result.retval);
    }

    return null;
  } catch {
    return null;
  }
}
