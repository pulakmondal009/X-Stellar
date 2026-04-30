"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, CheckCircle2, Zap, Wallet, ArrowRight, User, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useWalletContext } from "@/context/WalletContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { StellarStarLogo } from "@/components/ui/Logo";
import { formatAddress } from "@/lib/utils";

export default function AuthPage() {
  const router = useRouter();
  const { publicKey, isConnected, isConnecting, connect } = useWalletContext();
  const { signUp, signIn } = useAuth();
  const toast = useToast();

  const [isSignUpMode, setIsSignUpMode] = useState(true);
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      if (isSignUpMode) {
        if (!displayName.trim()) {
          setError("Please enter your name.");
          setIsSubmitting(false);
          return;
        }
        await signUp(displayName.trim());
        toast.success("Account created!", "Welcome to Stellar-star.");
      } else {
        const user = await signIn();
        if (!user) {
          setError("No account found for this wallet. Please sign up first.");
          setIsSubmitting(false);
          return;
        }
        toast.success("Welcome back!", "Signed in successfully.");
      }
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      // Duplicate wallet — auto switch to sign-in
      if (msg.includes("already registered") || msg.includes("23505") || msg.includes("duplicate")) {
        setIsSignUpMode(false);
        setError("This wallet already has an account. Please sign in.");
      } else {
        setError(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [isSignUpMode, displayName, signUp, signIn, toast, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F6F6F6] relative px-4">
      {/* Background */}
      <div className="absolute inset-0 bg-hero-grid bg-[length:40px_40px] opacity-40" />
      <div className="absolute inset-0 bg-radial-lime" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 bg-white rounded-3xl max-w-lg w-full shadow-[0_8px_60px_-12px_rgba(0,0,0,0.25)] p-6 sm:p-10"
      >
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <StellarStarLogo size="lg" />
        </div>

        <AnimatePresence mode="wait">
          {!isConnected ? (
            /* ─── PHASE 1: Connect Wallet ─── */
            <motion.div
              key="connect"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Badge */}
              <div className="flex justify-center mb-5">
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#2DD4BF]/10 border border-[#2DD4BF]/30 text-xs font-semibold text-[#134E4A]">
                  <Shield className="w-3.5 h-3.5" />
                  Secure Wallet Authentication
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-[#0F0F14] text-center mb-2">
                Welcome to Stellar-star
              </h1>
              <p className="text-[#888] text-center text-sm mb-8">
                Connect your Stellar wallet to get started
              </p>

              {/* Info rows */}
              <div className="space-y-3 mb-8">
                <div className="bg-[#F6F6F6] rounded-xl p-4 flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#2DD4BF] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-[#0F0F14]">No passwords needed</p>
                    <p className="text-xs text-[#888]">Your wallet is your identity</p>
                  </div>
                </div>
                <div className="bg-[#F6F6F6] rounded-xl p-4 flex gap-3">
                  <Zap className="w-5 h-5 text-[#2DD4BF] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-[#0F0F14]">Instant authentication</p>
                    <p className="text-xs text-[#888]">Sign in with one click</p>
                  </div>
                </div>
              </div>

              {/* Connect Button */}
              <button
                onClick={connect}
                disabled={isConnecting}
                className="w-full h-14 rounded-2xl bg-[#0F0F14] text-white font-semibold text-sm flex items-center justify-center gap-3 hover:bg-[#1A1A22] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-dark-card disabled:opacity-50"
              >
                {isConnecting ? (
                  <>
                    <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="w-5 h-5" />
                    Connect Freighter Wallet
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Footer */}
              <p className="text-center text-xs text-[#888] mt-6">
                Don&apos;t have Freighter wallet?{" "}
                <a
                  href="https://www.freighter.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#2DD4BF] font-semibold hover:underline"
                >
                  Download here →
                </a>
              </p>
            </motion.div>
          ) : (
            /* ─── PHASE 2: Sign Up / Sign In ─── */
            <motion.div
              key="auth"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Toggle Tabs */}
              <div className="bg-[#F6F6F6] rounded-xl p-1 flex mb-8">
                {["Sign Up", "Sign In"].map((label, i) => {
                  const active = i === 0 ? isSignUpMode : !isSignUpMode;
                  return (
                    <button
                      key={label}
                      onClick={() => { setIsSignUpMode(i === 0); setError(null); }}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                        active
                          ? "bg-white text-[#0F0F14] shadow-sm"
                          : "text-[#888] hover:text-[#555]"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Wallet Address Display */}
              <div className="bg-gradient-to-r from-[#2DD4BF]/10 to-[#0D9488]/10 rounded-2xl p-4 mb-6 border border-[#2DD4BF]/20">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="w-4 h-4 text-[#2DD4BF]" />
                  <span className="text-[10px] font-semibold text-[#134E4A] uppercase tracking-wider">
                    Connected Wallet
                  </span>
                </div>
                <div className="bg-white rounded-xl px-3.5 py-2.5">
                  <p className="text-xs font-mono text-[#333] truncate">
                    {publicKey}
                  </p>
                </div>
              </div>

              {/* Sign Up: Name Input */}
              <AnimatePresence>
                {isSignUpMode && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden mb-6"
                  >
                    <Input
                      label="Your Name *"
                      placeholder="Enter your full name"
                      hint="This name will be visible to other members"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      leading={<User className="w-4 h-4" />}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="mb-6 bg-red-500/10 border border-red-200 rounded-xl p-3.5 flex items-start gap-2.5"
                  >
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-600">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full h-14 rounded-2xl bg-[#0F0F14] text-white font-semibold text-sm flex items-center justify-center gap-3 hover:bg-[#1A1A22] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-dark-card disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {isSignUpMode ? "Create Account" : "Sign In"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Footer */}
              <p className="text-center text-xs text-[#888] mt-6">
                Your wallet address is your identity. No passwords needed.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
