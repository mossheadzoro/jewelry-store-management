"use client";

import React, { useEffect } from "react";
import { IconAlertOctagon, IconRefresh } from "@tabler/icons-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App boundary error:", error);
  }, [error]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-onyx-background text-platinum p-6">
      <div className="max-w-md w-full text-center space-y-4 p-8 rounded-2xl bg-onyx-surface border border-onyx-border shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto">
          <IconAlertOctagon className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-platinum">Something went wrong</h1>
        <p className="text-sm text-platinum-muted">
          An unexpected error occurred while processing this operation.
        </p>
        <div className="pt-2">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold text-onyx font-bold text-sm hover:brightness-110 transition-all shadow-md shadow-gold/20"
          >
            <IconRefresh className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    </div>
  );
}
