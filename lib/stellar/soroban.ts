import { rpc } from "@stellar/stellar-sdk";

const rpcUrl =
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ??
  "https://soroban-testnet.stellar.org";

export const sorobanServer = new rpc.Server(rpcUrl, {
  allowHttp: rpcUrl.startsWith("http://"),
});
