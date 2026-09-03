"use client";

import React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-[#0f1117] text-white flex items-center justify-center min-h-screen p-6">
        <div className="max-w-md w-full text-center space-y-4 p-8 rounded-2xl bg-[#161922] border border-[#272b3a] shadow-xl">
          <h2 className="text-xl font-bold">System Error</h2>
          <p className="text-sm text-gray-400">
            A critical error occurred. Please reload the application.
          </p>
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-xl bg-amber-400 text-black font-bold text-sm hover:brightness-110 transition-all"
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
