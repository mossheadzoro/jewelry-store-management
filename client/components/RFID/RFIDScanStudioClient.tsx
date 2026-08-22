// client/components/RFID/RFIDScanStudioClient.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Radar,
  Radio,
  Play,
  Square,
  Volume2,
  VolumeX,
  Zap,
  Activity,
  Tags,
  CheckCircle2,
  MapPin,
  Cpu,
  Trash2,
  Layers,
  Sparkles,
  Signal,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { toast } from "sonner";
import Link from "next/link";
import { RFIDHistoryDialog } from "../Inventory/RFIDHistoryDialog";

interface LiveTagRead {
  epc: string;
  readerId: string;
  antennaNo: number;
  rssi: number;
  timestamp: Date;
  readCount: number;
  productName?: string;
  productCode?: string;
  purity?: number;
  gsWeight?: number;
}

export default function RFIDScanStudioClient() {
  const [isScanning, setIsScanning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedReaderId, setSelectedReaderId] = useState("");
  const [selectedZoneId, setSelectedZoneId] = useState("");
  const [detectedTags, setDetectedTags] = useState<Map<string, LiveTagRead>>(new Map());
  const [readsPerSec, setReadsPerSec] = useState(0);
  const [totalReadEvents, setTotalReadEvents] = useState(0);
  const [historyEpc, setHistoryEpc] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const burstIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recentReadsCountRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Play subtle chime on tag detect
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {}
  };

  // Fetch Readers
  const { data: readers = [] } = useQuery({
    queryKey: ["rfidReadersList"],
    queryFn: async () => {
      const res = await axios.get("/api/rfid/readers");
      return res.data?.data || [];
    },
  });

  // Fetch Zones
  const { data: zones = [] } = useQuery({
    queryKey: ["rfidZonesList"],
    queryFn: async () => {
      const res = await axios.get("/api/rfid/zones");
      return res.data?.data || [];
    },
  });

  // Set default reader
  useEffect(() => {
    if (readers.length > 0 && !selectedReaderId) {
      setSelectedReaderId(readers[0].id);
      if (readers[0].zoneId) setSelectedZoneId(readers[0].zoneId);
    }
  }, [readers, selectedReaderId]);

  // Throughput counter effect
  useEffect(() => {
    const rateTimer = setInterval(() => {
      setReadsPerSec(recentReadsCountRef.current);
      recentReadsCountRef.current = 0;
    }, 1000);
    return () => clearInterval(rateTimer);
  }, []);

  // Continuous scan simulator in development
  useEffect(() => {
    if (isScanning && selectedReaderId) {
      const activeReader = readers.find((r: any) => r.id === selectedReaderId);
      if (activeReader?.isMock) {
        burstIntervalRef.current = setInterval(async () => {
          try {
            const res = await axios.post(`/api/rfid/readers/${selectedReaderId}/mock-trigger`, { count: 2 });
            const obsList = res.data?.data || [];
            handleIngestObservations(obsList);
          } catch {}
        }, 800);
      }
    } else {
      if (burstIntervalRef.current) clearInterval(burstIntervalRef.current);
    }
    return () => {
      if (burstIntervalRef.current) clearInterval(burstIntervalRef.current);
    };
  }, [isScanning, selectedReaderId, readers]);

  const handleIngestObservations = async (obsList: any[]) => {
    if (obsList.length === 0) return;
    recentReadsCountRef.current += obsList.length;
    setTotalReadEvents((prev) => prev + obsList.length);
    playBeep();

    setDetectedTags((prev) => {
      const updated = new Map(prev);
      for (const obs of obsList) {
        const existing = updated.get(obs.epc);
        updated.set(obs.epc, {
          epc: obs.epc,
          readerId: obs.readerId,
          antennaNo: obs.antennaNo || 1,
          rssi: obs.peakRssi,
          timestamp: new Date(),
          readCount: (existing?.readCount || 0) + obs.readCount,
          productName: existing?.productName,
          productCode: existing?.productCode,
          purity: existing?.purity,
          gsWeight: existing?.gsWeight,
        });
      }
      return updated;
    });

    // Lookup product names for newly detected tags
    const epcsToLookup = obsList.map((o) => o.epc);
    try {
      const tagsRes = await axios.get("/api/rfid/tags", {
        params: { search: epcsToLookup[0] },
      });
      const foundTags = tagsRes.data?.data || [];
      if (foundTags.length > 0) {
        setDetectedTags((prev) => {
          const updated = new Map(prev);
          for (const t of foundTags) {
            const entry = updated.get(t.epc);
            if (entry && t.productItem) {
              entry.productName = t.productItem.name;
              entry.productCode = t.productItem.productCode;
              entry.purity = t.productItem.purity;
              entry.gsWeight = t.productItem.gsWeight;
            }
          }
          return updated;
        });
      }
    } catch {}
  };

  const handleToggleScan = () => {
    if (isScanning) {
      setIsScanning(false);
      toast.info("RF carrier scan paused.");
    } else {
      if (!selectedReaderId) {
        toast.error("Please select an active RFID reader first.");
        return;
      }
      setIsScanning(true);
      toast.success("RF carrier scan activated! Detecting physical tags in proximity...");
    }
  };

  const handleManualBurst = async () => {
    if (!selectedReaderId) return;
    try {
      const res = await axios.post(`/api/rfid/readers/${selectedReaderId}/mock-trigger`, { count: 5 });
      handleIngestObservations(res.data?.data || []);
      toast.success("Simulated RFID burst read!");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Burst failed");
    }
  };

  const handleClearReads = () => {
    setDetectedTags(new Map());
    setTotalReadEvents(0);
    toast.info("Scan feed cleared.");
  };

  const detectedList = Array.from(detectedTags.values()).sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-onyx-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gold/15 text-gold border border-gold/30">
              <Radar className={`w-5 h-5 ${isScanning ? "animate-spin" : ""}`} />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Live RFID Scan Studio</h1>
            <Badge
              variant={isScanning ? "default" : "outline"}
              className={`text-xs ${
                isScanning ? "bg-amber-500 text-black animate-pulse" : "text-platinum-muted"
              }`}
            >
              {isScanning ? "SCANNING ACTIVE" : "STANDBY"}
            </Badge>
          </div>
          <p className="text-xs text-platinum-muted">
            Continuous RF inventory detection studio with real-time signal stream, audio chimes, and automatic deduplication.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="border-onyx-border text-xs gap-1.5"
            title={soundEnabled ? "Mute audio feedback" : "Enable audio feedback"}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-gold" /> Sound On
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-platinum-muted" /> Sound Off
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleManualBurst}
            className="border-onyx-border bg-onyx-surface hover:text-gold text-xs gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 text-gold" /> Trigger Burst
          </Button>

          <Button
            size="sm"
            onClick={handleToggleScan}
            className={`font-semibold text-xs gap-1.5 shadow-md ${
              isScanning
                ? "bg-rose-500 hover:bg-rose-600 text-white"
                : "bg-gold hover:bg-gold-dark text-black"
            }`}
          >
            {isScanning ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" /> Stop Scanning
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" /> Start Live Scan
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Reader & Zone Configuration Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-onyx-surface/80 p-3.5 rounded-xl border border-onyx-border">
        <div>
          <label className="text-[11px] font-semibold text-platinum-muted block mb-1">
            Active RFID Reader
          </label>
          <select
            value={selectedReaderId}
            onChange={(e) => setSelectedReaderId(e.target.value)}
            className="w-full bg-onyx border border-onyx-border rounded-lg text-xs text-platinum px-3 py-1.5 focus:outline-none focus:border-gold"
          >
            {readers.map((r: any) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.readerCode}) — {r.status}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-semibold text-platinum-muted block mb-1">
            Assigned Zone Scope
          </label>
          <select
            value={selectedZoneId}
            onChange={(e) => setSelectedZoneId(e.target.value)}
            className="w-full bg-onyx border border-onyx-border rounded-lg text-xs text-platinum px-3 py-1.5 focus:outline-none focus:border-gold"
          >
            <option value="">All Zones / Floating</option>
            {zones.map((z: any) => (
              <option key={z.id} value={z.id}>
                {z.name} ({z.code})
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end justify-between sm:justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearReads}
            className="border-onyx-border text-xs text-platinum-muted hover:text-rose-400 gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear Feed
          </Button>

          <Link href="/rfid/audit">
            <Button size="sm" className="bg-gold/15 text-gold border border-gold/30 hover:bg-gold/25 text-xs gap-1">
              Create Audit from Scan <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Live Radar Gauges */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-onyx-surface border-onyx-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-platinum-muted uppercase font-semibold">Unique Items Detected</div>
              <div className="text-3xl font-bold text-foreground mt-1">{detectedTags.size}</div>
            </div>
            <div className="p-3 rounded-full bg-gold/10 text-gold">
              <Tags className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-onyx-surface border-onyx-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-platinum-muted uppercase font-semibold">Total RF Reads</div>
              <div className="text-3xl font-bold text-emerald-400 mt-1">
                {totalReadEvents.toLocaleString()}
              </div>
            </div>
            <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-400">
              <Radio className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-onyx-surface border-onyx-border">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-platinum-muted uppercase font-semibold">Read Throughput</div>
              <div className="text-3xl font-bold text-amber-400 mt-1">{readsPerSec} <span className="text-xs text-platinum-muted font-normal">reads/sec</span></div>
            </div>
            <div className="p-3 rounded-full bg-amber-500/10 text-amber-400">
              <Activity className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Stream Table */}
      <Card className="bg-onyx-surface/90 border-onyx-border shadow-sm overflow-hidden">
        <CardHeader className="py-3 px-4 border-b border-onyx-border/70 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isScanning ? "bg-gold animate-ping" : "bg-platinum-faint"}`} />
              Streaming Physical Detection Feed ({detectedList.length})
            </CardTitle>
          </div>
          <div className="text-[11px] text-platinum-muted">
            Auto-deduplicated (2000ms window)
          </div>
        </CardHeader>

        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-onyx/70 text-platinum-muted uppercase text-[10px] tracking-wider border-b border-onyx-border sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="px-4 py-2.5">EPC Code</th>
                <th className="px-4 py-2.5">Matched Product</th>
                <th className="px-4 py-2.5">Antenna</th>
                <th className="px-4 py-2.5">Peak Signal (RSSI)</th>
                <th className="px-4 py-2.5">Read Count</th>
                <th className="px-4 py-2.5">Last Detected</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-onyx-border/60">
              {detectedList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-platinum-muted space-y-2">
                    <Radar className="w-8 h-8 text-gold/30 mx-auto animate-pulse" />
                    <p className="text-xs">No RFID tags detected in current session.</p>
                    <p className="text-[10px] text-platinum-faint">
                      Click "Start Live Scan" or "Trigger Burst" to begin receiving physical reads.
                    </p>
                  </td>
                </tr>
              ) : (
                detectedList.map((tag) => (
                  <tr key={tag.epc} className="hover:bg-onyx/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-mono font-semibold text-gold">{tag.epc}</div>
                    </td>

                    <td className="px-4 py-3">
                      {tag.productName ? (
                        <div>
                          <div className="font-semibold text-foreground">{tag.productName}</div>
                          <div className="text-[10px] text-platinum-muted">
                            Code: {tag.productCode} · {tag.gsWeight}g · {tag.purity}K
                          </div>
                        </div>
                      ) : (
                        <span className="text-platinum-muted italic">Looking up... / Unassigned</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-[10px] font-mono text-platinum">
                        ANT {tag.antennaNo}
                      </Badge>
                    </td>

                    <td className="px-4 py-3 font-mono">
                      <div className="flex items-center gap-2">
                        <div className="w-12 bg-onyx rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-gold h-full rounded-full"
                            style={{
                              width: `${Math.min(100, Math.max(10, (tag.rssi + 80) * 2))}%`,
                            }}
                          />
                        </div>
                        <span className="text-platinum">{tag.rssi} dBm</span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-[11px]">
                        {tag.readCount}×
                      </span>
                    </td>

                    <td className="px-4 py-3 text-platinum-muted">
                      {tag.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setHistoryEpc(tag.epc)}
                        className="text-xs text-platinum-muted hover:text-gold h-7"
                      >
                        History →
                      </Button>
                    </td>
                  </tr>
                ))
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
