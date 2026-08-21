"use client";

import React from "react";
import Link from "next/link";
import { Users, BarChart3, Radio, Gift, HelpCircle, LogOut, ShieldAlert, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export default function VIPLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <div className="flex h-screen bg-onyx text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[280px] bg-onyx-surface border-r border-[#1f1f1f] flex flex-col hidden md:flex">
        {/* Brand Area */}
        <div className="p-8 pt-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#D4A843]/20 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-[#D4A843]" />
            </div>
            <div>
              <h2 className="text-[20px] font-serif tracking-wide text-[#D4A843]">VIP</h2>
              <h3 className="text-[18px] font-serif leading-none">Relations</h3>
            </div>
          </div>
          <p className="text-[10px] font-bold tracking-[0.2em] text-[#666] mt-3 uppercase">
            Obsidian Tier
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1">
          <Link
            href="/vip"
            className="flex items-center gap-3 px-4 py-3 text-[13px] font-medium rounded-xl bg-[#1f1f1f] text-[#D4A843] border border-onyx-border"
          >
            <Users className="w-4 h-4" />
            Client Roster
          </Link>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-medium rounded-xl text-[#888] hover:bg-onyx-elevated hover:text-[#ccc] transition-colors">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-medium rounded-xl text-[#888] hover:bg-onyx-elevated hover:text-[#ccc] transition-colors">
            <Radio className="w-4 h-4" />
            Outreach
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-medium rounded-xl text-[#888] hover:bg-onyx-elevated hover:text-[#ccc] transition-colors">
            <Gift className="w-4 h-4" />
            Offer Engine
          </button>
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#1f1f1f] space-y-1">
          <button 
            onClick={() => router.push("/customer")}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] font-medium rounded-lg text-[#666] hover:text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Exit VIP Mode
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="h-[72px] bg-onyx border-b border-[#1f1f1f] flex items-center justify-between px-8 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-[#D4A843]" />
            <h1 className="text-[24px] font-serif tracking-wide text-foreground">VIP & Elite Clientele</h1>
          </div>
          {/* User actions */}
          <div className="flex items-center gap-4">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search Obsidian Database..."
                className="w-[240px] h-9 bg-[#111] border border-[#222] rounded-full pl-4 pr-10 text-[12px] text-foreground placeholder:text-[#555] focus:outline-none focus:border-[#D4A843]/50"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#555]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full border border-[#222] flex items-center justify-center text-[#888]">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto">
          {children}
          
          <footer className="px-8 py-6 border-t border-[#1f1f1f] flex items-center justify-between mt-auto">
            <p className="text-[11px] text-[#555] font-medium tracking-wide uppercase">
              © 2024 AURUM LUXURY SYSTEMS. ALL RIGHTS RESERVED.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-[11px] text-[#555] font-medium tracking-wide hover:text-[#D4A843] transition-colors">Privacy</a>
              <a href="#" className="text-[11px] text-[#555] font-medium tracking-wide hover:text-[#D4A843] transition-colors">Security</a>
              <a href="#" className="text-[11px] text-[#555] font-medium tracking-wide hover:text-[#D4A843] transition-colors">Compliance</a>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
