import {
  getAddress,
  isConnected,
  signTransaction,
  requestAccess,
} from "@stellar/freighter-api";

export async function isFreighterInstalled(): Promise<boolean> {
  try {
    const r = await isConnected();
    return r.isConnected;
  } catch {
    return false;
  }
}

export async function getFreighterPublicKey(): Promise<string> {
  const r = await getAddress();
  if (r.error) throw new Error(String(r.error));
  return r.address ?? "";
}

export async function getFreighterNetwork(): Promise<string> {
  return "TESTNET";
}

export async function requestFreighterAccess(): Promise<string> {
  const r = await requestAccess();
  if (r.error) throw new Error(String(r.error));
  // requestAccess returns { publicKey } in v6
  return (r as unknown as { publicKey: string }).publicKey ?? "";
}

export async function signXDR(
  xdr: string,
  networkPassphrase: string
): Promise<string> {
  const r = await signTransaction(xdr, { networkPassphrase });
  if (r.error) throw new Error(String(r.error));
  return r.signedTxXdr ?? "";
}
