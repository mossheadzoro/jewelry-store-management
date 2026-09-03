"use client";

import React from "react";
import Link from "next/link";
import { IconAlertTriangle, IconHome } from "@tabler/icons-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-onyx-background text-platinum p-6">
      <div className="max-w-md w-full text-center space-y-4 p-8 rounded-2xl bg-onyx-surface border border-onyx-border shadow-xl">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
          <IconAlertTriangle className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold text-platinum">Page Not Found (404)</h1>
        <p className="text-sm text-platinum-muted">
          The page or transaction record you are looking for does not exist or has been moved.
        </p>
        <div className="pt-2">
          <Link
            href="/sales"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold text-onyx font-bold text-sm hover:brightness-110 transition-all shadow-md shadow-gold/20"
          >
            <IconHome className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
