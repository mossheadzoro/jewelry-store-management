// client/components/RFID/RFIDExceptionsClient.tsx
"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ShieldAlert,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  RefreshCw,
  MoreVertical,
  ShieldCheck,
  MapPin,
  FileText,
  UserCheck,
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
import { RFIDHistoryDialog } from "../Inventory/RFIDHistoryDialog";

export default function RFIDExceptionsClient() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("OPEN");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  // Resolution Dialog State
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [selectedException, setSelectedException] = useState<any | null>(null);
  const [resolutionType, setResolutionType] = useState("ITEM_FOUND");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [historyEpc, setHistoryEpc] = useState<string | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["rfidExceptionsList", search, statusFilter, severityFilter, typeFilter, page],
    queryFn: async () => {
      const res = await axios.get("/api/rfid/exceptions", {
        params: {
          search: search || undefined,
          status: statusFilter !== "ALL" ? statusFilter : undefined,
          severity: severityFilter !== "ALL" ? severityFilter : undefined,
          type: typeFilter !== "ALL" ? typeFilter : undefined,
          page,
          limit: 30,
        },
      });
      return res.data;
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await axios.post(`/api/rfid/exceptions/${id}/resolve`, payload);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Exception resolved successfully!");
      queryClient.invalidateQueries({ queryKey: ["rfidExceptionsList"] });
      setResolveModalOpen(false);
      setSelectedException(null);
      setResolutionNotes("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to resolve exception");
    },
  });

  const exceptions = data?.data || [];
  const pagination = data?.pagination || { page: 1, total: 0, totalPages: 1 };

  const handleOpenResolve = (exc: any) => {
    setSelectedException(exc);
    setResolutionType("ITEM_FOUND");
    setResolutionNotes("");
    setResolveModalOpen(true);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-onyx-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Discrepancy & Security Exceptions
            </h1>
            <Badge variant="outline" className="text-xs text-amber-400 border-amber-500/40">
              {pagination.total} Total Exceptions
            </Badge>
          </div>
          <p className="text-xs text-platinum-muted">
            Authorized investigation workflow for missing stock, wrong zone movements, sold items detected, and security alerts.
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

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-onyx-surface/80 p-3.5 rounded-xl border border-onyx-border">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-platinum-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by exception #, EPC, barcode, item name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-1.5 bg-onyx border border-onyx-border rounded-lg text-xs text-platinum placeholder:text-platinum-faint focus:outline-none focus:border-gold"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="bg-onyx border border-onyx-border rounded-lg text-xs text-platinum px-3 py-1.5 focus:outline-none focus:border-gold"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">OPEN (Unresolved)</option>
            <option value="INVESTIGATING">INVESTIGATING</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => {
              setSeverityFilter(e.target.value);
              setPage(1);
            }}
            className="bg-onyx border border-onyx-border rounded-lg text-xs text-platinum px-3 py-1.5 focus:outline-none focus:border-gold"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="bg-onyx border border-onyx-border rounded-lg text-xs text-platinum px-3 py-1.5 focus:outline-none focus:border-gold"
          >
            <option value="ALL">All Exception Types</option>
            <option value="MISSING">MISSING</option>
            <option value="WRONG_ZONE">WRONG ZONE</option>
            <option value="WRONG_BRANCH">WRONG BRANCH</option>
            <option value="SOLD_ITEM_DETECTED">SOLD ITEM DETECTED</option>
            <option value="UNEXPECTED">UNEXPECTED</option>
            <option value="UNASSIGNED_TAG">UNASSIGNED TAG</option>
          </select>
        </div>
      </div>

      {/* Exceptions Table */}
      <Card className="bg-onyx-surface/90 border-onyx-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-onyx/70 text-platinum-muted uppercase text-[10px] tracking-wider border-b border-onyx-border">
              <tr>
                <th className="px-4 py-3">Exception #</th>
                <th className="px-4 py-3">Severity & Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Jewellery Item</th>
                <th className="px-4 py-3">Expected vs Detected</th>
                <th className="px-4 py-3">Flagged At</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-onyx-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-platinum-muted animate-pulse">
                    Loading exceptions queue...
                  </td>
                </tr>
              ) : exceptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-platinum-muted space-y-1">
                    <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto" />
                    <p className="font-semibold text-foreground">Zero Open Exceptions</p>
                    <p className="text-[10px] text-platinum-faint">No variance or security discrepancies flagged.</p>
                  </td>
                </tr>
              ) : (
                exceptions.map((exc: any) => {
                  const isCritical = exc.severity === "CRITICAL";
                  const isHigh = exc.severity === "HIGH";
                  const isOpen = exc.status === "OPEN";

                  return (
                    <tr key={exc.id} className="hover:bg-onyx/50 transition-colors">
                      {/* Exception No */}
                      <td className="px-4 py-3.5">
                        <div className="font-mono font-semibold text-gold">{exc.exceptionNo}</div>
                        {exc.scanSession && (
                          <div className="text-[10px] text-platinum-muted font-mono">{exc.scanSession.sessionNo}</div>
                        )}
                      </td>

                      {/* Severity & Type */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <Badge
                            variant={isCritical || isHigh ? "destructive" : "secondary"}
                            className="text-[9px] px-1.5 py-0"
                          >
                            {exc.severity}
                          </Badge>
                          <span className="font-semibold text-foreground">{exc.type.replace(/_/g, " ")}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <Badge
                          variant={exc.status === "RESOLVED" ? "default" : "outline"}
                          className={`text-[10px] ${
                            exc.status === "RESOLVED"
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                              : "text-amber-400 border-amber-500/40"
                          }`}
                        >
                          {exc.status}
                        </Badge>
                      </td>

                      {/* Item */}
                      <td className="px-4 py-3.5">
                        {exc.productItem ? (
                          <div>
                            <div className="font-semibold text-foreground">{exc.productItem.name}</div>
                            <div className="text-[10px] text-platinum-muted font-mono">
                              Code: {exc.productItem.productCode} · EPC: {exc.tagEpc}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="font-mono text-gold">{exc.tagEpc}</div>
                            <div className="text-[10px] text-platinum-muted italic">Unassigned EPC</div>
                          </div>
                        )}
                      </td>

                      {/* Expected vs Detected */}
                      <td className="px-4 py-3.5">
                        <div className="text-[11px] space-y-0.5">
                          <div>
                            <span className="text-platinum-muted">Exp: </span>
                            <span className="text-platinum">{exc.expectedZone?.name || "Showroom Floor"}</span>
                          </div>
                          <div>
                            <span className="text-platinum-muted">Det: </span>
                            <span className="text-emerald-400 font-semibold">
                              {exc.detectedZone?.name || "Scanned Zone / Unknown"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3.5 text-platinum-muted">
                        <div>{new Date(exc.createdAt).toLocaleDateString("en-IN")}</div>
                        <div className="text-[10px] text-platinum-faint">
                          {new Date(exc.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setHistoryEpc(exc.tagEpc)}
                            className="text-xs text-platinum-muted hover:text-gold h-7 px-2"
                            title="View Timeline"
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </Button>

                          {isOpen ? (
                            <Button
                              size="sm"
                              onClick={() => handleOpenResolve(exc)}
                              className="bg-gold/15 text-gold hover:bg-gold/25 border border-gold/30 text-xs h-7 px-2.5 font-semibold"
                            >
                              Resolve →
                            </Button>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30">
                              Resolved
                            </Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* --- DIALOG: RESOLVE EXCEPTION --- */}
      <Dialog open={resolveModalOpen} onOpenChange={setResolveModalOpen}>
        <DialogContent className="max-w-md bg-onyx border-onyx-border text-platinum">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-gold" /> Resolve Variance Exception
            </DialogTitle>
            <DialogDescription className="text-xs text-platinum-muted">
              Record the verified outcome of the physical investigation for exception{" "}
              <span className="font-mono text-gold">{selectedException?.exceptionNo}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="p-3 bg-onyx rounded-xl border border-onyx-border space-y-1">
              <div className="font-semibold text-foreground">
                {selectedException?.productItem?.name || `Tag: ${selectedException?.tagEpc}`}
              </div>
              <div className="text-[11px] text-platinum-muted">{selectedException?.details}</div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-platinum-muted block mb-1">
                Investigation Resolution Code *
              </label>
              <select
                value={resolutionType}
                onChange={(e) => setResolutionType(e.target.value)}
                className="w-full bg-onyx-surface px-3 py-2 rounded-lg border border-onyx-border text-xs text-platinum focus:outline-none focus:border-gold"
              >
                <option value="ITEM_FOUND">ITEM FOUND — Physical item verified in store</option>
                <option value="LOCATION_UPDATED">LOCATION UPDATED — Update ERP zone to detected zone</option>
                <option value="TRANSFER_IN_PROGRESS">TRANSFER IN PROGRESS — Item in transit between branches</option>
                <option value="SALE_PENDING">SALE PENDING — Item placed in customer booking tray</option>
                <option value="RFID_TAG_REPLACED">RFID TAG REPLACED — Physical tag was detached or damaged</option>
                <option value="FALSE_POSITIVE">FALSE POSITIVE — Stray RF read from adjacent zone</option>
                <option value="MANUAL_CORRECTION">MANUAL CORRECTION — Authorized inventory adjustment</option>
                <option value="OTHER">OTHER — See detailed notes</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-platinum-muted block mb-1">
                Investigation & Resolution Notes *
              </label>
              <textarea
                rows={3}
                placeholder="Detail the steps taken, employee statements, and findings..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full bg-onyx-surface px-3 py-2 rounded-lg border border-onyx-border text-xs text-platinum focus:outline-none focus:border-gold resize-none"
              />
            </div>

            {selectedException?.severity === "CRITICAL" && (
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 text-[11px] flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
                <span>Critical alert resolution will be permanently stamped with your manager credentials.</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setResolveModalOpen(false)}
              className="border-onyx-border text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!resolutionNotes || resolveMutation.isPending}
              onClick={() =>
                resolveMutation.mutate({
                  id: selectedException.id,
                  payload: {
                    resolutionType,
                    resolutionNotes,
                  },
                })
              }
              className="bg-gold hover:bg-gold-dark text-black font-semibold text-xs"
            >
              {resolveMutation.isPending ? "Resolving..." : "Confirm Resolution"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <RFIDHistoryDialog
        epc={historyEpc}
        open={!!historyEpc}
        onOpenChange={(open) => !open && setHistoryEpc(null)}
      />
    </div>
  );
}
