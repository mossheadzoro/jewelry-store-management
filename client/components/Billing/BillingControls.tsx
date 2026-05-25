"use client";

import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Info, RefreshCcw } from "lucide-react";
import React from "react";
import { cn } from "@/lib/utils";

const BillingControls = ({ billing }: any) => {
  const {
    metalRate,
    updateMetalRate,
    taxOnTotal,
    setTaxOnTotal,
    hallmarkCharge,
    setHallmarkCharge,
    taxOnMetal,
    setTaxOnMetal,
    taxOnMaking,
    setTaxOnMaking,
  } = billing;

  const preventNegative = (val: number) => (val < 0 ? 0 : val);

  const taxOptions = [
    {
      id: "total",
      label: "Total GST 3%",
      checked: taxOnTotal,
      setFn: setTaxOnTotal,
      info: "GST applied on Metal + Making",
    },
    {
      id: "metal",
      label: "Metal GST 3%",
      checked: taxOnMetal,
      setFn: setTaxOnMetal,
      info: "GST 3% (1.5% + 1.5%)",
    },
    {
      id: "making",
      label: "Making GST 5%",
      checked: taxOnMaking,
      setFn: setTaxOnMaking,
      info: "GST 5% (2.5% + 2.5%)",
    },
    {
      id: "hallmark",
      label: "Hallmark",
      checked: hallmarkCharge,
      setFn: setHallmarkCharge,
      info: "Includes hallmark fees + GST",
    },
  ];

  return (
    <div className="flex flex-col md:flex-row items-center gap-4 bg-[#111] p-3 rounded-xl border border-[#1e1e1e]">
      
      {/* GOLD RATE SECTION */}
      <div className="flex items-center gap-3 pr-4 border-b md:border-b-0 md:border-r border-[#2a2a2a] w-full md:w-auto pb-4 md:pb-0">
        <span className="text-sm font-medium text-[#888] whitespace-nowrap pl-1">
          Gold Rate (22K)
        </span>
        <div className="relative flex items-center">
          <div className="absolute left-3 text-[#d4a843] font-medium">₹</div>
          <Input
            inputMode="decimal"
            pattern="[0-9]*"
            className="pl-7 pr-10 bg-[#1a1a1a] border-[#2a2a2a] text-white rounded-lg h-9 w-32 focus-visible:ring-1 focus-visible:ring-[#d4a843] focus-visible:border-[#d4a843] text-sm"
            value={metalRate ?? ""}
            onChange={(e) => updateMetalRate(preventNegative(Number(e.target.value)))}
          />
          <span className="absolute right-[40px] text-[#555] text-xs font-medium">/g</span>
          <button
            onClick={async () => {
              try {
                const res = await fetch("/api/rates/latest");
                const data = await res.json();
                if (data.rate) updateMetalRate(data.rate);
              } catch {
                console.error("Failed to refresh metal rate");
              }
            }}
            className="absolute right-1 p-1.5 hover:bg-[#2a2a2a] rounded-md transition-colors group"
            aria-label="Refresh metal rate"
          >
            <RefreshCcw className="w-3.5 h-3.5 text-[#888] group-hover:text-[#d4a843]" />
          </button>
        </div>
      </div>

      {/* TAXATION SECTION */}
      <div className="flex items-center gap-3 overflow-x-auto w-full scrollbar-hidden">
        <span className="text-sm font-medium text-[#888] whitespace-nowrap pl-1 md:pl-0">
          Taxation
        </span>
        <div className="flex bg-[#1a1a1a] rounded-lg p-1 border border-[#2a2a2a]">
          {taxOptions.map((item) => (
            <div
              key={item.id}
              onClick={() => item.setFn(!item.checked)}
              className={cn(
                "px-3 pl-2 py-1.5 flex items-center gap-1.5 text-xs font-medium rounded-md transition-colors duration-200 whitespace-nowrap cursor-pointer select-none",
                item.checked 
                  ? "bg-[#2a2515] text-[#d4a843] border border-[#d4a843]/30" 
                  : "text-[#888] hover:text-[#bbb] border border-transparent"
              )}
            >
              <div 
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-colors", 
                  item.checked ? "bg-[#d4a843]" : "bg-transparent"
                )} 
              />
              {item.label}
              
              <Popover>
                <PopoverTrigger onClick={(e) => e.stopPropagation()} className="ml-1 cursor-help outline-none">
                  <Info className={cn("w-3.5 h-3.5", item.checked ? "text-[#d4a843]/70" : "text-[#555]")} />
                </PopoverTrigger>
                <PopoverContent side="top" className="bg-[#1e1e1e] border-[#333] text-[#eee] text-xs p-2.5 max-w-[200px] shadow-xl">
                  {item.info}
                </PopoverContent>
              </Popover>
            </div>
          ))}
        </div>
      </div>
      
      <style>{`
        .no-spinner::-webkit-inner-spin-button, 
        .no-spinner::-webkit-outer-spin-button { 
          -webkit-appearance: none; 
          margin: 0; 
        }
        .scrollbar-hidden::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hidden {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }
      `}</style>
    </div>
  );
};

export default BillingControls;
