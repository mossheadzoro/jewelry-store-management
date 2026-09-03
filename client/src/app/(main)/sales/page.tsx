import { Suspense } from "react";
import SalesPageClient from "@/components/Sales/SalesPageClient";

export default function SalesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0A0B] text-foreground p-8">Loading Sales Panel...</div>}>
      <SalesPageClient />
    </Suspense>
  );
}
