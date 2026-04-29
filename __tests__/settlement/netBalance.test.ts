import { computeNetPayments } from "@/lib/settlement/netBalance";

describe("computeNetPayments", () => {
  it("simplifies A→B 100, B→C 100 into A→C 100 (one net payment)", () => {
    const debts = [
      { from: "A", to: "B", amount: 100, fromWallet: "GA...", toWallet: "GB..." },
      { from: "B", to: "C", amount: 100, fromWallet: "GB...", toWallet: "GC..." },
    ];

    const result = computeNetPayments(debts);

    // Should collapse into a single payment: A pays C 100
    expect(result).toHaveLength(1);
    expect(result[0].from).toBe("A");
    expect(result[0].to).toBe("C");
    expect(result[0].amount).toBeCloseTo(100, 5);
  });

  it("returns empty array when there are no debts", () => {
    const result = computeNetPayments([]);
    expect(result).toEqual([]);
  });

  it("returns empty array when balances are already settled", () => {
    const debts = [
      { from: "A", to: "B", amount: 50, fromWallet: "GA...", toWallet: "GB..." },
      { from: "B", to: "A", amount: 50, fromWallet: "GB...", toWallet: "GA..." },
    ];

    const result = computeNetPayments(debts);
    expect(result).toHaveLength(0);
  });

  it("handles multiple debtors paying one creditor", () => {
    const debts = [
      { from: "A", to: "C", amount: 30, fromWallet: "GA...", toWallet: "GC..." },
      { from: "B", to: "C", amount: 70, fromWallet: "GB...", toWallet: "GC..." },
    ];

    const result = computeNetPayments(debts);

    // C is owed 100 total; A owes 30, B owes 70
    const totalPaid = result.reduce((sum, p) => sum + p.amount, 0);
    expect(totalPaid).toBeCloseTo(100, 5);

    // All payments should go to C
    result.forEach((p) => {
      expect(p.to).toBe("C");
    });
  });

  it("rounds amounts to 7 decimal places (Stellar stroop precision)", () => {
    const debts = [
      { from: "A", to: "B", amount: 1 / 3, fromWallet: "GA...", toWallet: "GB..." },
    ];

    const result = computeNetPayments(debts);
    expect(result).toHaveLength(1);

    const amountStr = result[0].amount.toString();
    const decimals = amountStr.split(".")[1] || "";
    expect(decimals.length).toBeLessThanOrEqual(7);
  });
});
