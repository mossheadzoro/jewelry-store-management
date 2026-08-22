// client/components/RFID/RFIDZonesClient.tsx
"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MapPin,
  Plus,
  Radio,
  Cpu,
  Layers,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Edit2,
  Tags,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import axios from "axios";
import { toast } from "sonner";
import Link from "next/link";

export default function RFIDZonesClient() {
  const queryClient = useQueryClient();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Form
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("COUNTER");
  const [formIsVault, setFormIsVault] = useState(false);
  const [formDescription, setFormDescription] = useState("");
  const [formColor, setFormColor] = useState("gold");

  const { data: zones = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["rfidZonesList"],
    queryFn: async () => {
      const res = await axios.get("/api/rfid/zones");
      return res.data?.data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await axios.post("/api/rfid/zones", payload);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Zone created successfully!");
      queryClient.invalidateQueries({ queryKey: ["rfidZonesList"] });
      setCreateModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to create zone");
    },
  });

  const resetForm = () => {
    setFormCode("");
    setFormName("");
    setFormType("COUNTER");
    setFormIsVault(false);
    setFormDescription("");
    setFormColor("gold");
  };

  const handleSeedDefaultZones = async () => {
    const defaults = [
      { code: "ZONE-CTR-01", name: "Counter 01 — Diamond & Polki", type: "COUNTER", isSecureVault: false },
      { code: "ZONE-CTR-02", name: "Counter 02 — 22K Gold Bangles & Chains", type: "COUNTER", isSecureVault: false },
      { code: "ZONE-CTR-03", name: "Counter 03 — Bridal & Necklace Sets", type: "COUNTER", isSecureVault: false },
      { code: "ZONE-CTR-04", name: "Counter 04 — Daily Wear & Rings", type: "COUNTER", isSecureVault: false },
      { code: "ZONE-VAULT", name: "Main Store Safe & Vault", type: "VAULT", isSecureVault: true },
      { code: "ZONE-WORKSHOP", name: "Karigar Workshop Desk", type: "KARIGAR_DESK", isSecureVault: false },
      { code: "ZONE-RECEIVING", name: "Stock Inward & Receiving", type: "RECEIVING", isSecureVault: false },
      { code: "ZONE-GATE", name: "Main Store Entrance Gate", type: "ENTRANCE_GATE", isSecureVault: false },
    ];

    for (const z of defaults) {
      try {
        await axios.post("/api/rfid/zones", z);
      } catch {}
    }
    toast.success("Standard jewellery store physical zones initialized!");
    refetch();
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-onyx-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gold/15 text-gold border border-gold/30">
              <MapPin className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Physical Branch Zones</h1>
            <Badge variant="outline" className="text-xs text-gold border-gold/40">
              {zones.length} Configured Zones
            </Badge>
          </div>
          <p className="text-xs text-platinum-muted">
            Map showroom counters, safe/vaults, workshop desks, and portals to identify physical jewellery location.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {zones.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeedDefaultZones}
              className="border-gold/30 bg-gold/10 text-gold text-xs gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" /> Initialize Standard Zones
            </Button>
          )}

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
            onClick={() => {
              resetForm();
              setCreateModalOpen(true);
            }}
            className="bg-gold hover:bg-gold-dark text-black font-semibold text-xs gap-1.5 shadow-md"
          >
            <Plus className="w-3.5 h-3.5" /> Create Zone
          </Button>
        </div>
      </div>

      {/* Zones Cards Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-platinum-muted animate-pulse">Loading physical zones...</div>
      ) : zones.length === 0 ? (
        <Card className="bg-onyx-surface/60 border-onyx-border p-12 text-center">
          <MapPin className="w-12 h-12 text-gold/40 mx-auto mb-3" />
          <h3 className="text-base font-bold text-foreground mb-1">No Physical Zones Configured</h3>
          <p className="text-xs text-platinum-muted max-w-md mx-auto mb-4">
            Initialize standard jewellery zones (Counters 01-04, Vault, Workshop) to start tracking physical locations.
          </p>
          <Button onClick={handleSeedDefaultZones} className="bg-gold text-black font-semibold text-xs gap-1.5">
            <Sparkles className="w-4 h-4" /> Initialize Standard Zones
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {zones.map((zone: any) => (
            <Card
              key={zone.id}
              className={`bg-onyx-surface border-onyx-border shadow-sm flex flex-col justify-between hover:border-gold/40 transition-all ${
                zone.isSecureVault ? "border-amber-500/30 bg-amber-500/5" : ""
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] font-mono uppercase text-gold border-gold/30">
                    {zone.code}
                  </Badge>
                  {zone.isSecureVault && (
                    <Badge variant="destructive" className="text-[9px] px-1.5 py-0">
                      SECURE VAULT
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-sm font-bold text-foreground mt-2">{zone.name}</CardTitle>
                <CardDescription className="text-[11px] text-platinum-muted capitalize">
                  {zone.type.replace(/_/g, " ").toLowerCase()}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 text-xs">
                {zone.description && (
                  <p className="text-[11px] text-platinum-muted line-clamp-2">{zone.description}</p>
                )}

                <div className="p-2.5 rounded-lg bg-onyx border border-onyx-border/80 space-y-1.5">
                  <div className="flex items-center justify-between text-platinum-muted">
                    <span className="flex items-center gap-1.5">
                      <Tags className="w-3.5 h-3.5 text-gold" /> Expected Items:
                    </span>
                    <span className="font-semibold text-platinum">{zone._count?.tags || 0}</span>
                  </div>

                  <div className="flex items-center justify-between text-platinum-muted">
                    <span className="flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-gold" /> Assigned Readers:
                    </span>
                    <span className="font-semibold text-platinum">{zone.readers?.length || 0}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-onyx-border flex items-center justify-between text-[11px]">
                  <Link
                    href={`/rfid/tags?zoneId=${zone.id}`}
                    className="text-gold hover:underline flex items-center gap-1"
                  >
                    View Items →
                  </Link>
                  <Link
                    href={`/rfid/audit`}
                    className="text-platinum-muted hover:text-platinum"
                  >
                    Audit Zone
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* --- DIALOG: CREATE ZONE --- */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-md bg-onyx border-onyx-border text-platinum">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gold" /> Create Physical Zone
            </DialogTitle>
            <DialogDescription className="text-xs text-platinum-muted">
              Define a physical location inside this showroom branch.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-semibold text-platinum-muted block mb-1">
                  Zone Code *
                </label>
                <input
                  type="text"
                  placeholder="e.g. ZONE-CTR-05"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  className="w-full bg-onyx-surface px-3 py-1.5 rounded-lg border border-onyx-border text-xs text-platinum font-mono focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-platinum-muted block mb-1">
                  Zone Type
                </label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full bg-onyx-surface px-3 py-1.5 rounded-lg border border-onyx-border text-xs text-platinum focus:outline-none focus:border-gold"
                >
                  <option value="COUNTER">Counter Showcase</option>
                  <option value="SHOWROOM">Showroom Floor</option>
                  <option value="VAULT">Main Vault</option>
                  <option value="SAFE">Secondary Safe</option>
                  <option value="KARIGAR_DESK">Karigar Workshop</option>
                  <option value="REPAIR_WORKSHOP">Repair Desk</option>
                  <option value="PACKAGING">Packaging & Dispatch</option>
                  <option value="RECEIVING">Stock Receiving</option>
                  <option value="ENTRANCE_GATE">Entrance Gate</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-platinum-muted block mb-1">
                Zone Friendly Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Counter 05 — Antique Kundan Sets"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full bg-onyx-surface px-3 py-1.5 rounded-lg border border-onyx-border text-xs text-platinum focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-platinum-muted block mb-1">
                Description / Scope
              </label>
              <input
                type="text"
                placeholder="Optional notes or categories held..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                className="w-full bg-onyx-surface px-3 py-1.5 rounded-lg border border-onyx-border text-xs text-platinum focus:outline-none focus:border-gold"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isVaultCheck"
                checked={formIsVault}
                onChange={(e) => setFormIsVault(e.target.checked)}
                className="rounded border-onyx-border text-gold focus:ring-gold"
              />
              <label htmlFor="isVaultCheck" className="text-xs text-platinum cursor-pointer">
                High-Security Secure Vault / Safe (Generates CRITICAL severity alerts if items missing)
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateModalOpen(false)}
              className="border-onyx-border text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!formCode || !formName || createMutation.isPending}
              onClick={() =>
                createMutation.mutate({
                  code: formCode,
                  name: formName,
                  type: formType,
                  isSecureVault: formIsVault,
                  description: formDescription,
                  color: formColor,
                })
              }
              className="bg-gold hover:bg-gold-dark text-black font-semibold text-xs"
            >
              {createMutation.isPending ? "Creating..." : "Create Zone"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
