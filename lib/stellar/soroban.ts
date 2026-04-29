import { SorobanRpc } from "@stellar/stellar-sdk";
import { STELLAR_HORIZON_URL } from "@/lib/utils/constants";

const rpcUrl = STELLAR_HORIZON_URL.replace(
  "horizon-testnet",
  "soroban-testnet"
).replace("horizon.", "soroban.");

export const sorobanServer = new SorobanRpc.Server(rpcUrl, {
  allowHttp: true,
});
