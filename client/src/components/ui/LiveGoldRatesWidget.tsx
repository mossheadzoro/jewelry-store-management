"use client";

import React, { useState, useEffect, useRef } from "react";
import { Coins, X, TrendingUp } from "lucide-react";

export function LiveGoldRatesWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [rates, setRates] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchRates = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/gold-rates");
      const data = await res.json();
      setRates(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
    // Poll every 5 minutes
    const interval = setInterval(fetchRates, 300000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50 font-inter" ref={widgetRef}>
      <div 
        className={`absolute bottom-16 right-0 mb-2 w-[320px] bg-[#141414] border border-[#D4A843]/30 rounded-2xl shadow-2xl overflow-hidden transition-all duration-200 transform origin-bottom-right ${
          isOpen ? "scale-100 opacity-100 visible" : "scale-95 opacity-0 invisible pointer-events-none"
        }`}
      >
        <div className="bg-[#D4A843]/10 p-4 border-b border-[#D4A843]/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#D4A843]" />
            <h3 className="text-[15px] font-semibold text-white tracking-wide">Live Metal Rates</h3>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-[#888] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-5 bg-[#0a0a0a]">
          {loading && !rates ? (
            <div className="flex justify-center py-6 text-[#888] text-[13px]">
              Fetching live rates...
            </div>
          ) : rates ? (
            <div className="space-y-4">
              {/* Gold Section */}
              {rates.ratesPerGram && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[12px] font-bold text-[#D4A843] uppercase tracking-widest">Gold (1g)</span>
                    <span className="text-[10px] text-[#666]">Base Rate</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(rates.ratesPerGram).map(([carat, price]: any) => (
                      <div key={carat} className="bg-[#141414] border border-[#222] rounded-xl p-3 flex flex-col items-center justify-center">
                        <span className="text-[11px] text-[#888] uppercase font-bold tracking-widest mb-0.5">{carat}</span>
                        <span className="text-[15px] font-bold text-white tracking-tight">₹{Number(price).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Silver (If API ever returns it) */}
              {rates.silverRate && (
                <div className="pt-4 border-t border-[#222]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-bold text-slate-300 uppercase tracking-widest">Silver (1g)</span>
                  </div>
                  <div className="bg-[#141414] border border-[#222] rounded-xl p-3 flex items-center justify-center">
                    <span className="text-[15px] font-bold text-white tracking-tight">₹{Number(rates.silverRate).toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              )}

              {!rates.ratesPerGram && (
                <div className="text-[13px] text-[#888] text-center py-4">
                  No rates currently available.
                </div>
              )}
              
              {rates.timestamp && (
                <div className="text-[10px] text-[#555] text-center pt-3 mt-1">
                  Last updated: {new Date(rates.timestamp).toLocaleTimeString()}
                </div>
              )}
            </div>
          ) : (
            <div className="text-[13px] text-red-400 text-center py-4">
              Failed to load rates.
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-[#D4A843] text-black flex items-center justify-center shadow-[0_0_20px_rgba(212,168,67,0.3)] hover:shadow-[0_0_25px_rgba(212,168,67,0.5)] transition-all transform hover:scale-105 active:scale-95 border-2 border-black/20"
      >
        <Coins className="w-6 h-6" />
      </button>
    </div>
  );
}
