"use client";

import React, { useState, useMemo, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Equal,
  Scale,
  PenLine,
  Trash2,
  Plus,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import SplitCalculator from "./SplitCalculator";
import { useExpense } from "@/context/ExpenseContext";
import { useToast } from "@/components/ui/Toast";
import {
  calculateSplit,
  isValidXLMAmount,
  isValidStellarAddress,
} from "@/lib/split/calculator";
import type { Member, SplitMode, Expense, SplitShare } from "@/types/expense";

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
  title?: string;
  totalAmount?: string;
  members?: Record<string, { name?: string; walletAddress?: string; weight?: string }>;
  general?: string;
}

interface ExpenseFormProps {
  currentUserPublicKey: string | null;
  currentUserName: string;
  defaultMembers?: Member[];
  tripId?: string;
  onSuccess?: (id: string) => void;
  onCancel?: () => void;
}

/* ─── Split Mode Config ─── */
const SPLIT_MODES: { value: SplitMode; label: string; icon: typeof Equal }[] = [
  { value: "equal", label: "Equal", icon: Equal },
  { value: "weighted", label: "Weighted", icon: Scale },
  { value: "custom", label: "Custom", icon: PenLine },
];

/* ─── Component ─── */
export default function ExpenseForm({
  currentUserPublicKey,
  currentUserName,
  defaultMembers,
  tripId,
  onSuccess,
  onCancel,
}: ExpenseFormProps) {
  const { addExpense } = useExpense();
  const toast = useToast();

  // ─── State ───
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [splitMode, setSplitMode] = useState<SplitMode>("equal");
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const initialMembers = useMemo(() => {
    if (defaultMembers && defaultMembers.length >= 2) {
      return defaultMembers;
    }
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
  const [paidByMemberId, setPaidByMemberId] = useState<string>(
    initialMembers[0]?.id ?? ""
  );

  // ─── Live Split Preview ───
  const shares: SplitShare[] = useMemo(() => {
    const amt = parseFloat(totalAmount);
    if (isNaN(amt) || amt <= 0) return [];
    const namedMembers = members.filter((m) => m.name.trim().length > 0);
    if (namedMembers.length < 2) return [];
    return calculateSplit(amt, namedMembers, paidByMemberId, splitMode);
  }, [totalAmount, members, paidByMemberId, splitMode]);

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
    setMembers((prev) => {
      const next = prev.filter((m) => m.id !== id);
      return next;
    });
    setPaidByMemberId((prev) => {
      if (prev === id) {
        const remaining = members.filter((m) => m.id !== id);
        return remaining[0]?.id ?? "";
      }
      return prev;
    });
  }, [members]);

  const addMember = useCallback(() => {
    setMembers((prev) => [...prev, blankMember()]);
  }, []);

  // ─── Validation ───
  const validate = useCallback((): boolean => {
    const errs: FieldErrors = {};
    const memberErrors: FieldErrors["members"] = {};

    if (!title.trim()) {
      errs.title = "Title is required";
    }

    if (!totalAmount.trim() || !isValidXLMAmount(totalAmount)) {
      errs.totalAmount = "Enter a valid XLM amount (> 0)";
    }

    if (members.length < 2) {
      errs.general = "At least 2 members are required";
    }

    members.forEach((m) => {
      const mErr: { name?: string; walletAddress?: string; weight?: string } = {};

      if (!m.name.trim()) {
        mErr.name = "Name required";
      }

      if (!m.walletAddress.trim()) {
        mErr.walletAddress = "Wallet address required";
      } else if (!isValidStellarAddress(m.walletAddress)) {
        mErr.walletAddress = "Invalid Stellar address (G...)";
      }

      if (splitMode === "weighted" && (m.weight === undefined || m.weight <= 0)) {
        mErr.weight = "Weight must be > 0";
      }

      if (splitMode === "custom" && members.find((x) => x.id === paidByMemberId)?.id !== m.id) {
        if (m.weight === undefined || m.weight < 0) {
          mErr.weight = "Amount must be ≥ 0";
        }
      }

      if (Object.keys(mErr).length > 0) {
        memberErrors![m.id] = mErr;
      }
    });

    if (Object.keys(memberErrors!).length > 0) {
      errs.members = memberErrors;
    }

    const payerExists = members.some((m) => m.id === paidByMemberId);
    if (!payerExists) {
      errs.general = "Please select who paid";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [title, totalAmount, members, splitMode, paidByMemberId]);

  // ─── Submit ───
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;

      setSubmitting(true);
      try {
        const amt = parseFloat(totalAmount);
        const namedMembers = members.filter((m) => m.name.trim().length > 0);
        const computedShares = calculateSplit(
          amt,
          namedMembers,
          paidByMemberId,
          splitMode
        );

        const now = new Date().toISOString();
        const expense: Expense = {
          id: crypto.randomUUID(),
          title: title.trim(),
          description: description.trim() || undefined,
          totalAmount: amt.toFixed(7),
          splitMode,
          members: namedMembers,
          shares: computedShares,
          paidByMemberId,
          settled: false,
          createdAt: now,
          updatedAt: now,
          tripId,
        };

        await addExpense(expense);
        toast.success("Expense Created", `"${expense.title}" has been saved.`);
        onSuccess?.(expense.id);
      } catch (err) {
        console.error("Failed to create expense:", err);
        toast.error("Error", "Failed to create expense. Please try again.");
      } finally {
        setSubmitting(false);
      }
    },
    [
      validate,
      totalAmount,
      members,
      paidByMemberId,
      splitMode,
      title,
      description,
      tripId,
      addExpense,
      toast,
      onSuccess,
    ]
  );

  const payerMember = members.find((m) => m.id === paidByMemberId);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Error Summary */}
      {errors.general && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {errors.general}
        </div>
      )}

      {/* Title */}
      <Input
        label="Title *"
        placeholder="e.g. Dinner at Olive Garden"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        error={errors.title}
        id="expense-title"
      />

      {/* Description */}
      <Textarea
        label="Description"
        placeholder="Optional notes..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        id="expense-description"
      />

      {/* Total Amount */}
      <Input
        label="Total Amount (XLM) *"
        placeholder="0.00"
        type="text"
        inputMode="decimal"
        value={totalAmount}
        onChange={(e) => setTotalAmount(e.target.value)}
        error={errors.totalAmount}
        id="expense-amount"
        trailing={
          <span className="text-xs font-semibold text-[#888]">XLM</span>
        }
      />

      {/* Split Mode Selector */}
      <div className="space-y-1.5">
        <label className="block text-[10px] font-semibold text-[#888] uppercase tracking-wider">
          Split Mode
        </label>
        <div className="flex gap-2">
          {SPLIT_MODES.map((mode) => {
            const isActive = splitMode === mode.value;
            const Icon = mode.icon;
            return (
              <button
                key={mode.value}
                type="button"
                onClick={() => setSplitMode(mode.value)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                  isActive
                    ? "bg-[#0F0F14] text-[#2DD4BF] border-[#0F0F14] shadow-dark-card"
                    : "bg-white text-[#888] border-[#E5E5E5] hover:border-[#2DD4BF]/40 hover:text-[#0F0F14]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {mode.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Paid By */}
      <div className="space-y-1.5">
        <label
          htmlFor="paid-by-select"
          className="block text-[10px] font-semibold text-[#888] uppercase tracking-wider"
        >
          Paid by
        </label>
        <select
          id="paid-by-select"
          value={paidByMemberId}
          onChange={(e) => setPaidByMemberId(e.target.value)}
          className="w-full rounded-xl border border-[#E5E5E5] bg-white px-3.5 py-2.5 text-sm text-[#0F0F14] transition-all duration-200 focus:outline-none focus:border-[#2DD4BF] focus:ring-2 focus:ring-[#2DD4BF]/20 appearance-none cursor-pointer"
        >
          {members
            .filter((m) => m.name.trim())
            .map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
        </select>
      </div>

      {/* Members */}
      <div className="space-y-1.5">
        <label className="block text-[10px] font-semibold text-[#888] uppercase tracking-wider">
          Members
        </label>

        <div className="space-y-2">
          <AnimatePresence initial={false}>
            {members.map((member, idx) => {
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
                        placeholder="G... wallet address"
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

                    {/* Weight (if weighted/custom) */}
                    {(splitMode === "weighted" || splitMode === "custom") && (
                      <div className="w-20 shrink-0">
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          placeholder={splitMode === "weighted" ? "Wt" : "Amt"}
                          value={member.weight ?? ""}
                          onChange={(e) =>
                            updateMember(member.id, {
                              weight: parseFloat(e.target.value) || 0,
                            })
                          }
                          className={`w-full rounded-lg border bg-white px-2 py-2 text-sm text-center text-[#0F0F14] placeholder:text-[#AAAAAA] transition-all duration-200 focus:outline-none focus:border-[#2DD4BF] focus:ring-2 focus:ring-[#2DD4BF]/20 ${
                            mErrors?.weight
                              ? "border-red-300"
                              : "border-[#E5E5E5]"
                          }`}
                        />
                        {mErrors?.weight && (
                          <p className="text-[10px] text-red-500 mt-0.5">
                            {mErrors.weight}
                          </p>
                        )}
                      </div>
                    )}

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

      {/* Live Split Preview */}
      {shares.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <SplitCalculator
            shares={shares}
            payerName={payerMember?.name || "Payer"}
            payerWalletAddress={payerMember?.walletAddress}
            totalAmount={parseFloat(totalAmount).toFixed(7)}
            expenseTitle={title || "Untitled"}
          />
        </motion.div>
      )}

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
          variant="dark"
          size="md"
          loading={submitting}
          className="flex-1"
        >
          {submitting ? "Saving..." : "Save Expense"}
        </Button>
      </div>
    </form>
  );
}
