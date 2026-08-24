"use client";

import React, { Suspense } from "react";
import Link from "next/navigation";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { ShieldAlert, ArrowLeft, LogOut, Home, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

function UnauthorizedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const reason = searchParams.get("reason");
  const userRole = session?.user?.role || "Staff Member";

  const getReasonDetails = () => {
    switch (reason) {
      case "settings":
        return {
          title: "System Settings Restricted",
          description:
            "Access to business configurations, financial rules, and system settings is restricted exclusively to Store Managers and Administrators.",
          requiredRole: "Manager or Administrator",
        };
      case "staff":
        return {
          title: "Staff Management Restricted",
          description:
            "Managing personnel roster, role assignments, and salary details requires Managerial or Administrative privileges.",
          requiredRole: "Manager or Administrator",
        };
      case "admin":
        return {
          title: "Administrator Privileges Required",
          description:
            "This operation or section is strictly reserved for Head Office Administrators.",
          requiredRole: "Administrator",
        };
      default:
        return {
          title: "Access Restricted",
          description:
            "Your user account does not have sufficient clearance to access this department or operational view.",
          requiredRole: "Elevated Role Required",
        };
    }
  };

  const details = getReasonDetails();

  return (
    <div className="min-h-screen bg-[#09090b] text-foreground flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background glowing ambient effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-b from-[#d4a843]/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-lg w-full bg-[#121215]/90 border border-[#27272a] shadow-[0_0_50px_-10px_rgba(0,0,0,0.8)] rounded-2xl p-8 relative z-10 text-center space-y-6">
        {/* Shield Icon Badge */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-red-500/10 border border-amber-500/30 flex items-center justify-center shadow-inner">
          <ShieldAlert className="w-8 h-8 text-[#d4a843]" />
        </div>

        {/* Title and Description */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#d4a843] text-[11px] font-semibold tracking-wide uppercase">
            <Lock className="w-3 h-3" />
            <span>Security Clearance 403</span>
          </div>

          <h1 className="text-[22px] font-semibold text-platinum tracking-tight">
            {details.title}
          </h1>

          <p className="text-[13px] text-zinc-400 leading-relaxed max-w-md mx-auto">
            {details.description}
          </p>
        </div>

        {/* Current User Role Info */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 text-left space-y-2 text-[12px]">
          <div className="flex items-center justify-between text-zinc-400">
            <span>Signed In As:</span>
            <span className="text-platinum font-medium">{session?.user?.name || session?.user?.email || "Authenticated User"}</span>
          </div>
          <div className="flex items-center justify-between text-zinc-400">
            <span>Your Assigned Role:</span>
            <span className="px-2 py-0.5 rounded bg-zinc-800 text-[#d4a843] font-semibold text-[11px] border border-zinc-700">
              {userRole}
            </span>
          </div>
          <div className="flex items-center justify-between text-zinc-400">
            <span>Required Clearance:</span>
            <span className="text-zinc-300 font-medium">{details.requiredRole}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            onClick={() => router.push("/dashboard")}
            className="w-full sm:w-auto bg-gradient-to-r from-[#d4a843] to-[#b88628] hover:from-[#e0b853] hover:to-[#c79532] text-black font-semibold text-[13px] h-10 px-5 rounded-xl shadow-lg shadow-[#d4a843]/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            <Home className="w-4 h-4 text-black" />
            <span>Return to Dashboard</span>
          </Button>

          <Button
            onClick={() => signOut({ callbackUrl: "/login" })}
            variant="outline"
            className="w-full sm:w-auto border-[#27272a] bg-[#18181b] text-zinc-300 hover:text-white hover:bg-zinc-800 text-[13px] h-10 px-4 rounded-xl flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4 text-zinc-400" />
            <span>Switch Account</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function UnauthorizedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09090b] flex items-center justify-center text-zinc-400">Verifying security clearances...</div>}>
      <UnauthorizedContent />
    </Suspense>
  );
}
