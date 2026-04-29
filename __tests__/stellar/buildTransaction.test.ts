import { buildPaymentTransaction } from "@/lib/stellar/buildTransaction";

// ─── Mock @stellar/stellar-sdk ───────────────────────────────────────

jest.mock("@stellar/stellar-sdk", () => {
  const mockAccount = {
    accountId: () => "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUV",
    sequenceNumber: () => "100",
    incrementSequenceNumber: jest.fn(),
  };

  const mockTransaction = {
    toXDR: jest.fn().mockReturnValue("mock-xdr-string"),
    toEnvelope: jest.fn().mockReturnValue({ toXDR: () => "mock-xdr-string" }),
  };

  const mockBuilder = {
    addOperation: jest.fn().mockReturnSelf(),
    addMemo: jest.fn().mockReturnSelf(),
    setTimeout: jest.fn().mockReturnSelf(),
    build: jest.fn().mockReturnValue(mockTransaction),
  };

  return {
    Horizon: {
      Server: jest.fn().mockImplementation(() => ({
        loadAccount: jest.fn().mockResolvedValue(mockAccount),
      })),
    },
    TransactionBuilder: jest.fn().mockImplementation(() => mockBuilder),
    Networks: { TESTNET: "Test SDF Network ; September 2015" },
    Operation: {
      payment: jest.fn().mockReturnValue({ type: "payment" }),
    },
    Asset: {
      native: jest.fn().mockReturnValue({ code: "XLM" }),
    },
    Memo: {
      text: jest.fn().mockImplementation((t: string) => ({
        type: "text",
        value: t,
      })),
    },
    BASE_FEE: "100",
  };
});

// ─── Tests ───────────────────────────────────────────────────────────

describe("buildPaymentTransaction", () => {
  const sourcePublicKey =
    "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUV";
  const destinationPublicKey =
    "GZYXWVUTSRQPONMLKJIHGFEDCBA765432ZYXWVUTSRQPONMLKJIHGF";

  it("returns an object with an xdr string", async () => {
    const result = await buildPaymentTransaction({
      sourcePublicKey,
      destinationPublicKey,
      amount: 10,
      memoText: "test-payment",
    });

    expect(result).toBeDefined();
    expect(typeof result.xdr).toBe("string");
    expect(result.xdr.length).toBeGreaterThan(0);
  });

  it("truncates memo to 28 characters", async () => {
    const longMemo = "A".repeat(50);

    const { Memo } = require("@stellar/stellar-sdk");

    await buildPaymentTransaction({
      sourcePublicKey,
      destinationPublicKey,
      amount: 10,
      memoText: longMemo,
    });

    // Memo.text should have been called with a string ≤ 28 chars
    const lastCall = Memo.text.mock.calls[Memo.text.mock.calls.length - 1];
    expect(lastCall[0].length).toBeLessThanOrEqual(28);
  });

  it("throws for invalid amounts", async () => {
    await expect(
      buildPaymentTransaction({
        sourcePublicKey,
        destinationPublicKey,
        amount: -5,
        memoText: "bad",
      })
    ).rejects.toThrow();
  });
});
