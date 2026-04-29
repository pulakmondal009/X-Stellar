import { recordPaymentOnChain } from "@/lib/stellar/contract";

// ─── Mock environment ────────────────────────────────────────────────

const originalEnv = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv };
});

afterAll(() => {
  process.env = originalEnv;
});

// ─── Tests ───────────────────────────────────────────────────────────

describe("recordPaymentOnChain — contract errors", () => {
  it('throws "Contract not configured" when CONTRACT_ID is empty', async () => {
    process.env.NEXT_PUBLIC_CONTRACT_ID = "";

    // Re-import to pick up new env
    const { recordPaymentOnChain: record } = await import(
      "@/lib/stellar/contract"
    );

    await expect(
      record({
        expenseId: "exp-1",
        payerAddress: "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUV",
        payeeAddress: "GZYXWVUTSRQPONMLKJIHGFEDCBA765432ZYXWVUTSRQPONMLKJIHGF",
        amount: 10,
        sourcePublicKey: "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUV",
      })
    ).rejects.toThrow(/[Cc]ontract not configured/);
  });

  it("degrades gracefully when Soroban server is unreachable", async () => {
    process.env.NEXT_PUBLIC_CONTRACT_ID = "CABC123";
    process.env.NEXT_PUBLIC_SOROBAN_RPC_URL = "http://localhost:99999";

    const { recordPaymentOnChain: record } = await import(
      "@/lib/stellar/contract"
    );

    // Should throw a network-related error, not crash the process
    await expect(
      record({
        expenseId: "exp-1",
        payerAddress: "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUV",
        payeeAddress: "GZYXWVUTSRQPONMLKJIHGFEDCBA765432ZYXWVUTSRQPONMLKJIHGF",
        amount: 10,
        sourcePublicKey: "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUV",
      })
    ).rejects.toThrow();
  });
});

