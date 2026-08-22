// client/components/RFID/RFIDMovementMonitorClient.tsx
"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Radio,
  Clock,
  RefreshCw,
  Search,
  Filter,
  MapPin,
  Cpu,
  Layers,
  ArrowRight,
  ShieldAlert,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { RFIDHistoryDialog } from "../Inventory/RFIDHistoryDialog";

export default function RFIDMovementMonitorClient() {
  const [selectedZoneId, setSelectedZoneId] = useState("ALL");
  const [selectedReaderId, setSelectedReaderId] = useState("ALL");
  const [historyEpc, setHistoryEpc] = useState<string | null>(null);

  const { data: movements = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["rfidMovements", selectedZoneId, selectedReaderId],
    queryFn: async () => {
      const res = await axios.get("/api/rfid/movements", {
        params: {
          zoneId: selectedZoneId !== "ALL" ? selectedZoneId : undefined,
          readerId: selectedReaderId !== "ALL" ? selectedReaderId : undefined,
          limit: 60,
        },
      });
      return res.data?.data || [];
    },
    refetchInterval: 8000,
  });

  const { data: zones = [] } = useQuery({
    queryKey: ["rfidZonesList"],
    queryFn: async () => {
      const res = await axios.get("/api/rfid/zones");
      return res.data?.data || [];
    },
  });

  const { data: readers = [] } = useQuery({
    queryKey: ["rfidReadersList"],
    queryFn: async () => {
      const res = await axios.get("/api/rfid/readers");
      return res.data?.data || [];
    },
  });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-onyx-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gold/15 text-gold border border-gold/30">
              <Activity className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Physical RFID Movement Monitor
            </h1>
            <Badge variant="outline" className="text-xs text-gold border-gold/40">
              Real-time Sightings Feed
            </Badge>
          </div>
          <p className="text-xs text-platinum-muted">
            Continuous chronological timeline of physical RFID observations and zone transitions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="border-onyx-border text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-gold" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Observation vs Business Movement Notice */}
      <div className="p-3.5 bg-onyx-surface border border-onyx-border rounded-xl flex items-start gap-3 text-xs text-platinum-muted">
        <Info className="w-4 h-4 text-gold shrink-0 mt-0.5" />
        <div>
          <strong className="text-foreground">Observation Principle:</strong> RFID detections indicate physical presence at a specific antenna/reader at a timestamp. Physical sightings do not alter ERP inventory ledger transactions until an authorized business movement is confirmed.
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 bg-onyx-surface/80 p-3.5 rounded-xl border border-onyx-border flex-wrap">
        <div>
          <label className="text-[11px] font-semibold text-platinum-muted block mb-1">
            Filter by Zone
          </label>
          <select
            value={selectedZoneId}
            onChange={(e) => setSelectedZoneId(e.target.value)}
            className="bg-onyx border border-onyx-border rounded-lg text-xs text-platinum px-3 py-1.5 focus:outline-none focus:border-gold"
          >
            <option value="ALL">All Physical Zones</option>
            {zones.map((z: any) => (
              <option key={z.id} value={z.id}>
                {z.name} ({z.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-platinum-muted block mb-1">
            Filter by Reader Hardware
          </label>
          <select
            value={selectedReaderId}
            onChange={(e) => setSelectedReaderId(e.target.value)}
            className="bg-onyx border border-onyx-border rounded-lg text-xs text-platinum px-3 py-1.5 focus:outline-none focus:border-gold"
          >
            <option value="ALL">All Readers</option>
            {readers.map((r: any) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.readerCode})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Timeline Stream */}
      <Card className="bg-onyx-surface/90 border-onyx-border shadow-sm overflow-hidden">
        <CardHeader className="py-3 px-4 border-b border-onyx-border/70">
          <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4 text-gold" /> Chronological Sighting Feed ({movements.length})
          </CardTitle>
        </CardHeader>

        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-onyx/70 text-platinum-muted uppercase text-[10px] tracking-wider border-b border-onyx-border sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Observed Location</th>
                <th className="px-4 py-3">Jewellery Item / EPC</th>
                <th className="px-4 py-3">Reader & Antenna</th>
                <th className="px-4 py-3">Signal (RSSI)</th>
                <th className="px-4 py-3">Observation Type</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-onyx-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-platinum-muted animate-pulse">
                    Loading movement timeline...
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-platinum-muted">
                    No physical sightings recorded in this filter scope.
                  </td>
                </tr>
              ) : (
                movements.map((evt: any) => {
                  const item = evt.tag?.productItem;
                  return (
                    <tr key={evt.id} className="hover:bg-onyx/50 transition-colors">
                      {/* Timestamp */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-foreground">
                          {new Date(evt.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </div>
                        <div className="text-[10px] text-platinum-muted">
                          {new Date(evt.timestamp).toLocaleDateString("en-IN")}
                        </div>
                      </td>

                      {/* Observed Location */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 font-semibold text-gold">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span>{evt.zone?.name || "Showroom Area"}</span>
                        </div>
                        <div className="text-[10px] text-platinum-muted">{evt.branch?.name}</div>
                      </td>

                      {/* Jewellery Item / EPC */}
                      <td className="px-4 py-3.5">
                        {item ? (
                          <div>
                            <div className="font-semibold text-foreground">{item.name}</div>
                            <div className="text-[10px] font-mono text-platinum-muted">
                              {item.productCode} · {evt.epc}
                            </div>
                          </div>
                        ) : (
                          <div className="font-mono text-gold font-semibold">{evt.epc}</div>
                        )}
                      </td>

                      {/* Reader */}
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-platinum">{evt.reader?.name || evt.readerId}</div>
                        <div className="text-[10px] text-platinum-muted font-mono">
                          Antenna {evt.antennaId || 1} · {evt.frequency ? `${evt.frequency} MHz` : "UHF 865"}
                        </div>
                      </td>

                      {/* Signal */}
                      <td className="px-4 py-3.5 font-mono">
                        <div className="flex items-center gap-1.5 text-platinum">
                          <span>{evt.rssi} dBm</span>
                          {evt.readCount > 1 && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 text-emerald-400">
                              {evt.readCount}×
                            </Badge>
                          )}
                        </div>
                      </td>

                      {/* Observation Type */}
                      <td className="px-4 py-3.5">
                        <Badge variant="outline" className="text-[10px] text-platinum bg-onyx">
                          Physical Sighting
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setHistoryEpc(evt.epc)}
                          className="text-xs text-platinum-muted hover:text-gold h-7"
                        >
                          Timeline →
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* History Dialog */}
      <RFIDHistoryDialog
        epc={historyEpc}
        open={!!historyEpc}
        onOpenChange={(open) => !open && setHistoryEpc(null)}
      />
    </div>
  );
}
