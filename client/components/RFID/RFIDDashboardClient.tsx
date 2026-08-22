// client/components/RFID/RFIDDashboardClient.tsx
"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Radio,
  Cpu,
  Tags,
  Radar,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  RefreshCw,
  Plus,
  Play,
  ArrowRight,
  ShieldAlert,
  Zap,
  Activity,
  Layers,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import { RFIDHistoryDialog } from "../Inventory/RFIDHistoryDialog";

export default function RFIDDashboardClient() {
  const [historyEpc, setHistoryEpc] = useState<string | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["rfidDashboardData"],
    queryFn: async () => {
      const res = await axios.get("/api/rfid/dashboard");
      return res.data?.data;
    },
    refetchInterval: 10000, // auto refresh every 10s
  });

  const handleSimulateBurst = async () => {
    try {
      const readersRes = await axios.get("/api/rfid/readers");
      const readers = readersRes.data?.data || [];
      if (readers.length === 0) {
        toast.info("No readers found. Please register or enable a mock reader in the Readers tab.");
        return;
      }
      const reader = readers[0];
      await axios.post(`/api/rfid/readers/${reader.id}/mock-trigger`, { count: 6 });
      toast.success(`Simulated 6 RFID tag reads on "${reader.name}"`);
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to trigger simulated read");
    }
  };

  const readers = data?.readers || { total: 0, online: 0, offline: 0, error: 0, scanning: 0 };
  const tags = data?.tags || { total: 0, active: 0, unassigned: 0, suspended: 0, retired: 0 };
  const scanning = data?.scanning || { readsToday: 0, uniqueItemsToday: 0, activeSessions: 0 };
  const reconciliation = data?.reconciliation || {
    totalExpected: 0,
    totalDetected: 0,
    matched: 0,
    missing: 0,
    unexpected: 0,
    wrongZone: 0,
    wrongBranch: 0,
  };
  const alerts = data?.alerts || [];
  const zones = data?.zones || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-onyx-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gold/15 text-gold border border-gold/30 shadow-sm">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              RFID Operations & Intelligence
            </h1>
            <Badge variant="outline" className="text-xs text-gold border-gold/40 bg-gold/5">
              Live Hardware Layer
            </Badge>
          </div>
          <p className="text-xs text-platinum-muted">
            Hardware-vendor agnostic physical jewellery observation, zone tracking, and automated audit reconciliation.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSimulateBurst}
            className="border-onyx-border bg-onyx-surface hover:bg-gold/10 hover:text-gold text-xs gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 text-gold" /> Simulate Hardware Scan
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="border-onyx-border text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-gold" : ""}`} /> Refresh
          </Button>

          <Link href="/rfid/audit">
            <Button size="sm" className="bg-gold hover:bg-gold-dark text-black font-semibold text-xs gap-1.5 shadow-md">
              <Play className="w-3.5 h-3.5" /> Start Inventory Audit
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Readers Status */}
        <Card className="bg-onyx-surface/80 border-onyx-border shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-platinum-muted">
              RFID Readers
            </CardTitle>
            <Cpu className="w-4 h-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">{readers.online}</span>
              <span className="text-xs text-platinum-muted">/ {readers.total} Online</span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-[11px] text-platinum-muted">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> {readers.online} Active
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-400" /> {readers.offline} Offline
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 2. Tag Inventory */}
        <Card className="bg-onyx-surface/80 border-onyx-border shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-platinum-muted">
              Tagged Jewellery
            </CardTitle>
            <Tags className="w-4 h-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">{tags.active}</span>
              <span className="text-xs text-platinum-muted">Active Tags</span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-[11px] text-platinum-muted">
              <span>{tags.unassigned} Unassigned</span>
              <span>·</span>
              <span>{tags.retired} Retired</span>
            </div>
          </CardContent>
        </Card>

        {/* 3. Physical Reads Today */}
        <Card className="bg-onyx-surface/80 border-onyx-border shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-platinum-muted">
              Reads Today
            </CardTitle>
            <Activity className="w-4 h-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">{scanning.readsToday.toLocaleString()}</span>
              <span className="text-xs text-emerald-400 font-medium">Read Events</span>
            </div>
            <div className="mt-3 text-[11px] text-platinum-muted">
              <span className="text-gold font-semibold">{scanning.uniqueItemsToday}</span> Unique Items Observed
            </div>
          </CardContent>
        </Card>

        {/* 4. Active Scan Sessions */}
        <Card className="bg-onyx-surface/80 border-onyx-border shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-platinum-muted">
              Audit Accuracy
            </CardTitle>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-400">
                {reconciliation.totalExpected > 0
                  ? `${Math.round((reconciliation.matched / reconciliation.totalExpected) * 100)}%`
                  : "100%"}
              </span>
              <span className="text-xs text-platinum-muted">Matched Ratio</span>
            </div>
            <div className="mt-3 text-[11px] text-platinum-muted">
              {reconciliation.missing > 0 ? (
                <span className="text-rose-400 font-medium">{reconciliation.missing} Items Missing</span>
              ) : (
                <span className="text-emerald-400">Zero Missing Items</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Physical Zones Map & Security Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Physical Zones Overview */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-onyx-surface/90 border-onyx-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gold" /> Physical Zones & Floor Coverage
                </CardTitle>
                <CardDescription className="text-xs text-platinum-muted">
                  Live expected inventory and reader assignments across branch zones.
                </CardDescription>
              </div>
              <Link href="/rfid/zones">
                <Button variant="ghost" size="sm" className="text-xs text-gold hover:text-gold-light gap-1">
                  Manage Zones <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {zones.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-onyx-border rounded-xl">
                  <p className="text-xs text-platinum-muted mb-3">No physical zones configured yet for this branch.</p>
                  <Link href="/rfid/zones">
                    <Button size="sm" className="bg-gold text-black text-xs font-semibold gap-1.5">
                      <Plus className="w-3.5 h-3.5" /> Create Zones
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {zones.map((zone: any) => (
                    <div
                      key={zone.id}
                      className="p-3.5 rounded-xl bg-onyx border border-onyx-border/80 hover:border-gold/30 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className="text-[10px] uppercase font-mono text-gold border-gold/30 bg-gold/5"
                        >
                          {zone.code}
                        </Badge>
                        {zone.isSecureVault && (
                          <Badge variant="destructive" className="text-[9px] px-1.5 py-0">
                            SECURE VAULT
                          </Badge>
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-foreground truncate">{zone.name}</div>
                        <div className="text-[11px] text-platinum-muted capitalize">{zone.type.toLowerCase()}</div>
                      </div>
                      <div className="pt-2 border-t border-onyx-border/60 flex items-center justify-between text-[11px]">
                        <span className="text-platinum-muted">Inventory:</span>
                        <span className="font-semibold text-platinum">{zone._count?.tags || 0} Items</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions Hub */}
          <Card className="bg-onyx-surface/60 border-onyx-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-platinum-muted">
                RFID Quick Operations
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link href="/rfid/scans" className="block">
                <div className="p-3 rounded-xl bg-onyx border border-onyx-border hover:border-gold/40 hover:bg-gold/5 transition-all text-center space-y-1.5 cursor-pointer">
                  <Radar className="w-5 h-5 text-gold mx-auto" />
                  <div className="text-xs font-semibold text-foreground">Live Scan Studio</div>
                  <div className="text-[10px] text-platinum-muted">Continuous RF detection</div>
                </div>
              </Link>

              <Link href="/rfid/tags" className="block">
                <div className="p-3 rounded-xl bg-onyx border border-onyx-border hover:border-gold/40 hover:bg-gold/5 transition-all text-center space-y-1.5 cursor-pointer">
                  <Tags className="w-5 h-5 text-gold mx-auto" />
                  <div className="text-xs font-semibold text-foreground">Tag Management</div>
                  <div className="text-[10px] text-platinum-muted">Assign & Replace</div>
                </div>
              </Link>

              <Link href="/rfid/exceptions" className="block">
                <div className="p-3 rounded-xl bg-onyx border border-onyx-border hover:border-gold/40 hover:bg-gold/5 transition-all text-center space-y-1.5 cursor-pointer">
                  <AlertTriangle className="w-5 h-5 text-amber-400 mx-auto" />
                  <div className="text-xs font-semibold text-foreground">Discrepancies</div>
                  <div className="text-[10px] text-platinum-muted">Resolve exceptions</div>
                </div>
              </Link>

              <Link href="/rfid/movements" className="block">
                <div className="p-3 rounded-xl bg-onyx border border-onyx-border hover:border-gold/40 hover:bg-gold/5 transition-all text-center space-y-1.5 cursor-pointer">
                  <Activity className="w-5 h-5 text-emerald-400 mx-auto" />
                  <div className="text-xs font-semibold text-foreground">Movement Timeline</div>
                  <div className="text-[10px] text-platinum-muted">Physical sightings</div>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Live Discrepancies & Security Alerts */}
        <div className="space-y-4">
          <Card className="bg-onyx-surface/90 border-onyx-border shadow-sm h-full flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-onyx-border">
              <div>
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-400" /> Security & Variance Alerts
                </CardTitle>
                <CardDescription className="text-xs text-platinum-muted">
                  Open exceptions requiring review
                </CardDescription>
              </div>
              <Link href="/rfid/exceptions">
                <Badge variant="outline" className="text-[10px] text-gold border-gold/30 hover:bg-gold/10">
                  View All
                </Badge>
              </Link>
            </CardHeader>
            <CardContent className="pt-3 flex-1 flex flex-col justify-between">
              {alerts.length === 0 ? (
                <div className="py-12 text-center text-xs text-platinum-muted space-y-2">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto" />
                  <p>All physical inventory matches ERP records.</p>
                  <p className="text-[10px] text-platinum-faint">Zero open variance exceptions</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                  {alerts.map((alert: any) => (
                    <div
                      key={alert.id}
                      className="p-3 rounded-xl bg-onyx border border-onyx-border hover:border-amber-500/30 transition-colors space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <Badge
                          variant={
                            alert.severity === "CRITICAL"
                              ? "destructive"
                              : alert.severity === "HIGH"
                              ? "destructive"
                              : "secondary"
                          }
                          className="text-[9px] px-1.5 py-0"
                        >
                          {alert.type.replace(/_/g, " ")}
                        </Badge>
                        <span className="text-[10px] text-platinum-muted">
                          {new Date(alert.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div className="font-semibold text-foreground truncate">
                        {alert.productItem ? alert.productItem.name : `Tag: ${alert.tagEpc}`}
                      </div>
                      <div className="text-[11px] text-platinum-muted line-clamp-2">
                        {alert.details || "Discrepancy detected during RFID scan"}
                      </div>
                      <div className="pt-1 flex items-center justify-between text-[10px]">
                        <button
                          onClick={() => setHistoryEpc(alert.tagEpc)}
                          className="text-gold hover:underline"
                        >
                          View Timeline
                        </button>
                        <Link href="/rfid/exceptions" className="text-platinum-muted hover:text-platinum">
                          Investigate →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <RFIDHistoryDialog
        epc={historyEpc}
        open={!!historyEpc}
        onOpenChange={(open) => !open && setHistoryEpc(null)}
      />
    </div>
  );
}
