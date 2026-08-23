// client/src/components/audit/EntityActivityTimeline.tsx
"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  History, User, Clock, CheckCircle2, AlertCircle, 
  ChevronDown, ChevronUp, Loader2, ShieldCheck, MapPin, Eye
} from "lucide-react";
import axios from "axios";

interface EntityActivityTimelineProps {
  entityType: string;
  entityId: string | number;
  title?: string;
}

export default function EntityActivityTimeline({
  entityType,
  entityId,
  title = "Entity Activity Timeline",
}: EntityActivityTimelineProps) {
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const { data: timelineLogs, isLoading, error, refetch } = useQuery({
    queryKey: ["entityTimeline", entityType, entityId],
    queryFn: async () => {
      const res = await axios.get(
        `/api/audit-logs/timeline?entityType=${entityType}&entityId=${entityId}`
      );
      return res.data?.data || [];
    },
    enabled: Boolean(entityType && entityId),
  });

  if (isLoading) {
    return (
      <div className="p-6 text-center text-platinum-muted flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-gold" /> Loading activity history...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[12px] flex items-center gap-2">
        <AlertCircle className="w-4 h-4 shrink-0" /> Failed to load activity history.
      </div>
    );
  }

  return (
    <div className="bg-[#111113] rounded-xl border border-[#1F1F24] p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-[#1F1F24] pb-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-gold" />
          <h4 className="text-[14px] font-semibold text-platinum font-heading">{title}</h4>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#0A0A0B] border border-[#25252B] text-platinum-muted">
          {timelineLogs?.length || 0} Events Recorded
        </span>
      </div>

      {timelineLogs?.length === 0 ? (
        <div className="text-center py-6 text-platinum-muted text-[12px]">
          No audit activity recorded for this entity yet.
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#25252B]">
          {timelineLogs.map((log: any, index: number) => {
            const isExpanded = expandedLogId === log.id;
            const hasDiffs = log.before || log.after || (log.changedFields && log.changedFields.length > 0);

            return (
              <div key={log.id} className="relative group">
                {/* Node Bullet */}
                <div className={`absolute -left-6 top-1 w-3 h-3 rounded-full border-2 ${
                  log.status === "SUCCESS"
                    ? "bg-gold border-[#111113] ring-2 ring-gold/30"
                    : "bg-rose-500 border-[#111113] ring-2 ring-rose-500/30"
                }`} />

                <div className="bg-[#0A0A0B] border border-[#1F1F24] rounded-xl p-3.5 space-y-2 hover:border-gold/30 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-platinum">{log.action}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.2 rounded-full font-bold ${
                        log.status === "SUCCESS"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                      }`}>
                        {log.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-platinum-muted">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(log.createdAt).toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  {log.description && (
                    <p className="text-[12px] text-platinum-muted leading-relaxed">
                      {log.description}
                    </p>
                  )}

                  {/* Actor Details */}
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-platinum-muted pt-1 border-t border-[#1F1F24]/50">
                    <div className="flex items-center gap-1 text-platinum">
                      <User className="w-3 h-3 text-gold" />
                      <span>{log.userNameSnapshot || "System"}</span>
                      {log.roleSnapshot && (
                        <span className="text-[10px] bg-[#16161A] px-1.5 py-0.5 rounded text-platinum-muted">
                          {log.roleSnapshot}
                        </span>
                      )}
                    </div>

                    {log.branchNameSnapshot && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-platinum-muted" />
                        <span>{log.branchNameSnapshot}</span>
                      </div>
                    )}

                    {log.ipAddress && (
                      <span className="font-mono text-[10px] text-neutral-500">{log.ipAddress}</span>
                    )}

                    {hasDiffs && (
                      <button
                        onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                        className="ml-auto text-gold hover:underline text-[11px] flex items-center gap-1"
                      >
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        <span>{isExpanded ? "Hide Changes" : "View Changes"}</span>
                      </button>
                    )}
                  </div>

                  {/* Field Diff Section */}
                  {isExpanded && hasDiffs && (
                    <div className="mt-3 pt-3 border-t border-[#1F1F24] space-y-2 animate-in fade-in">
                      <span className="text-[10px] uppercase font-bold text-platinum-muted tracking-wider block">
                        Field Changes
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                        {log.before && (
                          <div className="p-2.5 rounded-lg bg-[#111113] border border-rose-500/20 space-y-1">
                            <span className="text-rose-400 font-bold block">Previous State:</span>
                            <pre className="whitespace-pre-wrap break-all text-neutral-400 text-[10px]">
                              {JSON.stringify(log.before, null, 2)}
                            </pre>
                          </div>
                        )}
                        {log.after && (
                          <div className="p-2.5 rounded-lg bg-[#111113] border border-emerald-500/20 space-y-1">
                            <span className="text-emerald-400 font-bold block">New State:</span>
                            <pre className="whitespace-pre-wrap break-all text-platinum text-[10px]">
                              {JSON.stringify(log.after, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>

                      {log.reason && (
                        <div className="p-2 rounded bg-[#16161A] text-[11px] text-platinum">
                          <strong className="text-gold">Reason:</strong> {log.reason}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
