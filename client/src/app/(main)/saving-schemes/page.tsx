import { Suspense } from "react";
import SchemesPageClient from "../../../../components/SavingSchemes/SchemesPageClient";

export default function SavingSchemesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0A0B] text-white p-8">Loading Saving Schemes...</div>}>
      <SchemesPageClient />
    </Suspense>
  );
}
