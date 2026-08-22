// client/components/Billing/RFIDBillingScanModal.tsx
"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Radio,
  ScanLine,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles,
  Plus,
  Trash2,
} from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

interface RFIDBillingScanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId?: number;
  onAddProducts: (products: any[]) => void;
}

export default function RFIDBillingScanModal({
  open,
  onOpenChange,
  branchId,
  onAddProducts,
}: RFIDBillingScanModalProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scannedEpcs, setScannedEpcs] = useState<string[]>([]);
  const [inputEpc, setInputEpc] = useState("");
  const [validationData, setValidationData] = useState<{
    validItems: any[];
    invalidItems: any[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  // Trigger simulated/live tray scan
  const handleStartTrayScan = async () => {
    setIsScanning(true);
    setLoading(true);
    try {
      // 1. Fetch available readers in branch
      const readersRes = await axios.get("/api/rfid/readers");
      const readers = readersRes.data?.data || [];
      const counterReader =
        readers.find((r: any) => r.zone?.type === "COUNTER") || readers[0];

      if (counterReader) {
        // Trigger mock burst or query active reader
        const triggerRes = await axios.post(
          `/api/rfid/readers/${counterReader.id}/mock-trigger`,
          { count: 4 }
        );
        const epcs = triggerRes.data?.data?.map((obs: any) => obs.epc) || [];
        setScannedEpcs(epcs);

        // Validate items for billing
        await validateEpcs(epcs);
      } else {
        toast.info("No active RFID readers detected. You can scan or type EPCs manually.");
      }
    } catch (err: any) {
      console.error("Tray scan error:", err);
      toast.error(err.response?.data?.error || "Failed to trigger RFID tray scan");
    } finally {
      setIsScanning(false);
      setLoading(false);
    }
  };

  const validateEpcs = async (epcs: string[]) => {
    if (epcs.length === 0) return;
    setLoading(true);
    try {
      const res = await axios.post("/api/rfid/billing-scan", {
        epcs,
        branchId,
      });
      setValidationData({
        validItems: res.data?.data?.validItems || [],
        invalidItems: res.data?.data?.invalidItems || [],
      });
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Validation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAddManualEpc = () => {
    if (!inputEpc.trim()) return;
    const clean = inputEpc.trim().toUpperCase();
    if (scannedEpcs.includes(clean)) {
      toast.info("EPC already in scan list");
      return;
    }
    const updated = [...scannedEpcs, clean];
    setScannedEpcs(updated);
    setInputEpc("");
    validateEpcs(updated);
  };

  const handleRemoveEpc = (epc: string) => {
    const updated = scannedEpcs.filter((e) => e !== epc);
    setScannedEpcs(updated);
    validateEpcs(updated);
  };

  const handleConfirmAdd = () => {
    if (!validationData || validationData.validItems.length === 0) {
      toast.error("No eligible items to add.");
      return;
    }

    onAddProducts(validationData.validItems);
    toast.success(`Added ${validationData.validItems.length} RFID items to invoice!`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-onyx border-onyx-border text-platinum">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gold/10 text-gold">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                RFID Counter Tray Scanner
              </DialogTitle>
              <DialogDescription className="text-xs text-platinum-muted">
                Place jewellery items on the RFID counter pad to automatically load them into the invoice.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex items-center gap-3 p-3 bg-onyx-surface rounded-xl border border-onyx-border">
            <Button
              onClick={handleStartTrayScan}
              disabled={isScanning || loading}
              className="bg-gold hover:bg-gold-dark text-black font-semibold shadow-md gap-2"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Scanning Tray...
                </>
              ) : (
                <>
                  <ScanLine className="w-4 h-4" /> Scan Countertop Tray
                </>
              )}
            </Button>

            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                placeholder="Or type/paste EPC (e.g. E280...)"
                value={inputEpc}
                onChange={(e) => setInputEpc(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddManualEpc()}
                className="w-full bg-onyx px-3 py-1.5 rounded-lg border border-onyx-border text-xs text-platinum placeholder:text-platinum-faint focus:outline-none focus:border-gold"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddManualEpc}
                className="border-onyx-border text-xs"
              >
                Add
              </Button>
            </div>
          </div>

          {/* Scanned Items Results */}
          {validationData && (
            <div className="space-y-3">
              {/* Valid Items Section */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Eligible Items for Billing (
                    {validationData.validItems.length})
                  </span>
                </div>

                {validationData.validItems.length === 0 ? (
                  <div className="text-center py-6 text-xs text-platinum-muted bg-onyx-surface/40 rounded-lg border border-dashed border-onyx-border">
                    No eligible items detected yet.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {validationData.validItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-lg bg-onyx-surface border border-emerald-500/20 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <div className="font-semibold text-foreground flex items-center gap-2">
                            {item.name}
                            <Badge variant="outline" className="text-[10px] text-gold border-gold/30">
                              {item.productCode}
                            </Badge>
                          </div>
                          <div className="text-[11px] text-platinum-muted">
                            {item.category} · Gross: {item.gsWeight}g · Net: {item.ntWeight}g · Purity:{" "}
                            {item.purity}K
                          </div>
                          <div className="font-mono text-[10px] text-platinum-faint">
                            EPC: {item.epc}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="font-semibold text-gold">
                              {item.price ? `₹${item.price.toLocaleString("en-IN")}` : "Calculated Rate"}
                            </div>
                            <div className="text-[10px] text-emerald-400">Ready to Add</div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveEpc(item.epc)}
                            className="text-platinum-muted hover:text-destructive h-7 w-7"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Invalid Items Section */}
              {validationData.invalidItems.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-rose-400 mb-2">
                    <AlertTriangle className="w-4 h-4" /> Ineligible / Flagged Tags (
                    {validationData.invalidItems.length})
                  </div>
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {validationData.invalidItems.map((inv, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-between text-xs text-rose-300"
                      >
                        <div>
                          <div className="font-mono text-[11px] font-semibold">{inv.epc}</div>
                          <div className="text-[11px] text-rose-400/90">{inv.reason}</div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveEpc(inv.epc)}
                          className="text-rose-400 hover:text-rose-300 h-6 w-6"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-onyx-border text-xs"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmAdd}
            disabled={!validationData || validationData.validItems.length === 0}
            className="bg-gold hover:bg-gold-dark text-black font-semibold text-xs gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add{" "}
            {validationData?.validItems?.length || 0} Items to Cart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
