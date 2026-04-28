"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Map, Trash2, ArrowRight, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatXLM } from "@/lib/utils";
import type { Trip } from "@/types/trip";

/* ─── Color palette for member initials ─── */
const MEMBER_COLORS = [
  "#2DD4BF", "#6366F1", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#14B8A6", "#F97316", "#06B6D4", "#84CC16",
];

function getMemberColor(index: number): string {
  return MEMBER_COLORS[index % MEMBER_COLORS.length];
}

function getInitial(name: string): string {
  return name?.trim().charAt(0).toUpperCase() || "?";
}

/* ─── Props ─── */
interface TripCardProps {
  trip: Trip;
  expenseCount: number;
  totalXLM: number;
  onDelete: (id: string) => void;
  index: number;
}

/* ─── Component ─── */
export default function TripCard({
  trip,
  expenseCount,
  totalXLM,
  onDelete,
  index,
}: TripCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const memberCount = trip.members.length;
  const maxAvatars = 4;
  const visibleMembers = trip.members.slice(0, maxAvatars);
  const extraCount = memberCount - maxAvatars;

  const dateStr = new Date(trip.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    try {
      await onDelete(trip.id);
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  }, [onDelete, trip.id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group bg-white rounded-2xl border border-[#E5E5E5] hover:border-[#D0D0D0] hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
    >
      <div className="p-4 sm:p-5">
        {/* Top Row */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#2DD4BF]/10 flex items-center justify-center shrink-0">
            <Map className="w-5 h-5 text-[#2DD4BF]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-[#0F0F14] truncate">
              {trip.name}
            </h3>
            {trip.description && (
              <p className="text-[11px] text-[#888] truncate mt-0.5">
                {trip.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {trip.settled ? (
              <Badge variant="success" size="sm">
                <CheckCircle2 className="w-3 h-3" />
                Settled
              </Badge>
            ) : (
              <Badge variant="dark" size="sm">
                Active
              </Badge>
            )}
            {/* Delete (hover only) */}
            <button
              onClick={(e) => {
                e.preventDefault();
                setShowConfirm(true);
              }}
              className="p-1.5 rounded-lg text-[#E5E5E5] hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
              title="Delete trip"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Middle: Stats */}
        <p className="text-xs text-[#888] mb-3">
          {expenseCount} expense{expenseCount !== 1 ? "s" : ""} ·{" "}
          {totalXLM.toFixed(2)} XLM total · {memberCount} member
          {memberCount !== 1 ? "s" : ""}
        </p>

        {/* Members Row */}
        <div className="flex items-center gap-1 mb-3">
          {visibleMembers.map((member, idx) => (
            <div
              key={member.id}
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 border-2 border-white -ml-1 first:ml-0"
              style={{ backgroundColor: getMemberColor(idx), zIndex: maxAvatars - idx }}
              title={member.name}
            >
              {getInitial(member.name)}
            </div>
          ))}
          {extraCount > 0 && (
            <div className="w-7 h-7 rounded-full flex items-center justify-center bg-[#F6F6F6] text-[10px] font-bold text-[#888] border-2 border-white -ml-1">
              +{extraCount}
            </div>
          )}
        </div>

        {/* Bottom Row */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[#AAAAAA]">Created {dateStr}</span>
          <Link
            href={`/trips/${trip.id}`}
            className="flex items-center gap-1 text-xs font-semibold text-[#2DD4BF] hover:underline transition-colors"
          >
            View Trip
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        </div>
      </div>

      {/* Delete Confirm */}
      {showConfirm && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border-t border-red-200">
          <p className="text-xs text-red-700 flex-1">
            Delete <strong>&quot;{trip.name}&quot;</strong>? Cannot be undone.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowConfirm(false)}
            className="text-xs"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            loading={deleting}
            onClick={handleDelete}
            className="text-xs"
          >
            Delete
          </Button>
        </div>
      )}
    </motion.div>
  );
}
