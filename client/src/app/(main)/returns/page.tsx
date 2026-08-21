"use client";

import React, { useState } from "react";
import { 
  IconReceiptRefund, 
  IconArrowsRightLeft, 
  IconSearch, 
  IconFileText 
} from "@tabler/icons-react";
import { CreateReturnModal } from "./CreateReturnModal";
import { CreateExchangeModal } from "./CreateExchangeModal";

export default function ReturnsExchangesPage() {
  const [activeTab, setActiveTab] = useState("pending");
  const [searchQuery, setSearchQuery] = useState("");
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);

  const tabs = [
    { id: "pending", label: "Pending" },
    { id: "inspection", label: "Inspection" },
    { id: "approved", label: "Approved" },
    { id: "refunded", label: "Refunded" },
    { id: "replaced", label: "Replaced" },
    { id: "exchanged", label: "Exchanged" },
    { id: "rejected", label: "Rejected" },
    { id: "closed", label: "Closed" },
  ];

  return (
    <div className="min-h-screen flex-1 w-full bg-onyx p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Returns & Exchanges</h1>
          <p className="text-[13px] text-platinum-muted">Manage product returns, replacements, and exchanges.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsReturnModalOpen(true)}
            className="flex items-center gap-2 bg-onyx-surface border border-onyx-border text-foreground hover:bg-onyx-elevated px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <IconReceiptRefund size={16} />
            New Return
          </button>
          <button 
            onClick={() => setIsExchangeModalOpen(true)}
            className="flex items-center gap-2 bg-gold/10 border border-gold/30 text-gold hover:bg-gold/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <IconArrowsRightLeft size={16} />
            New Exchange
          </button>
        </div>
      </div>

      <div className="bg-onyx-surface border border-onyx-border rounded-xl p-4">
        {/* Search Bar */}
        <div className="mb-6 relative max-w-md">
          <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-platinum-muted" size={18} />
          <input 
            type="text" 
            placeholder="Search by Invoice #, HUID, or Customer..." 
            className="w-full bg-onyx border border-onyx-border text-foreground rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/50 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Custom Tabs */}
        <div className="flex space-x-1 border-b border-onyx-border mb-6 overflow-x-auto pb-px">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-[13px] font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id 
                  ? "border-gold text-gold" 
                  : "border-transparent text-platinum-muted hover:text-foreground hover:border-onyx-border/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px] flex items-center justify-center border border-dashed border-onyx-border/50 rounded-lg bg-onyx/30">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="p-4 bg-onyx-elevated rounded-full text-platinum-muted">
              <IconFileText size={32} stroke={1.5} />
            </div>
            <h3 className="text-foreground font-medium text-base capitalize">No {activeTab} requests</h3>
            <p className="text-[13px] text-platinum-muted max-w-sm">
              There are currently no return or exchange requests in the {activeTab} state. 
              {activeTab === 'pending' && " New requests will appear here."}
            </p>
          </div>
        </div>
      </div>

      <CreateReturnModal 
        isOpen={isReturnModalOpen} 
        onClose={() => setIsReturnModalOpen(false)} 
        onSuccess={() => {
          alert("Return Request Created Successfully!");
        }}
      />

      <CreateExchangeModal 
        isOpen={isExchangeModalOpen} 
        onClose={() => setIsExchangeModalOpen(false)} 
        onSuccess={() => {
          alert("Exchange/Replacement Request Created Successfully!");
        }}
      />
    </div>
  );
}
