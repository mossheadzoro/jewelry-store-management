"use client";

import { Button } from "@/components/ui/button";
import { History, PlusCircle, Activity } from "lucide-react";

interface PageHeaderProps {
  activeTab?: "active" | "history";
  onTabChange?: (tab: "active" | "history") => void;
}

export default function PageHeader({
  activeTab = "active",
  onTabChange,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Tonch / Metal Exchange
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage metal purity testing, melting loss reconciliation, and historic tonch reports.
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* History Tab Button */}
        <Button
          variant={activeTab === "history" ? "default" : "outline"}
          size="sm"
          onClick={() => onTabChange?.("history")}
          className={`flex items-center gap-1.5 cursor-pointer text-xs ${
            activeTab === "history"
              ? "bg-[#C9A84C] hover:bg-[#B8973B] text-black font-semibold shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <History size={14} />
          <span>Tonch History</span>
        </Button>

        {/* Active Session / New Exchange Button */}
        <Button
          variant={activeTab === "active" ? "default" : "outline"}
          size="sm"
          onClick={() => onTabChange?.("active")}
          className={`flex items-center gap-1.5 cursor-pointer text-xs ${
            activeTab === "active"
              ? "bg-[#C9A84C] hover:bg-[#B8973B] text-black font-semibold shadow-xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Activity size={14} />
          <span>Active Session</span>
        </Button>
      </div>
    </div>
  );
}
