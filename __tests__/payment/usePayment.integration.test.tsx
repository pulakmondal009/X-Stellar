import React from "react";
import { renderHook, act } from "@testing-library/react";
import { usePayment } from "@/hooks/usePayment";

// ─── Mocks ───────────────────────────────────────────────────────────

const mockBuild = jest.fn();
const mockSign = jest.fn();
const mockSubmit = jest.fn();
const mockRecord = jest.fn();

jest.mock("@/lib/stellar/buildTransaction", () => ({
  buildPaymentTransaction: (...args: any[]) => mockBuild(...args),
}));

jest.mock("@/lib/freighter", () => ({
  signXDR: (...args: any[]) => mockSign(...args),
}));

jest.mock("@/lib/stellar/submitTransaction", () => ({
  submitSignedTransaction: (...args: any[]) => mockSubmit(...args),
}));

jest.mock("@/lib/stellar/contract", () => ({
  recordPaymentOnChain: (...args: any[]) => mockRecord(...args),
}));

// Mock wallet context
jest.mock("@/context/WalletContext", () => ({
  useWalletContext: () => ({
    publicKey: "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUV",
    isConnected: true,
  }),
}));

// Mock constants
jest.mock("@/lib/utils/constants", () => ({
  NETWORK_PASSPHRASE: "Test SDF Network ; September 2015",
  CONTRACT_ID: "",
}));

// ─── Tests ───────────────────────────────────────────────────────────

describe("usePayment integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const paymentParams = {
    destination: "GZYXWVUTSRQPONMLKJIHGFEDCBA765432ZYXWVUTSRQPONMLKJIHGF",
    amount: "10",
    expenseId: "exp-1",
    memo: "test",
  };

  it("happy path: idle → success", async () => {
    mockBuild.mockResolvedValue({ xdr: "built-xdr" });
    mockSign.mockResolvedValue("signed-xdr");
    mockSubmit.mockResolvedValue({ hash: "tx-hash-123", successful: true });
    mockRecord.mockResolvedValue(true);

    const { result } = renderHook(() => usePayment());
    expect(result.current.status).toBe("idle");

    await act(async () => {
      await result.current.sendPayment(paymentParams);
    });

    expect(mockBuild).toHaveBeenCalledTimes(1);
    expect(mockSign).toHaveBeenCalledTimes(1);
    expect(mockSubmit).toHaveBeenCalledTimes(1);
    expect(mockRecord).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("success");
  });

  it("error path: signing failure sets error state", async () => {
    mockBuild.mockResolvedValue({ xdr: "built-xdr" });
    mockSign.mockRejectedValue(new Error("User cancelled"));

    const { result } = renderHook(() => usePayment());

    await act(async () => {
      try {
        await result.current.sendPayment(paymentParams);
      } catch {
        // expected
      }
    });

    expect(result.current.status).toBe("error");
    expect(result.current.error).toContain("cancelled");
  });

  it("partial_success: XLM submitted but contract recording fails", async () => {
    mockBuild.mockResolvedValue({ xdr: "built-xdr" });
    mockSign.mockResolvedValue("signed-xdr");
    mockSubmit.mockResolvedValue({ hash: "tx-hash-456", successful: true });
    mockRecord.mockRejectedValue(new Error("Soroban unavailable"));

    const { result } = renderHook(() => usePayment());

    await act(async () => {
      await result.current.sendPayment(paymentParams);
    });

    expect(mockSubmit).toHaveBeenCalledTimes(1);
    expect(mockRecord).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe("partial_success");
    expect(result.current.txHash).toBe("tx-hash-456");
  });
});
