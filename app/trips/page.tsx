"use client";

import React, { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Map,
  Plus,
  Inbox,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import AuthGuard from "@/components/auth/AuthGuard";
import ConnectWalletButton from "@/components/wallet/ConnectWalletButton";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import TripCard from "@/components/trips/TripCard";
import TripForm from "@/components/trips/TripForm";
import { useWalletContext } from "@/context/WalletContext";
import { useAuth } from "@/context/AuthContext";
import { useTrip } from "@/context/TripContext";
import { useExpense } from "@/context/ExpenseContext";
import { useToast } from "@/components/ui/Toast";
import type { Trip } from "@/types/trip";

/* ═══════════════════════════════════════════════════
   EmptyState
   ═══════════════════════════════════════════════════ */
function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-20 px-6 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-[#F6F6F6] flex items-center justify-center mb-5">
        <Inbox className="w-8 h-8 text-[#E5E5E5]" />
      </div>
      <h3 className="text-lg font-bold text-[#0F0F14] mb-1">No trips yet</h3>
      <p className="text-sm text-[#888] mb-6 max-w-xs">
        Create a trip to group expenses together and settle with friends on the
        Stellar network.
      </p>
      <Button variant="dark" size="md" onClick={onAdd}>
        <Plus className="w-4 h-4" />
        New Trip
      </Button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   Trips View
   ═══════════════════════════════════════════════════ */
function TripsView() {
  const { publicKey } = useWalletContext();
  const { user } = useAuth();
  const { trips, isLoading, addTrip, deleteTrip } = useTrip();
  const { expenses } = useExpense();
  const toast = useToast();

  const [modalOpen, setModalOpen] = useState(false);

  const currentUserName = user?.displayName || "You";

  // Compute per-trip stats
  const tripStats = useMemo(() => {
    const stats: Record<string, { expenseCount: number; totalXLM: number }> =
      {};
    trips.forEach((trip) => {
      const tripExpenses = expenses.filter((e) =>
        trip.expenseIds.includes(e.id)
      );
      stats[trip.id] = {
        expenseCount: tripExpenses.length,
        totalXLM: tripExpenses.reduce(
          (sum, e) => sum + parseFloat(e.totalAmount || "0"),
          0
        ),
      };
    });
    return stats;
  }, [trips, expenses]);

  const handleFormSubmit = useCallback(
    async (data: { name: string; description?: string; members: any[] }) => {
      const trip: Trip = {
        id: crypto.randomUUID(),
        name: data.name,
        description: data.description,
        members: data.members,
        expenseIds: [],
        createdAt: new Date().toISOString(),
        settled: false,
      };

      await addTrip(trip);
      toast.success("Trip Created", `"${trip.name}" has been saved.`);
      setModalOpen(false);
    },
    [addTrip, toast]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteTrip(id);
      toast.success("Deleted", "Trip has been removed.");
    },
    [deleteTrip, toast]
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 text-[#2DD4BF] animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2DD4BF]/10 flex items-center justify-center">
            <Map className="w-5 h-5 text-[#2DD4BF]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0F0F14]">Trips</h1>
            <p className="text-xs text-[#888]">
              {trips.length} trip{trips.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <Button variant="dark" size="sm" onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4" />
          New Trip
        </Button>
      </div>

      {/* Trip List or Empty State */}
      {trips.length === 0 ? (
        <EmptyState onAdd={() => setModalOpen(true)} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {trips.map((trip, index) => (
              <TripCard
                key={trip.id}
                trip={trip}
                expenseCount={tripStats[trip.id]?.expenseCount ?? 0}
                totalXLM={tripStats[trip.id]?.totalXLM ?? 0}
                onDelete={handleDelete}
                index={index}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* New Trip Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New Trip"
        description="Group expenses together for a trip"
        size="lg"
      >
        <TripForm
          currentUserPublicKey={publicKey}
          currentUserName={currentUserName}
          onSubmit={handleFormSubmit}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </>
  );
}

/* ═══════════════════════════════════════════════════
   Page Export
   ═══════════════════════════════════════════════════ */
export default function TripsPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-[#F6F6F6]">
        {/* Nav */}
        <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-[#E5E5E5]/60">
          <div className="max-w-5xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-sm text-[#888] hover:text-[#0F0F14] transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Link>
            <h2 className="text-sm font-bold text-[#0F0F14] absolute left-1/2 -translate-x-1/2">
              Trips
            </h2>
            <ConnectWalletButton />
          </div>
        </nav>

        {/* Content */}
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          <TripsView />
        </div>
      </div>
    </AuthGuard>
  );
}
