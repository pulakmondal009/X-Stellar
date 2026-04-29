import { formatAddress, formatXLM } from "@/lib/utils";

describe("formatAddress", () => {
  it("truncates a long Stellar address with ellipsis", () => {
    const address =
      "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUV";
    const result = formatAddress(address, 6);

    // Should show first 6 and last 6 chars with ellipsis
    expect(result).toContain("GABCDE");
    expect(result).toContain("...");
    expect(result.length).toBeLessThan(address.length);
  });

  it("returns empty string for empty input", () => {
    expect(formatAddress("")).toBe("");
  });
});

describe("formatXLM", () => {
  it("formats a number with commas and 2 decimal places", () => {
    expect(formatXLM(1234.5)).toBe("1,234.50");
  });

  it('formats zero as "0"', () => {
    expect(formatXLM(0)).toBe("0");
  });

  it('returns "0" for NaN input', () => {
    expect(formatXLM("nan" as any)).toBe("0");
  });
});
