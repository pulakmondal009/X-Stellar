import {
  calculateSplit,
  isValidXLMAmount,
  isValidStellarAddress,
} from "@/lib/split/calculator";

// ─── isValidXLMAmount ────────────────────────────────────────────────

describe("isValidXLMAmount", () => {
  it("returns true for a whole number string", () => {
    expect(isValidXLMAmount("10")).toBe(true);
  });

  it("returns true for a decimal amount", () => {
    expect(isValidXLMAmount("10.5")).toBe(true);
  });

  it("returns true for the smallest valid stroop (0.0000001)", () => {
    expect(isValidXLMAmount("0.0000001")).toBe(true);
  });

  it("returns false for non-numeric input", () => {
    expect(isValidXLMAmount("abc")).toBe(false);
  });

  it("returns false for zero", () => {
    expect(isValidXLMAmount("0")).toBe(false);
  });

  it("returns false for negative amounts", () => {
    expect(isValidXLMAmount("-5")).toBe(false);
  });

  it("returns false for too many decimal places (>7)", () => {
    expect(isValidXLMAmount("10.12345678")).toBe(false);
  });
});

// ─── isValidStellarAddress ───────────────────────────────────────────

describe("isValidStellarAddress", () => {
  it("returns true for a valid G-address (56 chars, starts with G)", () => {
    const validAddress =
      "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUV";
    expect(validAddress.length).toBe(56);
    expect(isValidStellarAddress(validAddress)).toBe(true);
  });

  it("returns false for a short address", () => {
    expect(isValidStellarAddress("GABCDE")).toBe(false);
  });

  it("returns false for wrong prefix", () => {
    const wrongPrefix =
      "XABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUV";
    expect(isValidStellarAddress(wrongPrefix)).toBe(false);
  });
});

// ─── calculateSplit — equal mode ─────────────────────────────────────

describe('calculateSplit — "equal" mode', () => {
  it("splits evenly among 3 members, excluding the payer", () => {
    const members = [
      { id: "A", name: "Alice", walletAddress: "GA..." },
      { id: "B", name: "Bob", walletAddress: "GB..." },
      { id: "C", name: "Carol", walletAddress: "GC..." },
    ];
    const result = calculateSplit(90, members, "A", "equal");

    // Payer (A) should not appear as a debtor
    const debtorIds = result.map((s) => s.memberId);
    expect(debtorIds).not.toContain("A");

    // Each member's share is 90/3 = 30
    result.forEach((share) => {
      expect(Number(share.amount)).toBeCloseTo(30, 5);
    });
  });
});

// ─── calculateSplit — weighted mode ──────────────────────────────────

describe('calculateSplit — "weighted" mode', () => {
  it("distributes proportionally by weight", () => {
    const members = [
      { id: "A", name: "Alice", walletAddress: "GA...", weight: 1 },
      { id: "B", name: "Bob", walletAddress: "GB...", weight: 2 },
      { id: "C", name: "Carol", walletAddress: "GC...", weight: 3 },
    ];
    const result = calculateSplit(60, members, "A", "weighted");

    // Total weight = 6; A=10, B=20, C=30. A is payer.
    const shareMap: Record<string, number> = {};
    result.forEach((s) => {
      shareMap[s.memberId] = Number(s.amount);
    });

    expect(shareMap["B"]).toBeCloseTo(20, 5);
    expect(shareMap["C"]).toBeCloseTo(30, 5);
  });
});

// ─── calculateSplit — custom mode ────────────────────────────────────

describe('calculateSplit — "custom" mode', () => {
  it("uses weight as direct amount", () => {
    const members = [
      { id: "A", name: "Alice", walletAddress: "GA...", weight: 10 },
      { id: "B", name: "Bob", walletAddress: "GB...", weight: 25 },
      { id: "C", name: "Carol", walletAddress: "GC...", weight: 15 },
    ];
    const result = calculateSplit(50, members, "A", "custom");

    const shareMap: Record<string, number> = {};
    result.forEach((s) => {
      shareMap[s.memberId] = Number(s.amount);
    });

    expect(shareMap["B"]).toBe(25);
    expect(shareMap["C"]).toBe(15);
  });
});

// ─── Edge case: 2 members ────────────────────────────────────────────

describe("calculateSplit — edge cases", () => {
  it("with 2 members returns 1 share (the non-payer)", () => {
    const members = [
      { id: "A", name: "Alice", walletAddress: "GA..." },
      { id: "B", name: "Bob", walletAddress: "GB..." },
    ];
    const result = calculateSplit(50, members, "A", "equal");

    expect(result).toHaveLength(1);
    expect(result[0].memberId).toBe("B");
    expect(Number(result[0].amount)).toBeCloseTo(25, 5);
  });
});
