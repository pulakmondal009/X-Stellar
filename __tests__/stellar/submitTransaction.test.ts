import { submitSignedTransaction } from "@/lib/stellar/submitTransaction";

// ─── Mock Horizon Server via client module ───────────────────────────

const mockSubmitTransaction = jest.fn();

jest.mock("@/lib/stellar/client", () => ({
  horizonServer: {
    submitTransaction: (...args: any[]) => mockSubmitTransaction(...args),
  },
}));

jest.mock("@stellar/stellar-sdk", () => ({
  Transaction: jest.fn().mockImplementation(() => ({
    hash: jest.fn().mockReturnValue("mock-hash"),
  })),
  Networks: { TESTNET: "Test SDF Network ; September 2015" },
}));

// ─── Tests ───────────────────────────────────────────────────────────

describe("submitSignedTransaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns hash and successful:true on successful submission", async () => {
    mockSubmitTransaction.mockResolvedValue({
      hash: "abc123def456",
      successful: true,
    });

    const result = await submitSignedTransaction("signed-xdr-string");

    expect(result).toEqual({
      hash: "abc123def456",
      successful: true,
    });
    expect(mockSubmitTransaction).toHaveBeenCalledTimes(1);
  });

  it("throws on network error", async () => {
    mockSubmitTransaction.mockRejectedValue(
      new Error("Network request failed")
    );

    await expect(
      submitSignedTransaction("signed-xdr-string")
    ).rejects.toThrow("Network request failed");
  });
});
