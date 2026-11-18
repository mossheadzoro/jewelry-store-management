"use client";

import React from "react";
import { UserCircle } from "lucide-react";

export default function AccountPanel() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-onyx-surface rounded-xl gold-border p-8 text-center min-h-[400px] flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mb-4">
          <UserCircle className="w-8 h-8 text-gold" />
        </div>
        <h2 className="text-[20px] font-heading font-semibold text-platinum mb-2">Account Settings</h2>
        <p className="text-[13px] text-platinum-muted max-w-sm mx-auto">
          Manage your personal information, profile picture, and account preferences here.
        </p>
      </div>
    </div>
  );
}
