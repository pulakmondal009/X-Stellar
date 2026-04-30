"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Calendar, Map, ReceiptText } from "lucide-react";
import AuthGuard from "@/components/auth/AuthGuard";
import ConnectWalletButton from "@/components/wallet/ConnectWalletButton";
import { Badge } from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import SettlementSummary from "@/components/trips/SettlementSummary";
import { useWalletContext } from "@/context/WalletContext";
import { useTrip } from "@/context/TripContext";
import { useExpense } from "@/context/ExpenseContext";
import { formatXLM } from "@/lib/utils";

function TripDetailLoadingState() {
  return (
    <div className="min-h-screen bg-[#F6F6F6] flex items-center justify-center px-4">
      <Spinner size={36} className="text-[#2DD4BF]" />
    </div>
  );
}

export default function TripDetailPage() {
  const params = useParams<{ id?: string }>();
  const tripId = params?.id ?? "";
  const { publicKey } = useWalletContext();
  const { trips, isLoading: tripsLoading } = useTrip();
  const { expenses, isLoading: expensesLoading } = useExpense();

  const trip = useMemo(
    () => trips.find((entry) => entry.id === tripId) ?? null,
    [trips, tripId]
  );

  const tripExpenses = useMemo(
    () => expenses.filter((expense) => trip?.expenseIds.includes(expense.id)),
    [expenses, trip]
  );

  if (tripsLoading || expensesLoading) {
    return <TripDetailLoadingState />;
  }

  if (!trip) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-[#F6F6F6] px-4 py-6">
          <div className="max-w-3xl mx-auto">
            <Link
              href="/trips"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#2DD4BF] hover:underline"
            >
              <ArrowLeft className="w-4 h-4" /> Trips
            </Link>
            <div className="mt-8 rounded-3xl border border-[#E5E5E5] bg-white p-8 text-center shadow-card">
              <h1 className="text-2xl font-black text-[#0F0F14]">Trip not found</h1>
              <p className="mt-2 text-sm text-[#888]">
                The trip you requested no longer exists or you do not have access to it.
              </p>
              <Link
                href="/trips"
                className="mt-6 inline-flex items-center justify-center rounded-2xl bg-[#0F0F14] px-5 py-3 text-sm font-semibold text-white"
              >
                Back to Trips
              </Link>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  const settledCount = tripExpenses.filter((expense) => expense.settled).length;
  const totalExpenseAmount = tripExpenses.reduce(
    (sum, expense) => sum + parseFloat(expense.totalAmount || "0"),
    0
  );
  const settledPercent = tripExpenses.length
    ? (settledCount / tripExpenses.length) * 100
    : 0;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#F6F6F6]">
        <div className="border-b border-[#E5E5E5] bg-white/90 backdrop-blur-xl sticky top-0 z-30">
          <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
            <Link
              href="/trips"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F0F14] hover:text-[#2DD4BF] transition-colors shrink-0"
            >
              <ArrowLeft className="w-4 h-4" /> Trips
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm sm:text-base font-bold text-[#0F0F14] truncate">
                {trip.name}
              </h1>
            </div>
            <ConnectWalletButton />
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          <section className="rounded-3xl bg-[#0F0F14] text-white p-6 shadow-dark-card">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={trip.settled ? "lime" : "warning"} size="sm">
                {trip.settled ? "Settled" : "Active"}
              </Badge>
              <Badge variant="dark" size="sm">
                Trip
              </Badge>
            </div>

            <div className="mt-4 flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                <Map className="w-5 h-5 text-[#2DD4BF]" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight truncate">
                  {trip.name}
                </h2>
                {trip.description && (
                  <p className="mt-1 text-sm text-white/70">{trip.description}</p>
                )}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3 text-sm">
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-white/50 text-xs uppercase tracking-wider font-semibold">
                  Members
                </p>
                <p className="mt-1 font-bold text-white">{trip.members.length}</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-white/50 text-xs uppercase tracking-wider font-semibold">
                  Expenses
                </p>
                <p className="mt-1 font-bold text-white">{tripExpenses.length}</p>
              </div>
              <div className="rounded-2xl bg-white/5 p-4">
                <p className="text-white/50 text-xs uppercase tracking-wider font-semibold">
                  Total
                </p>
                <p className="mt-1 font-bold text-white">
                  {formatXLM(totalExpenseAmount.toFixed(2))} XLM
                </p>
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between text-sm text-white/70 mb-2">
                <span>
                  {settledCount} of {tripExpenses.length} expenses settled
                </span>
                <span>{Math.round(settledPercent)}%</span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#2DD4BF]"
                  style={{ width: `${settledPercent}%` }}
                />
              </div>
            </div>

            <p className="mt-4 text-sm text-white/50 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Created {new Date(trip.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </section>

          <section className="rounded-2xl bg-white border border-[#E5E5E5] shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E5E5E5]/60">
              <h3 className="text-sm font-bold text-[#0F0F14]">Settlement</h3>
            </div>
            <div className="p-4">
              <SettlementSummary trip={trip} expenses={tripExpenses} />
            </div>
          </section>

          <section className="rounded-2xl bg-white border border-[#E5E5E5] shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E5E5E5]/60 flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-[#0F0F14]">Trip Expenses</h3>
              <span className="text-xs text-[#888]">{tripExpenses.length} items</span>
            </div>
            <div className="p-4 space-y-3">
              {tripExpenses.length === 0 ? (
                <div className="rounded-2xl bg-[#F6F6F6] p-6 text-center text-sm text-[#888]">
                  No expenses have been added to this trip yet.
                </div>
              ) : (
                tripExpenses.map((expense) => {
                  const payer = expense.members.find(
                    (member) => member.id === expense.paidByMemberId
                  );

                  return (
                    <div
                      key={expense.id}
                      className="rounded-2xl border border-[#E5E5E5] p-4 flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#2DD4BF]/10 flex items-center justify-center shrink-0">
                        <ReceiptText className="w-5 h-5 text-[#2DD4BF]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-[#0F0F14] truncate">
                          {expense.title}
                        </p>
                        <p className="text-xs text-[#888] truncate">
                          {payer?.name ?? "Unknown"} paid {formatXLM(expense.totalAmount)} XLM
                        </p>
                      </div>
                      <Badge variant={expense.settled ? "lime" : "dark"} size="sm">
                        {expense.settled ? "Settled" : "Open"}
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {publicKey && (
            <p className="text-xs text-[#AAAAAA] text-center">
              Signed in wallet: {publicKey.slice(0, 8)}…
            </p>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}