import React from "react";
import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";

import { ToastProvider } from "@/components/ui/Toast";
import { WalletProvider } from "@/context/WalletContext";
import { AuthProvider } from "@/context/AuthContext";
import { ExpenseProvider } from "@/context/ExpenseContext";
import { TripProvider } from "@/context/TripContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-poppins",
});

const getMetadataBase = () => {
  try {
    return new URL(
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://settle-x-pi.vercel.app"
    );
  } catch {
    return new URL("http://localhost:3000");
  }
};

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: "Stellar-star — Split Bills on the Stellar Blockchain",
    template: "%s | Stellar-star",
  },
  description:
    "Stellar-star is a decentralized bill-splitting app built on the Stellar blockchain. Split expenses, pay instantly with XLM, track with QR codes — all trustless, all transparent.",
  keywords: [
    "Stellar",
    "blockchain",
    "bill splitting",
    "crypto payments",
    "XLM",
    "Freighter wallet",
    "decentralized",
    "group expenses",
    "web3",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Stellar-star — Decentralized Bill Splitting",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Stellar-star",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#2DD4BF",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${poppins.variable} font-sans bg-[#F6F6F6] text-[#0F0F14] antialiased`}
      >
        <ErrorBoundary>
          <ToastProvider>
            <WalletProvider>
              <AuthProvider>
                <ExpenseProvider>
                  <TripProvider>{children}</TripProvider>
                </ExpenseProvider>
              </AuthProvider>
            </WalletProvider>
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
