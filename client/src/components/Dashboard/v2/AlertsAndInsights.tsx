"use client";

import React from "react";
import { AlertTriangle, Lightbulb } from "lucide-react";
import Link from "next/link";

export function AlertsAndInsights({ alerts, insights }: any) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Alerts Section (Red Cards) */}
      <div className="bg-rose-500/10 p-5 rounded-2xl border border-rose-500/20">
        <h3 className="text-[14px] font-semibold text-rose-400 flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4" /> Action Required
        </h3>
        <div className="space-y-3">
          {alerts.map((alert: any, index: number) => (
            <Link key={index} href={alert.link} className="block">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-colors">
                <span className="text-[14px] text-rose-300">⚠</span>
                <span className="text-[13px] text-rose-200 font-medium">{alert.message}</span>
              </div>
            </Link>
          ))}
          {alerts.length === 0 && (
            <div className="text-[13px] text-rose-300/60 p-4 text-center">No critical alerts right now.</div>
          )}
        </div>
      </div>

      {/* Smart AI Insights */}
      <div className="lg:col-span-2 bg-gradient-to-br from-onyx-surface to-onyx-elevated p-5 rounded-2xl border border-onyx-border">
        <h3 className="text-[14px] font-semibold text-platinum flex items-center gap-2 mb-4">
          <Lightbulb className="w-4 h-4 text-gold" /> Smart Insights
        </h3>
        <div className="space-y-3">
          {insights?.map((insight: string, index: number) => (
            <div key={index} className="flex items-start gap-3 p-3.5 rounded-xl bg-onyx-surface/50 border border-onyx-border/50">
              <div className="w-1.5 h-1.5 rounded-full bg-gold mt-1.5 shrink-0" />
              <p className="text-[13px] text-platinum-muted leading-relaxed font-medium">{insight}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
