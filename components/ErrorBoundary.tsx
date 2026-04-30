"use client";

import React from "react";
import Link from "next/link";
import { XCircle } from "lucide-react";

type Props = {
  children: React.ReactNode;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Unhandled UI error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F6F6F6] px-6 py-12">
          <div className="w-full max-w-lg rounded-3xl border border-[#E5E5E5] bg-white p-8 shadow-card text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <XCircle className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold text-[#0F0F14]">Something went wrong</h1>
            <p className="mt-2 text-sm text-[#666]">
              The page hit an unexpected error. You can reload it or return home.
            </p>
            {process.env.NODE_ENV !== "production" && this.state.error && (
              <pre className="mt-4 overflow-x-auto rounded-2xl bg-[#0F0F14] px-4 py-3 text-left text-xs text-[#F6F6F6]">
                {this.state.error.message}
              </pre>
            )}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center rounded-2xl bg-[#2DD4BF] px-5 py-3 text-sm font-semibold text-[#0F0F14] transition-colors hover:bg-[#14B8A6]"
              >
                Reload page
              </button>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-2xl border border-[#E5E5E5] bg-white px-5 py-3 text-sm font-semibold text-[#0F0F14] transition-colors hover:bg-[#F6F6F6]"
              >
                Go Home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}