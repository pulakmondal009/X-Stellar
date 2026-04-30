import type { ContractPaymentEvent } from "@/types/contract";

export async function fetchContractEvents(
  contractId: string,
  expenseId?: string
): Promise<ContractPaymentEvent[]> {
  if (!contractId) return [];

  try {
    // TODO: Implement event fetching from Soroban contract
    // This will query contract events filtered by expenseId
    return [];
  } catch {
    return [];
  }
}

export function parseContractEvent(
  record: any
): ContractPaymentEvent | null {
  try {
    // TODO: Parse raw Soroban event record into typed ContractPaymentEvent
    return null;
  } catch {
    return null;
  }
}
