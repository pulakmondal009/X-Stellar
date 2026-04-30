"use client";

import React, { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZES = { sm: "sm:max-w-sm", md: "sm:max-w-md", lg: "sm:max-w-lg", xl: "sm:max-w-2xl" };

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: keyof typeof SIZES;
  disableBackdropClose?: boolean;
  className?: string;
}

export function Modal({ open, onClose, title, description, children, size = "md", disableBackdropClose = false, className }: ModalProps) {
  // Body scroll lock
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleBackdropClick = useCallback(() => {
    if (!disableBackdropClose) onClose();
  }, [disableBackdropClose, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={handleBackdropClick} />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "relative z-10 w-full bg-white flex flex-col",
              "rounded-t-2xl sm:rounded-2xl",
              "max-h-[92dvh] overflow-hidden",
              "shadow-xl border border-[#E5E5E5]",
              SIZES[size],
              className
            )}
          >
            {/* Mobile drag handle */}
            <div className="sm:hidden flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-[#E5E5E5]" />
            </div>

            {/* Header */}
            {(title || description) && (
              <div className="px-6 pt-4 sm:pt-6 pb-3 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {title && <h2 className="text-lg font-bold text-[#0F0F14] truncate">{title}</h2>}
                  {description && <p className="text-sm text-[#888] mt-0.5">{description}</p>}
                </div>
                <button onClick={onClose}
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#F6F6F6] transition-colors shrink-0">
                  <X className="w-4 h-4 text-[#888]" />
                </button>
              </div>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

/* ─── Modal Footer Helper ─── */
export function ModalFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("border-t border-[#E5E5E5] pt-4 mt-4 flex items-center justify-end gap-2", className)}>
      {children}
    </div>
  );
}
