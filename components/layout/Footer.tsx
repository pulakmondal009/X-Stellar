"use client";

import React from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { StellarStarLogo } from "@/components/ui/Logo";

const PRODUCT_LINKS = [
  { label: "Expenses", href: "/expenses" },
  { label: "Trips", href: "/trips" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Pricing", href: "#pricing" },
];

const PROTOCOL_LINKS = [
  { label: "Stellar.org", href: "https://stellar.org" },
  { label: "Freighter Wallet", href: "https://www.freighter.app" },
  { label: "Horizon API", href: "https://developers.stellar.org/docs/data/horizon" },
  { label: "Soroban Docs", href: "https://soroban.stellar.org" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
  { label: "Contact", href: "#" },
];

const BADGES = [
  { label: "Stellar", abbr: "XLM" },
  { label: "Freighter", abbr: "FRT" },
  { label: "Soroban", abbr: "SRB" },
];

export default function Footer() {
  return (
    <footer className="bg-[#0F0F14] text-white relative overflow-hidden">
      {/* Subtle grid overlay */}
      <div className="absolute inset-0 bg-grid-dark opacity-40 pointer-events-none" />
      <div className="absolute inset-0 bg-radial-dark pointer-events-none" />

      <div className="relative z-10 container-max section-padding">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Column 1 — Brand */}
          <div className="lg:col-span-1 space-y-5">
            <StellarStarLogo variant="white" />
            <p className="text-sm text-white/50 leading-relaxed max-w-xs">
              Decentralized bill splitting on the Stellar Network.
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              {BADGES.map((badge) => (
                <span key={badge.abbr}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-medium text-white/40 tracking-wider uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2DD4BF]" />
                  {badge.abbr}
                </span>
              ))}
            </div>
          </div>

          {/* Column 2 — Product */}
          <div>
            <h4 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-4">Product</h4>
            <ul className="space-y-3">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.label}>
                  <Link href={link.href}
                    className="text-sm text-white/40 hover:text-[#2DD4BF] transition-colors duration-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 — Protocol */}
          <div>
            <h4 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-4">Protocol</h4>
            <ul className="space-y-3">
              {PROTOCOL_LINKS.map((link) => (
                <li key={link.label}>
                  <a href={link.href} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-[#2DD4BF] transition-colors duration-200">
                    {link.label}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 — Legal */}
          <div>
            <h4 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-4">Legal</h4>
            <ul className="space-y-3">
              {LEGAL_LINKS.map((link) => (
                <li key={link.label}>
                  <a href={link.href}
                    className="text-sm text-white/40 hover:text-[#2DD4BF] transition-colors duration-200">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/30">
            © 2025 X-Stellar. Built on Stellar.
          </p>
          <p className="text-xs text-white/20">
            Not financial advice. Use on Testnet.
          </p>
        </div>
      </div>
    </footer>
  );
}
