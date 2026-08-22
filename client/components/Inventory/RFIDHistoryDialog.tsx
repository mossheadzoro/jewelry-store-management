// client/components/Inventory/RFIDHistoryDialog.tsx
"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Radio,
  MapPin,
  Clock,
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface RFIDHistoryDialogProps {
  epc: string | null;
  productName?: string;
  productCode?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RFIDHistoryDialog({
  epc,
  productName,
  productCode,
  open,
  onOpenChange,
}: RFIDHistoryDialogProps) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["rfidTagHistory", epc],
    queryFn: async () => {
      if (!epc) return null;
      const res = await fetch(`/api/rfid/tags/${encodeURIComponent(epc)}/history`);
      if (!res.ok) throw new Error("Failed to fetch tag history");
      return res.json();
    },
    enabled: !!epc && open,
  });

  const tagData = data?.data?.tag;
  const readEvents = data?.data?.readEvents || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-onyx border-onyx-border text-platinum">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gold/10 text-gold">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  RFID Physical Observation Timeline
                </DialogTitle>
                <DialogDescription className="text-xs text-platinum-muted">
                  {productName ? `${productName} (${productCode})` : "Physical location history and sightings"}
                </DialogDescription>
              </div>
            </div>
            {epc && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                className="text-platinum-muted hover:text-gold"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        {!epc ? (
          <div className="p-6 text-center text-sm text-platinum-muted">
            No RFID tag is currently assigned to this item.
          </div>
        ) : isLoading ? (
          <div className="p-8 text-center text-platinum-muted animate-pulse">
            Loading RFID timeline...
          </div>
        ) : !tagData ? (
          <div className="p-6 text-center text-sm text-platinum-muted">
            Tag records not found.
          </div>
        ) : (
          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            {/* Tag Summary Card */}
            <div className="p-4 rounded-xl bg-onyx-surface border border-onyx-border flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-gold bg-gold/10 px-2 py-0.5 rounded">
                    {tagData.epc}
                  </span>
                  <Badge
                    variant={
                      tagData.status === "ACTIVE"
                        ? "default"
                        : tagData.status === "SUSPENDED"
                        ? "secondary"
                        : "outline"
                    }
                    className="text-[10px]"
                  >
                    {tagData.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-platinum-muted mt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gold" />
                    {tagData.currentZone?.name || "Showroom Floor"}
                  </span>
                  <span>·</span>
                  <span>Branch: {tagData.branch?.name}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] text-platinum-muted">Signal Strength</div>
                <div className="text-sm font-semibold text-platinum">
                  {tagData.lastRssi ? `${tagData.lastRssi} dBm` : "—"}
                </div>
              </div>
            </div>

            {/* Observation Sighting Timeline */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-platinum-muted mb-3 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gold" /> Physical Sightings ({readEvents.length})
              </h4>

              {readEvents.length === 0 ? (
                <div className="text-center py-6 text-xs text-platinum-muted border border-dashed border-onyx-border rounded-lg">
                  No physical reader sightings recorded yet for this tag.
                </div>
              ) : (
                <div className="space-y-2">
                  {readEvents.map((evt: any) => (
                    <div
                      key={evt.id}
                      className="p-3 rounded-lg bg-onyx-surface/60 border border-onyx-border/80 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                        <div>
                          <div className="font-medium text-foreground">
                            {evt.zone?.name || "Counter / Floor"}
                          </div>
                          <div className="text-[11px] text-platinum-muted">
                            Reader: {evt.reader?.name || evt.readerId} (Antenna {evt.antennaId || 1})
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-platinum-muted">
                          {new Date(evt.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </div>
                        <div className="text-[10px] text-platinum-faint">
                          {new Date(evt.timestamp).toLocaleDateString("en-IN")} · {evt.rssi} dBm
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Assignment History */}
            {tagData.assignmentHistory && tagData.assignmentHistory.length > 0 && (
              <div className="pt-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-platinum-muted mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-gold" /> Tag Lifecycle Audit Log
                </h4>
                <div className="space-y-1.5">
                  {tagData.assignmentHistory.map((hist: any) => (
                    <div
                      key={hist.id}
                      className="p-2.5 rounded-lg bg-onyx-surface/40 border border-onyx-border/40 text-xs flex items-center justify-between"
                    >
                      <div>
                        <span className="font-semibold text-platinum mr-2">[{hist.action}]</span>
                        <span className="text-platinum-muted">{hist.reason || "Tag assignment action"}</span>
                      </div>
                      <div className="text-[11px] text-platinum-faint">
                        {new Date(hist.createdAt).toLocaleDateString("en-IN")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
