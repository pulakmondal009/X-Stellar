import {
  isFreighterInstalled,
  getFreighterPublicKey,
  signXDR,
} from "@/lib/freighter";

const mockIsConnected = jest.fn();
const mockGetAddress = jest.fn();
const mockSignTransaction = jest.fn();

jest.mock("@stellar/freighter-api", () => ({
  isConnected: (...args: any[]) => mockIsConnected(...args),
  getAddress: (...args: any[]) => mockGetAddress(...args),
  signTransaction: (...args: any[]) => mockSignTransaction(...args),
  requestAccess: jest.fn(),
}));

describe("isFreighterInstalled", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns true when connected", async () => {
    mockIsConnected.mockResolvedValue({ isConnected: true });
    expect(await isFreighterInstalled()).toBe(true);
  });

  it("returns false when not connected", async () => {
    mockIsConnected.mockResolvedValue({ isConnected: false });
    expect(await isFreighterInstalled()).toBe(false);
  });

  it("returns false on error (graceful)", async () => {
    mockIsConnected.mockRejectedValue(new Error("Not found"));
    expect(await isFreighterInstalled()).toBe(false);
  });
});

describe("getFreighterPublicKey", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns publicKey from response", async () => {
    const addr = "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567ABCDEFGHIJKLMNOPQRSTUV";
    mockGetAddress.mockResolvedValue({ address: addr });
    expect(await getFreighterPublicKey()).toBe(addr);
  });

  it("throws on error response", async () => {
    mockGetAddress.mockResolvedValue({ error: "Rejected" });
    await expect(getFreighterPublicKey()).rejects.toThrow("Rejected");
  });
});

describe("signXDR", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns signedTxXdr", async () => {
    mockSignTransaction.mockResolvedValue({ signedTxXdr: "signed-xdr" });
    const result = await signXDR("unsigned-xdr", "Test SDF Network ; September 2015");
    expect(result).toBe("signed-xdr");
  });

  it("throws on error response", async () => {
    mockSignTransaction.mockResolvedValue({ error: "Cancelled" });
    await expect(signXDR("unsigned-xdr", "Test SDF Network ; September 2015")).rejects.toThrow("Cancelled");
  });
});
