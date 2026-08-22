// client/src/app/(main)/rfid/layout.tsx
"use client";

import React from "react";
import { RFIDSidebar, RFIDMobileNav } from "@/components/RFID/RFIDSidebar";

export default function RFIDLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col md:flex-row w-full min-h-screen bg-onyx overflow-hidden">
      {/* Mobile Sticky Navigation Header for RFID features */}
      <RFIDMobileNav />

      {/* Desktop Dedicated RFID Sub-Sidebar */}
      <RFIDSidebar />

      {/* Main RFID Feature Content Workspace */}
      <main className="flex-1 min-w-0 overflow-y-auto bg-onyx">
        {children}
      </main>
    </div>
  );
}
