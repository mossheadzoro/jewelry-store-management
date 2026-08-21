"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useBranchStore } from "@/lib/store/useBranchStore";
import { Clock, User, FileText, ChevronRight } from "lucide-react";

export default function DraftBillsList() {
  const router = useRouter();
  const { selectedBranch } = useBranchStore();
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedBranch?.id) return;
    
    const fetchDrafts = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/sales/draft?branchId=${selectedBranch.id}`);
        if (res.ok) {
          const data = await res.json();
          setDrafts(data.drafts || []);
        }
      } catch (e) {
        console.error("Failed to fetch drafts", e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDrafts();
  }, [selectedBranch?.id]);

  if (loading) {
    return <div className="animate-pulse h-16 bg-[#111113] border border-[#1F1F24] rounded-xl my-4" />;
  }

  if (drafts.length === 0) {
    return null; // Don't show anything if there are no drafts
  }

  return (
    <div className="mb-6 space-y-3">
      <h3 className="text-sm font-semibold text-[#F0EBE0] flex items-center gap-2">
        <Clock className="w-4 h-4 text-[#C9943A]" />
        Paused Bills ({drafts.length})
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {drafts.map((draft) => (
          <div
            key={draft.id}
            onClick={() => router.push(`/billing/create?draftId=${draft.id}`)}
            className="group cursor-pointer bg-[#111113] border border-[#1F1F24] hover:border-[#C9943A]/50 hover:bg-[#1A1A1D] rounded-xl p-4 transition-all duration-200"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2 text-xs text-[#C9943A] font-mono font-medium px-2 py-1 bg-[#C9943A]/10 rounded-md">
                <FileText className="w-3 h-3" />
                {draft.draftNumber}
              </div>
              <span className="text-[10px] text-[#6B6560]">
                {new Date(draft.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-[#F0EBE0] mb-2 font-medium">
              <User className="w-4 h-4 text-[#6B6560]" />
              {draft.customer?.name || "Walk-in Customer"}
            </div>
            
            <div className="flex justify-between items-end mt-4 pt-3 border-t border-[#1F1F24] group-hover:border-[#C9943A]/20">
              <span className="text-xs text-[#6B6560]">
                {new Date(draft.createdAt).toLocaleDateString("en-GB")}
              </span>
              <span className="text-xs text-[#C9943A] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                Resume <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
