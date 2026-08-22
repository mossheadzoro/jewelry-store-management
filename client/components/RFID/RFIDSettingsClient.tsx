// client/components/RFID/RFIDSettingsClient.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Sliders,
  Radio,
  Cpu,
  Shield,
  Bell,
  Save,
  RefreshCw,
  Zap,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { toast } from "sonner";

export default function RFIDSettingsClient() {
  const [rfidEnabled, setRfidEnabled] = useState(true);
  const [defaultScanDurationSec, setDefaultScanDurationSec] = useState(30);
  const [deduplicationWindowMs, setDeduplicationWindowMs] = useState(2000);
  const [readerPollingIntervalMs, setReaderPollingIntervalMs] = useState(5000);
  const [heartbeatTimeoutSec, setHeartbeatTimeoutSec] = useState(30);
  const [highValueThreshold, setHighValueThreshold] = useState(100000);
  const [requireManagerAuthForReassign, setRequireManagerAuthForReassign] = useState(true);
  const [requireManagerAuthForRetire, setRequireManagerAuthForRetire] = useState(true);
  const [requireManagerAuthForSoldAlert, setRequireManagerAuthForSoldAlert] = useState(true);
  const [autoGenerateExceptions, setAutoGenerateExceptions] = useState(true);
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState(true);
  const [inAppAlertsEnabled, setInAppAlertsEnabled] = useState(true);
  const [mockReaderEnabled, setMockReaderEnabled] = useState(true);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["rfidSettings"],
    queryFn: async () => {
      const res = await axios.get("/api/rfid/settings");
      return res.data?.data;
    },
  });

  useEffect(() => {
    if (data) {
      setRfidEnabled(data.rfidEnabled ?? true);
      setDefaultScanDurationSec(data.defaultScanDurationSec ?? 30);
      setDeduplicationWindowMs(data.deduplicationWindowMs ?? 2000);
      setReaderPollingIntervalMs(data.readerPollingIntervalMs ?? 5000);
      setHeartbeatTimeoutSec(data.heartbeatTimeoutSec ?? 30);
      setHighValueThreshold(data.highValueThreshold ?? 100000);
      setRequireManagerAuthForReassign(data.requireManagerAuthForReassign ?? true);
      setRequireManagerAuthForRetire(data.requireManagerAuthForRetire ?? true);
      setRequireManagerAuthForSoldAlert(data.requireManagerAuthForSoldAlert ?? true);
      setAutoGenerateExceptions(data.autoGenerateExceptions ?? true);
      setSoundEffectsEnabled(data.soundEffectsEnabled ?? true);
      setInAppAlertsEnabled(data.inAppAlertsEnabled ?? true);
      setMockReaderEnabled(data.mockReaderEnabled ?? true);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await axios.put("/api/rfid/settings", payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("RFID settings saved successfully!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to save settings");
    },
  });

  const handleSave = () => {
    saveMutation.mutate({
      rfidEnabled,
      defaultScanDurationSec,
      deduplicationWindowMs,
      readerPollingIntervalMs,
      heartbeatTimeoutSec,
      highValueThreshold,
      requireManagerAuthForReassign,
      requireManagerAuthForRetire,
      requireManagerAuthForSoldAlert,
      autoGenerateExceptions,
      soundEffectsEnabled,
      inAppAlertsEnabled,
      mockReaderEnabled,
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-onyx-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gold/15 text-gold border border-gold/30">
              <Sliders className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">RFID Engine Settings</h1>
            <Badge variant="outline" className="text-xs text-gold border-gold/40">
              Branch Configuration
            </Badge>
          </div>
          <p className="text-xs text-platinum-muted">
            Hardware polling rates, deduplication windows, security thresholds, and authorization rules.
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

          <Button
            size="sm"
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="bg-gold hover:bg-gold-dark text-black font-semibold text-xs gap-1.5 shadow-md"
          >
            <Save className="w-3.5 h-3.5" /> Save Changes
          </Button>
        </div>
      </div>

      <div className="space-y-5">
        {/* 1. General & Hardware */}
        <Card className="bg-onyx-surface border-onyx-border shadow-sm">
          <CardHeader className="pb-3 border-b border-onyx-border/60">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Radio className="w-4 h-4 text-gold" /> General & Hardware Communication
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-foreground">RFID Module Enabled</div>
                <div className="text-[11px] text-platinum-muted">
                  Enables live RFID observation layer across Inventory, Billing, and Audits.
                </div>
              </div>
              <input
                type="checkbox"
                checked={rfidEnabled}
                onChange={(e) => setRfidEnabled(e.target.checked)}
                className="rounded border-onyx-border text-gold focus:ring-gold w-4 h-4"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-onyx-border/40">
              <div>
                <label className="text-[11px] font-semibold text-platinum-muted block mb-1">
                  Deduplication Window (ms)
                </label>
                <input
                  type="number"
                  step="500"
                  min="500"
                  max="10000"
                  value={deduplicationWindowMs}
                  onChange={(e) => setDeduplicationWindowMs(parseInt(e.target.value, 10))}
                  className="w-full bg-onyx px-3 py-1.5 rounded-lg border border-onyx-border text-xs text-platinum focus:outline-none focus:border-gold"
                />
                <span className="text-[10px] text-platinum-faint">
                  Smooths repetitive RF reads into a single observation window.
                </span>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-platinum-muted block mb-1">
                  Reader Heartbeat Timeout (sec)
                </label>
                <input
                  type="number"
                  min="10"
                  max="300"
                  value={heartbeatTimeoutSec}
                  onChange={(e) => setHeartbeatTimeoutSec(parseInt(e.target.value, 10))}
                  className="w-full bg-onyx px-3 py-1.5 rounded-lg border border-onyx-border text-xs text-platinum focus:outline-none focus:border-gold"
                />
                <span className="text-[10px] text-platinum-faint">
                  Marks reader as OFFLINE if no heartbeat packet is received.
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Security & Manager Authorization */}
        <Card className="bg-onyx-surface border-onyx-border shadow-sm">
          <CardHeader className="pb-3 border-b border-onyx-border/60">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Shield className="w-4 h-4 text-gold" /> Security & Manager Authorization
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4 text-xs">
            <div>
              <label className="text-[11px] font-semibold text-platinum-muted block mb-1">
                High-Value Item Alert Threshold (₹ INR)
              </label>
              <input
                type="number"
                step="10000"
                min="10000"
                value={highValueThreshold}
                onChange={(e) => setHighValueThreshold(parseFloat(e.target.value))}
                className="w-full sm:w-64 bg-onyx px-3 py-1.5 rounded-lg border border-onyx-border text-xs text-platinum focus:outline-none focus:border-gold"
              />
              <span className="text-[10px] text-platinum-faint block mt-1">
                Jewellery exceeding this price triggers CRITICAL severity exceptions upon variance detection.
              </span>
            </div>

            <div className="space-y-3 pt-2 border-t border-onyx-border/40">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-foreground">Require Manager Authorization for Tag Reassignment</div>
                  <div className="text-[11px] text-platinum-muted">
                    Prevents staff from transferring active RFID tags without manager approval.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={requireManagerAuthForReassign}
                  onChange={(e) => setRequireManagerAuthForReassign(e.target.checked)}
                  className="rounded border-onyx-border text-gold focus:ring-gold w-4 h-4"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-foreground">Require Manager Authorization for Tag Retirement</div>
                  <div className="text-[11px] text-platinum-muted">
                    Ensures retiring a physical tag generates a manager-stamped audit entry.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={requireManagerAuthForRetire}
                  onChange={(e) => setRequireManagerAuthForRetire(e.target.checked)}
                  className="rounded border-onyx-border text-gold focus:ring-gold w-4 h-4"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-foreground">Require Authorization for Sold Item Sighting Resolution</div>
                  <div className="text-[11px] text-platinum-muted">
                    Mandatory manager approval when resolving an alert where a sold item is physically detected.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={requireManagerAuthForSoldAlert}
                  onChange={(e) => setRequireManagerAuthForSoldAlert(e.target.checked)}
                  className="rounded border-onyx-border text-gold focus:ring-gold w-4 h-4"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Simulator & Notifications */}
        <Card className="bg-onyx-surface border-onyx-border shadow-sm">
          <CardHeader className="pb-3 border-b border-onyx-border/60">
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <Bell className="w-4 h-4 text-gold" /> Feedback & Development Simulator
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-foreground">Mock Hardware Simulator Enabled</div>
                <div className="text-[11px] text-platinum-muted">
                  Permits developers and staff to trigger simulated RFID tag bursts for testing workflows.
                </div>
              </div>
              <input
                type="checkbox"
                checked={mockReaderEnabled}
                onChange={(e) => setMockReaderEnabled(e.target.checked)}
                className="rounded border-onyx-border text-gold focus:ring-gold w-4 h-4"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-foreground">Web Audio Chime on Tag Detection</div>
                <div className="text-[11px] text-platinum-muted">
                  Plays an acoustic pulse tone in the browser when new RFID tags are read.
                </div>
              </div>
              <input
                type="checkbox"
                checked={soundEffectsEnabled}
                onChange={(e) => setSoundEffectsEnabled(e.target.checked)}
                className="rounded border-onyx-border text-gold focus:ring-gold w-4 h-4"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
