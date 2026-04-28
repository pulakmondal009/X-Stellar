"use client";

import React, { useState, useMemo, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { isValidStellarAddress } from "@/lib/split/calculator";
import type { Member } from "@/types/expense";

/* ─── Helpers ─── */
function blankMember(): Member {
  return {
    id: crypto.randomUUID(),
    name: "",
    walletAddress: "",
    weight: 1,
  };
}

/* ─── Types ─── */
interface FieldErrors {
  name?: string;
  members?: Record<string, { name?: string; walletAddress?: string }>;
  general?: string;
}

interface TripFormProps {
  currentUserPublicKey?: string | null;
  currentUserName?: string;
  onSubmit: (data: { name: string; description?: string; members: Member[] }) => void;
  onCancel?: () => void;
}

/* ─── Component ─── */
export default function TripForm({
  currentUserPublicKey,
  currentUserName,
  onSubmit,
  onCancel,
}: TripFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const initialMembers = useMemo(() => {
    return [
      {
        id: crypto.randomUUID(),
        name: currentUserName || "",
        walletAddress: currentUserPublicKey || "",
        weight: 1,
      },
      blankMember(),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [members, setMembers] = useState<Member[]>(initialMembers);

  // ─── Member Mutations ───
  const updateMember = useCallback(
    (id: string, updates: Partial<Member>) => {
      setMembers((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
      );
    },
    []
  );

  const removeMember = useCallback((id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const addMember = useCallback(() => {
    setMembers((prev) => [...prev, blankMember()]);
  }, []);

  // ─── Validation ───
  const validate = useCallback((): boolean => {
    const errs: FieldErrors = {};
    const memberErrors: FieldErrors["members"] = {};

    if (!name.trim()) {
      errs.name = "Trip name is required";
    }

    if (members.length < 2) {
      errs.general = "At least 2 members are required";
    }

    members.forEach((m) => {
      const mErr: { name?: string; walletAddress?: string } = {};

      if (!m.name.trim()) {
        mErr.name = "Name required";
      }

      // Wallet address optional — warn but allow
      if (m.walletAddress.trim() && !isValidStellarAddress(m.walletAddress)) {
        mErr.walletAddress = "Invalid Stellar address (G...)";
      }

      if (Object.keys(mErr).length > 0) {
        memberErrors![m.id] = mErr;
      }
    });

    if (Object.keys(memberErrors!).length > 0) {
      errs.members = memberErrors;
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [name, members]);

  // ─── Submit ───
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;

      setSubmitting(true);
      try {
        onSubmit({
          name: name.trim(),
          description: description.trim() || undefined,
          members: members.filter((m) => m.name.trim()),
        });
      } finally {
        setSubmitting(false);
      }
    },
    [validate, onSubmit, name, description, members]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Error Summary */}
      {errors.general && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {errors.general}
        </div>
      )}

      {/* Trip Name */}
      <Input
        label="Trip Name *"
        placeholder="Weekend in Goa"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        id="trip-name"
      />

      {/* Description */}
      <Textarea
        label="Description"
        placeholder="Notes about the trip…"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        id="trip-description"
      />

      {/* Members */}
      <div className="space-y-1.5">
        <label className="block text-[10px] font-semibold text-[#888] uppercase tracking-wider">
          Members
        </label>

        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {members.map((member) => {
              const mErrors = errors.members?.[member.id];

              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="flex gap-2 items-start p-3 rounded-xl border border-[#E5E5E5] bg-[#FAFAFA]">
                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        placeholder="Name"
                        value={member.name}
                        onChange={(e) =>
                          updateMember(member.id, { name: e.target.value })
                        }
                        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-[#0F0F14] placeholder:text-[#AAAAAA] transition-all duration-200 focus:outline-none focus:border-[#2DD4BF] focus:ring-2 focus:ring-[#2DD4BF]/20 ${
                          mErrors?.name ? "border-red-300" : "border-[#E5E5E5]"
                        }`}
                      />
                      {mErrors?.name && (
                        <p className="text-[10px] text-red-500 mt-0.5">
                          {mErrors.name}
                        </p>
                      )}
                    </div>

                    {/* Wallet Address */}
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        placeholder="G... wallet address (optional)"
                        value={member.walletAddress}
                        onChange={(e) =>
                          updateMember(member.id, {
                            walletAddress: e.target.value,
                          })
                        }
                        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm font-mono text-[#0F0F14] placeholder:text-[#AAAAAA] transition-all duration-200 focus:outline-none focus:border-[#2DD4BF] focus:ring-2 focus:ring-[#2DD4BF]/20 ${
                          mErrors?.walletAddress
                            ? "border-red-300"
                            : "border-[#E5E5E5]"
                        }`}
                      />
                      {mErrors?.walletAddress && (
                        <p className="text-[10px] text-red-500 mt-0.5">
                          {mErrors.walletAddress}
                        </p>
                      )}
                    </div>

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => removeMember(member.id)}
                      disabled={members.length <= 2}
                      className="p-2 rounded-lg text-[#888] hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Add Member */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addMember}
          className="w-full mt-1"
        >
          <Plus className="w-4 h-4" />
          Add Member
        </Button>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={submitting}
          className="flex-1"
        >
          {submitting ? "Creating..." : "Create Trip"}
        </Button>
      </div>
    </form>
  );
}
