import {
  parseContractEvent,
  fetchContractEvents,
} from "@/lib/stellar/events";

// ─── Tests ───────────────────────────────────────────────────────────

describe("parseContractEvent", () => {
  it("returns null for malformed / incomplete events", () => {
    expect(parseContractEvent(null)).toBeNull();
    expect(parseContractEvent(undefined)).toBeNull();
    expect(parseContractEvent({})).toBeNull();
    expect(parseContractEvent({ type: "contract" })).toBeNull();
  });

  it("returns null for events missing required fields", () => {
    const incomplete = {
      type: "contract",
      contractId: "CABC123",
      // missing topic / value
    };
    expect(parseContractEvent(incomplete)).toBeNull();
  });
});

describe("fetchContractEvents", () => {
  it("returns empty array when contractId is empty", async () => {
    const result = await fetchContractEvents("");
    expect(result).toEqual([]);
  });

  it("returns empty array when contractId is undefined", async () => {
    const result = await fetchContractEvents(undefined as any);
    expect(result).toEqual([]);
  });
});
