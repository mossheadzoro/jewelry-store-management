import { Suspense } from "react";
import GlobalSearchPage from "@/components/Search/GlobalSearchPage";

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0A0B] text-foreground p-8">Loading Search Engine...</div>}>
      <GlobalSearchPage />
    </Suspense>
  );
}
