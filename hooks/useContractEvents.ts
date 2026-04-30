"use client";

import { useEffect, useState } from "react";
import { CONTRACT_ID } from "@/lib/utils/constants";
import { fetchContractEvents } from "@/lib/stellar/events";
import type { ContractPaymentEvent } from "@/types/contract";
import type { Expense } from "@/types/expense";

type UseContractEventsResult = {
  events: ContractPaymentEvent[];
  isLoading: boolean;
};

function deriveEventsFromExpense(expense: Expense | null): ContractPaymentEvent[] {
  if (!expense) return [];

  return expense.shares
    .filter((share) => share.paid && share.txHash)
    .map((share) => ({
      expenseId: expense.id,
      payerAddress:
        expense.members.find((member) => member.id === expense.paidByMemberId)
          ?.walletAddress ?? share.walletAddress,
      payeeAddress: share.walletAddress,
      amount: share.amount,
      timestamp: Date.parse(expense.updatedAt || expense.createdAt),
      txHash: share.txHash ?? "",
    }))
    .sort((left, right) => right.timestamp - left.timestamp);
}

export function useContractEvents(expense: Expense | null): UseContractEventsResult {
  const [events, setEvents] = useState<ContractPaymentEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadEvents() {
      if (!expense) {
        setEvents([]);
        setIsLoading(false);
        return;
      }

      if (!CONTRACT_ID) {
        setEvents(deriveEventsFromExpense(expense));
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const contractEvents = await fetchContractEvents(CONTRACT_ID, expense.id);
        if (cancelled) return;

        setEvents(
          contractEvents.length > 0
            ? contractEvents
            : deriveEventsFromExpense(expense)
        );
      } catch {
        if (!cancelled) {
          setEvents(deriveEventsFromExpense(expense));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadEvents();

    return () => {
      cancelled = true;
    };
  }, [expense?.id, expense?.updatedAt, expense?.createdAt, expense?.shares, expense?.paidByMemberId]);

  return { events, isLoading };
}