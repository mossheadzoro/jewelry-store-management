"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RotateCw, Clock, Scale, Coins, Sparkles, Layers, Activity } from "lucide-react";
import { roundFineGold } from "@/lib/fineGold";

export default function SessionSummary({
  items,
  session,
  onRefreshSession,
}: {
  items: any[];
  session: any;
  onRefreshSession?: () => void;
}) {
  const [refreshing, setRefreshing] = useState(false);

  const handleManualRefresh = async () => {
    if (!onRefreshSession) return;
    setRefreshing(true);
    try {
      await onRefreshSession();
    } finally {
      setTimeout(() => setRefreshing(false), 400);
    }
  };

  /* --------------------------------
     LIVE QUEUE TOTALS (DRAFT QUEUE)
  -------------------------------- */
  const totalBefore = items.reduce(
    (sum, i) => sum + (i.before || 0),
    0
  );

  const totalAfter = items.reduce(
    (sum, i) => sum + (i.after || 0),
    0
  );

  const liveFineGold = items.reduce(
    (sum, i) =>
      i.metalType === "GOLD" ? sum + (i.fine || 0) : sum,
    0
  );

  const liveFineSilver = items.reduce(
    (sum, i) =>
      i.metalType === "SILVER" ? sum + (i.fine || 0) : sum,
    0
  );

  /* --------------------------------
     SESSION METADATA
  -------------------------------- */
  const startTime = session?.date ? new Date(session.date) : new Date();
  const endTime = session?.closedAt ? new Date(session.closedAt) : null;

  const fineGoldAccumulated = session?.fineGold || 0;
  const fineSilverAccumulated = session?.fineSilver || 0;

  return (
    <Card className="border border-[#1F1F24] bg-[#111113] shadow-lg rounded-xl overflow-hidden flex flex-col h-full">
      {/* HEADER */}
      <CardHeader className="pb-3 border-b border-[#1F1F24] bg-[#0A0A0B] flex flex-row items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Scale className="w-5 h-5 text-[#C9943A]" />
          <div>
            <CardTitle className="text-base font-bold text-[#F0EBE0] font-serif">
              Session Summary
            </CardTitle>
            <p className="text-[11px] text-[#8E8A85]">
              Session #{session?.sessionNumber || "Active"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRefreshSession && (
            <Button
              variant="outline"
              size="icon"
              onClick={handleManualRefresh}
              title="Refresh Fine Gold & Session Ledger"
              className="w-7 h-7 border-[#2A2A30] bg-[#1A1A1E] text-[#C9943A] hover:bg-[#25252A] hover:text-foreground"
            >
              <RotateCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          )}
          <Badge className={session?.isClosed ? "bg-secondary text-foreground/80 border-border" : "bg-[#C9943A]/20 text-[#C9943A] border-[#C9943A]/40"}>
            <Activity className="w-3 h-3 mr-1" />
            {session?.isClosed ? "Closed" : "Active"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-5 flex-1 flex flex-col justify-between text-xs">
        {/* SECTION 1: ACCUMULATED TONCHED METAL LEDGER (DATABASE AUTHORITATIVE) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-[#C9943A] font-semibold text-[11px] uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5" />
              Accumulated Fine Metal (Ledger)
            </span>
            <span className="text-[10px] text-[#8E8A85] normal-case font-normal">2 Decimal Rounded</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Fine Gold Accumulated Card */}
            <div className="p-3 rounded-xl bg-gradient-to-br from-secondary to-background border border-[#C9943A]/40 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-[#E8B84B] tracking-wider">Fine Gold</span>
                <Sparkles className="w-3.5 h-3.5 text-[#E8B84B]" />
              </div>
              <p className="text-lg font-black text-foreground mt-1">
                {roundFineGold(fineGoldAccumulated).toFixed(3)} <span className="text-xs font-normal text-[#E8B84B]">g</span>
              </p>
              <p className="text-[10px] text-[#8E8A85] mt-0.5">Authoritative Ledger</p>
            </div>

            {/* Fine Silver Accumulated Card */}
            <div className="p-3 rounded-xl bg-gradient-to-br from-secondary to-background border border-[#3A3C4A] shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-foreground/90 tracking-wider">Fine Silver</span>
                <Coins className="w-3.5 h-3.5 text-foreground/90" />
              </div>
              <p className="text-lg font-black text-foreground mt-1">
                {roundFineGold(fineSilverAccumulated).toFixed(3)} <span className="text-xs font-normal text-foreground/90">g</span>
              </p>
              <p className="text-[10px] text-[#8E8A85] mt-0.5">Authoritative Ledger</p>
            </div>
          </div>
        </div>

        {/* SECTION 2: LIVE PENDING QUEUE (DRAFT ITEMS) */}
        <div className="space-y-2.5 pt-3 border-t border-[#1F1F24]">
          <div className="flex items-center justify-between text-[#8E8A85] font-semibold text-[11px] uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#C9943A]" />
              Pending Queue Draft ({items.length} items)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#0A0A0B] p-3 rounded-lg border border-[#1F1F24]">
            <div>
              <span className="text-[#8E8A85]">Gross Wt (Before):</span>
              <p className="font-semibold text-foreground mt-0.5">{totalBefore.toFixed(3)} g</p>
            </div>
            <div>
              <span className="text-[#8E8A85]">Gross Wt (After):</span>
              <p className="font-semibold text-foreground mt-0.5">{totalAfter.toFixed(3)} g</p>
            </div>
            <div className="mt-1.5 pt-1.5 border-t border-[#1F1F24]">
              <span className="text-[#8E8A85]">Draft Fine Gold:</span>
              <p className="font-semibold text-[#C9943A] mt-0.5">{roundFineGold(liveFineGold).toFixed(3)} g</p>
            </div>
            <div className="mt-1.5 pt-1.5 border-t border-[#1F1F24]">
              <span className="text-[#8E8A85]">Draft Fine Silver:</span>
              <p className="font-semibold text-foreground/90 mt-0.5">{roundFineGold(liveFineSilver).toFixed(3)} g</p>
            </div>
          </div>
        </div>

        {/* SECTION 3: SESSION TIMESTAMPS */}
        <div className="pt-2 border-t border-[#1F1F24] flex items-center justify-between text-[11px] text-[#8E8A85]">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#C9943A]" />
            Started: {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span>
            {endTime ? `Closed: ${endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : "In Progress"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
