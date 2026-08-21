"use client";
import React, { useState, useEffect } from "react";
import { ArrowUpCircle, ArrowDownCircle, BarChart3, Edit2 } from "lucide-react";
import Image from "next/image";

import { WholesalerBalances } from "./details/WholesalerBalances";
import { WholesalerLedger, LedgerEntry } from "./details/WholesalerLedger";
import { IssueMetalModal } from "./details/IssueMetalModal";
import { ReceiveJewelleryModal } from "./details/ReceiveJewelleryModal";
import { StatsModal } from "./details/StatsModal";
import { JewelleryOrdersTab } from "./details/JewelleryOrdersTab";

interface Order {
  id: string;
  status: string;
  createdAt: string;
}

interface Wholesaler {
  id: string;
  code: string;
  name: string;
  goldBal: number;
  silverBal: number;
  moneyBal: number;
  orders?: Order[];
  ledgerEntries?: LedgerEntry[];
}

interface Props {
  wholesaler: Wholesaler;
}

const TABS = ["Overview", "Jewellery Orders", "Invoices", "Design Library", "Notes"];

export default function WholeSalerDetails({ wholesaler: initialData }: Props) {
  const [data, setData] = useState<Wholesaler>(initialData);
  const [activeTab, setActiveTab] = useState("Overview");

  useEffect(() => {
    setData(initialData);
  }, [initialData]);

  // Modal states
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/wholesalers/${data.id}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error("Failed to fetch fresh data", e);
    }
  };

  if (!data) return <div className="min-h-screen bg-[#060b13] p-8 text-foreground">Loading...</div>;

  const totalOutstandingBalance = data.moneyBal;
  const activeOrdersCount = data.orders?.filter(o => !["DELIVERED", "CANCELLED", "RETURNED", "FINISHED"].includes(o.status)).length || 0;
  const lastOrderDate = data.orders?.[0]?.createdAt 
    ? new Date(data.orders[0].createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'}) 
    : "No Orders";

  return (
    <div className="min-h-screen bg-[#0a101b] text-foreground p-8 w-full font-sans">
      
      {/* Top Banner similar to image */}
      <div className="flex gap-2 text-sm text-muted-foreground mb-6">
        <span>Wholesalers</span>
        <span>›</span>
        <span className="text-foreground/90">{data.name}</span>
      </div>

      <div className="bg-card rounded-3xl p-8 mb-6 border border-border shadow-xl relative overflow-hidden">
        {/* Background glow or gradient could go here */}
        <div className="flex justify-between items-start">
          <div className="flex gap-6 items-center z-10">
            <div className="w-28 h-28 bg-[#fdf5e6] rounded-2xl flex flex-col justify-center items-center shadow-inner relative overflow-hidden">
                {/* Mock Logo */}
                <div className="text-amber-700 font-serif text-3xl font-bold opacity-80 mt-2">
                  AW
                </div>
                <div className="text-[10px] text-amber-900 tracking-widest mt-1 uppercase opacity-70 font-semibold text-center leading-tight">
                  {data.name.split(" ").slice(0, 2).join("\n")}
                </div>
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold tracking-tight text-foreground mb-1">{data.name}</h1>
              <div className="flex items-center gap-3 text-sm">
                <span className="bg-emerald-900/40 text-emerald-400 px-3 py-1 rounded-full border border-emerald-800/50 font-medium">Premium Partner</span>
                <span className="text-muted-foreground flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span> ID: {data.code}
                </span>
              </div>
            </div>
          </div>

          <button className="flex items-center gap-2 bg-transparent text-foreground/80 hover:text-foreground border border-gray-600 hover:border-gray-400 px-5 py-2.5 rounded-full text-sm font-medium transition-colors z-10">
            <Edit2 size={16} /> Edit Profile
          </button>
        </div>

        {/* Stats Row within the card */}
        <div className="grid grid-cols-3 mt-10 pt-8 border-t border-border/60 z-10 relative">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Outstanding Balance</span>
            <span className="text-2xl font-bold text-foreground">₹{Math.abs(totalOutstandingBalance).toLocaleString("en-IN")}</span>
          </div>
          <div className="flex flex-col gap-1.5 border-l border-border/60 pl-8">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Active Orders</span>
            <span className="text-2xl font-bold text-blue-400">{activeOrdersCount} Orders</span>
          </div>
          <div className="flex flex-col gap-1.5 border-l border-border/60 pl-8">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Last Order</span>
            <span className="text-2xl font-bold text-foreground">{lastOrderDate}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-border mb-8 overflow-x-auto scollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 text-sm font-medium transition-colors relative whitespace-nowrap ${
              activeTab === tab ? "text-blue-500" : "text-muted-foreground hover:text-foreground/90"
            }`}
          >
            {tab}
            {tab === "Jewellery Orders" && data.orders?.length ? (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs bg-[#1a2332] border border-border ${activeTab === tab ? "text-blue-400" : "text-muted-foreground"}`}>
                {data.orders.length}
              </span>
            ) : null}
            {activeTab === tab && (
              <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-blue-500 rounded-t-sm shadow-[0_-2px_10px_rgba(59,130,246,0.5)]"></div>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === "Overview" && (
          <div className="flex flex-col gap-8">
            <div className="flex justify-end gap-3 mb-2">
              <button
                onClick={() => setIsStatsModalOpen(true)}
                className="flex items-center gap-2 bg-[#0d2a1f] text-emerald-400 hover:bg-[#12402e] border border-emerald-700/50 px-4 py-2 rounded-xl shadow-lg transition-all text-sm font-medium"
              >
                <BarChart3 size={18} /> Stats
              </button>
              <button
                onClick={() => setIsIssueModalOpen(true)}
                className="flex items-center gap-2 bg-[#2a1f0d] text-yellow-500 hover:bg-[#3d2c12] border border-yellow-700/50 px-4 py-2 rounded-xl shadow-lg transition-all text-sm font-medium"
              >
                <ArrowUpCircle size={18} /> Issue Metal
              </button>
              <button
                onClick={() => setIsReceiveModalOpen(true)}
                className="flex items-center gap-2 bg-[#1a0f2e] text-purple-400 hover:bg-[#2b164d] border border-purple-700/50 px-4 py-2 rounded-xl shadow-lg transition-all text-sm font-medium"
              >
                <ArrowDownCircle size={18} /> Receive Jewellery
              </button>
            </div>
            
            <WholesalerBalances 
              goldBal={data.goldBal} 
              silverBal={data.silverBal} 
              moneyBal={data.moneyBal} 
            />
            <WholesalerLedger entries={data.ledgerEntries} />
          </div>
        )}

        {activeTab === "Jewellery Orders" && (
          <JewelleryOrdersTab wholesalerId={data.id} />
        )}

        {(activeTab === "Invoices" || activeTab === "Design Library" || activeTab === "Notes") && (
          <div className="flex flex-col items-center justify-center p-20 bg-card rounded-2xl border border-border text-muted-foreground">
            <h3 className="text-xl font-medium mb-2">{activeTab}</h3>
            <p className="text-sm">This section is currently under construction.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {isIssueModalOpen && (
        <IssueMetalModal wholesalerId={data.id} onClose={() => setIsIssueModalOpen(false)} onSuccess={fetchData} />
      )}
      {isReceiveModalOpen && (
        <ReceiveJewelleryModal wholesalerId={data.id} onClose={() => setIsReceiveModalOpen(false)} onSuccess={fetchData} />
      )}
      {isStatsModalOpen && (
        <StatsModal wholesalerId={data.id} onClose={() => setIsStatsModalOpen(false)} />
      )}
    </div>
  );
}
