// client/components/RFID/RFIDTagsClient.tsx
"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Tags,
  Search,
  Filter,
  Plus,
  Radio,
  Clock,
  RefreshCw,
  MoreVertical,
  ShieldCheck,
  MapPin,
  AlertTriangle,
  Layers,
  Sparkles,
  Edit2,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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

export default function RFIDTagsClient() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [zoneFilter, setZoneFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  // Dialogs state
  const [historyEpc, setHistoryEpc] = useState<string | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [reassignModalOpen, setReassignModalOpen] = useState(false);
  const [replaceModalOpen, setReplaceModalOpen] = useState(false);
  const [retireModalOpen, setRetireModalOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<any | null>(null);

  // Form inputs
  const [formEpc, setFormEpc] = useState("");
  const [formProductItemId, setFormProductItemId] = useState("");
  const [formZoneId, setFormZoneId] = useState("");
  const [formReason, setFormReason] = useState("");
  const [formNewEpc, setFormNewEpc] = useState("");

  // 1. Fetch tags
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["rfidTags", search, statusFilter, zoneFilter, page],
    queryFn: async () => {
      const res = await axios.get("/api/rfid/tags", {
        params: {
          search: search || undefined,
          status: statusFilter !== "ALL" ? statusFilter : undefined,
          zoneId: zoneFilter !== "ALL" ? zoneFilter : undefined,
          page,
          limit: 30,
        },
      });
      return res.data;
    },
  });

  // 2. Fetch zones for filter/assign
  const { data: zonesData } = useQuery({
    queryKey: ["rfidZonesList"],
    queryFn: async () => {
      const res = await axios.get("/api/rfid/zones");
      return res.data?.data || [];
    },
  });

  // 3. Product search for assignment
  const [productQuery, setProductQuery] = useState("");
  const { data: productsData, isLoading: searchingProducts } = useQuery({
    queryKey: ["productsSearchForRfid", productQuery],
    queryFn: async () => {
      if (!productQuery.trim()) return [];
      const res = await axios.get("/api/products/search", { params: { search: productQuery } });
      return res.data?.products || [];
    },
    enabled: productQuery.trim().length > 1,
  });

  // Mutations
  const assignMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await axios.post("/api/rfid/tags/assign", payload);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Tag assigned successfully!");
      queryClient.invalidateQueries({ queryKey: ["rfidTags"] });
      setAssignModalOpen(false);
      resetForms();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to assign tag");
    },
  });

  const reassignMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await axios.post("/api/rfid/tags/reassign", payload);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Tag reassigned successfully!");
      queryClient.invalidateQueries({ queryKey: ["rfidTags"] });
      setReassignModalOpen(false);
      resetForms();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to reassign tag");
    },
  });

  const replaceMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await axios.post("/api/rfid/tags/replace", payload);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Tag replaced successfully!");
      queryClient.invalidateQueries({ queryKey: ["rfidTags"] });
      setReplaceModalOpen(false);
      resetForms();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to replace tag");
    },
  });

  const retireMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await axios.post("/api/rfid/tags/retire", payload);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Tag retired successfully!");
      queryClient.invalidateQueries({ queryKey: ["rfidTags"] });
      setRetireModalOpen(false);
      resetForms();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to retire tag");
    },
  });

  const resetForms = () => {
    setFormEpc("");
    setFormProductItemId("");
    setFormZoneId("");
    setFormReason("");
    setFormNewEpc("");
    setSelectedTag(null);
    setProductQuery("");
  };

  const tagsList = data?.data || [];
  const pagination = data?.pagination || { page: 1, total: 0, totalPages: 1 };
  const zones = zonesData || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-onyx-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gold/15 text-gold border border-gold/30">
              <Tags className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">RFID Tag Management</h1>
            <Badge variant="outline" className="text-xs text-gold border-gold/40">
              {pagination.total} Registered Tags
            </Badge>
          </div>
          <p className="text-xs text-platinum-muted">
            Manage electronic product codes (EPCs), physical jewellery attachments, and tag lifecycles.
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
            onClick={() => {
              resetForms();
              setAssignModalOpen(true);
            }}
            className="bg-gold hover:bg-gold-dark text-black font-semibold text-xs gap-1.5 shadow-md"
          >
            <Plus className="w-3.5 h-3.5" /> Assign New Tag
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-onyx-surface/80 p-3.5 rounded-xl border border-onyx-border">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-platinum-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by EPC, SKU, Barcode, HUID, or Product Name..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-1.5 bg-onyx border border-onyx-border rounded-lg text-xs text-platinum placeholder:text-platinum-faint focus:outline-none focus:border-gold"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
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
            <option value="ACTIVE">ACTIVE</option>
            <option value="UNASSIGNED">UNASSIGNED</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="REPLACED">REPLACED</option>
            <option value="RETIRED">RETIRED</option>
          </select>

          {/* Zone Filter */}
          <select
            value={zoneFilter}
            onChange={(e) => {
              setZoneFilter(e.target.value);
              setPage(1);
            }}
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
      </div>

      {/* Tags Table */}
      <Card className="bg-onyx-surface/90 border-onyx-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-onyx/70 text-platinum-muted uppercase text-[10px] tracking-wider border-b border-onyx-border">
              <tr>
                <th className="px-4 py-3">EPC / TID</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Product Item</th>
                <th className="px-4 py-3">Current Zone</th>
                <th className="px-4 py-3">Last Signal</th>
                <th className="px-4 py-3">Last Seen</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-onyx-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-platinum-muted animate-pulse">
                    Loading RFID tag directory...
                  </td>
                </tr>
              ) : tagsList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-platinum-muted">
                    No RFID tags matching the selected filters.
                  </td>
                </tr>
              ) : (
                tagsList.map((tag: any) => {
                  const item = tag.productItem;
                  return (
                    <tr key={tag.id} className="hover:bg-onyx/50 transition-colors">
                      {/* EPC */}
                      <td className="px-4 py-3.5">
                        <div className="font-mono font-semibold text-gold">{tag.epc}</div>
                        {tag.tid && <div className="font-mono text-[10px] text-platinum-faint">TID: {tag.tid}</div>}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <Badge
                          variant={
                            tag.status === "ACTIVE"
                              ? "default"
                              : tag.status === "SUSPENDED"
                              ? "secondary"
                              : tag.status === "RETIRED"
                              ? "destructive"
                              : "outline"
                          }
                          className="text-[10px]"
                        >
                          {tag.status}
                        </Badge>
                      </td>

                      {/* Product Item */}
                      <td className="px-4 py-3.5">
                        {item ? (
                          <div className="space-y-0.5">
                            <div className="font-semibold text-foreground flex items-center gap-1.5">
                              {item.name}
                              <span className="text-[10px] font-mono text-platinum-muted">({item.productCode})</span>
                            </div>
                            <div className="text-[11px] text-platinum-muted">
                              {item.subCategory?.category?.name} · {item.gsWeight}g · {item.purity}K
                              {item.huidNumber && ` · HUID: ${item.huidNumber}`}
                            </div>
                          </div>
                        ) : (
                          <span className="text-platinum-muted italic">Unassigned</span>
                        )}
                      </td>

                      {/* Zone */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-platinum">
                          <MapPin className="w-3.5 h-3.5 text-gold shrink-0" />
                          <span>{tag.currentZone?.name || "Showroom Floor"}</span>
                        </div>
                      </td>

                      {/* Signal */}
                      <td className="px-4 py-3.5">
                        {tag.lastRssi ? (
                          <div className="font-mono text-platinum">
                            {tag.lastRssi} dBm
                            <span className="block text-[10px] text-platinum-muted">
                              Reader: {tag.lastReader?.name || "Counter 01"}
                            </span>
                          </div>
                        ) : (
                          <span className="text-platinum-faint">—</span>
                        )}
                      </td>

                      {/* Last Seen */}
                      <td className="px-4 py-3.5 text-platinum-muted">
                        {tag.lastSeenAt ? (
                          <>
                            <div>{new Date(tag.lastSeenAt).toLocaleDateString("en-IN")}</div>
                            <div className="text-[10px] text-platinum-faint">
                              {new Date(tag.lastSeenAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </>
                        ) : (
                          <span>Never</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setHistoryEpc(tag.epc)}
                            className="text-xs text-platinum-muted hover:text-gold h-7 px-2"
                            title="View Observation History"
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-platinum-muted">
                                <MoreVertical className="w-3.5 h-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-onyx border-onyx-border text-xs">
                              <DropdownMenuItem onClick={() => setHistoryEpc(tag.epc)}>
                                <Clock className="w-3.5 h-3.5 mr-2 text-gold" /> View Sighting Timeline
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedTag(tag);
                                  setFormEpc(tag.epc);
                                  setReassignModalOpen(true);
                                }}
                              >
                                <Edit2 className="w-3.5 h-3.5 mr-2 text-blue-400" /> Reassign Item
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedTag(tag);
                                  setFormEpc(tag.epc);
                                  setReplaceModalOpen(true);
                                }}
                              >
                                <RefreshCw className="w-3.5 h-3.5 mr-2 text-emerald-400" /> Replace Tag
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedTag(tag);
                                  setFormEpc(tag.epc);
                                  setRetireModalOpen(true);
                                }}
                                className="text-rose-400"
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-2" /> Retire RFID Tag
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t border-onyx-border flex items-center justify-between text-xs text-platinum-muted">
            <div>
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="border-onyx-border text-xs h-7"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="border-onyx-border text-xs h-7"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* --- DIALOG: ASSIGN NEW TAG --- */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="max-w-md bg-onyx border-onyx-border text-platinum">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Tags className="w-4 h-4 text-gold" /> Assign RFID Tag to Jewellery
            </DialogTitle>
            <DialogDescription className="text-xs text-platinum-muted">
              Link an RFID electronic product code (EPC) to a physical jewellery item in stock.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div>
              <label className="text-[11px] font-semibold text-platinum-muted block mb-1">
                RFID EPC Code *
              </label>
              <input
                type="text"
                placeholder="e.g. E28068940000501234567890"
                value={formEpc}
                onChange={(e) => setFormEpc(e.target.value)}
                className="w-full bg-onyx-surface px-3 py-1.5 rounded-lg border border-onyx-border text-xs text-platinum font-mono focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-platinum-muted block mb-1">
                Select Product Item *
              </label>
              <input
                type="text"
                placeholder="Type name, barcode, or product code..."
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                className="w-full bg-onyx-surface px-3 py-1.5 rounded-lg border border-onyx-border text-xs text-platinum focus:outline-none focus:border-gold mb-1.5"
              />

              {/* Product search results list */}
              {searchingProducts ? (
                <div className="text-[11px] text-platinum-muted p-2">Searching stock...</div>
              ) : (
                productsData && productsData.length > 0 && (
                  <div className="max-h-36 overflow-y-auto space-y-1 p-1 bg-onyx rounded-lg border border-onyx-border">
                    {productsData.map((p: any) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setFormProductItemId(p.id.toString());
                          setProductQuery(`${p.name} (${p.productCode})`);
                        }}
                        className={`p-2 rounded text-xs cursor-pointer transition-colors ${
                          formProductItemId === p.id.toString()
                            ? "bg-gold/20 text-gold border border-gold/40"
                            : "hover:bg-onyx-surface text-platinum"
                        }`}
                      >
                        <div className="font-semibold">{p.name}</div>
                        <div className="text-[10px] text-platinum-muted">
                          Code: {p.productCode} · Gross: {p.gsWeight}g · Purity: {p.purity}K
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>

            <div>
              <label className="text-[11px] font-semibold text-platinum-muted block mb-1">
                Assigned Floor Zone
              </label>
              <select
                value={formZoneId}
                onChange={(e) => setFormZoneId(e.target.value)}
                className="w-full bg-onyx-surface px-3 py-1.5 rounded-lg border border-onyx-border text-xs text-platinum focus:outline-none focus:border-gold"
              >
                <option value="">Default Showroom Floor</option>
                {zones.map((z: any) => (
                  <option key={z.id} value={z.id}>
                    {z.name} ({z.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAssignModalOpen(false)}
              className="border-onyx-border text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!formEpc || !formProductItemId || assignMutation.isPending}
              onClick={() =>
                assignMutation.mutate({
                  epc: formEpc,
                  productItemId: formProductItemId,
                  zoneId: formZoneId || undefined,
                })
              }
              className="bg-gold hover:bg-gold-dark text-black font-semibold text-xs gap-1.5"
            >
              {assignMutation.isPending ? "Assigning..." : "Confirm Tag Assignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- DIALOG: REASSIGN TAG --- */}
      <Dialog open={reassignModalOpen} onOpenChange={setReassignModalOpen}>
        <DialogContent className="max-w-md bg-onyx border-onyx-border text-platinum">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-400" /> Authorized Tag Reassignment
            </DialogTitle>
            <DialogDescription className="text-xs text-platinum-muted">
              Transfer active EPC <span className="font-mono text-gold">{formEpc}</span> to a different product item.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div>
              <label className="text-[11px] font-semibold text-platinum-muted block mb-1">
                Select New Target Product Item *
              </label>
              <input
                type="text"
                placeholder="Search target jewellery item..."
                value={productQuery}
                onChange={(e) => setProductQuery(e.target.value)}
                className="w-full bg-onyx-surface px-3 py-1.5 rounded-lg border border-onyx-border text-xs text-platinum focus:outline-none focus:border-gold mb-1.5"
              />
              {productsData && productsData.length > 0 && (
                <div className="max-h-36 overflow-y-auto space-y-1 p-1 bg-onyx rounded-lg border border-onyx-border">
                  {productsData.map((p: any) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setFormProductItemId(p.id.toString());
                        setProductQuery(`${p.name} (${p.productCode})`);
                      }}
                      className={`p-2 rounded text-xs cursor-pointer transition-colors ${
                        formProductItemId === p.id.toString()
                          ? "bg-gold/20 text-gold border border-gold/40"
                          : "hover:bg-onyx-surface text-platinum"
                      }`}
                    >
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-[10px] text-platinum-muted">
                        Code: {p.productCode} · Gross: {p.gsWeight}g
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-[11px] font-semibold text-platinum-muted block mb-1">
                Reassignment Reason *
              </label>
              <textarea
                rows={2}
                placeholder="Explain why this tag is being moved..."
                value={formReason}
                onChange={(e) => setFormReason(e.target.value)}
                className="w-full bg-onyx-surface px-3 py-1.5 rounded-lg border border-onyx-border text-xs text-platinum focus:outline-none focus:border-gold resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReassignModalOpen(false)}
              className="border-onyx-border text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!formProductItemId || !formReason || reassignMutation.isPending}
              onClick={() =>
                reassignMutation.mutate({
                  epc: formEpc,
                  newProductItemId: formProductItemId,
                  reason: formReason,
                })
              }
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs"
            >
              {reassignMutation.isPending ? "Reassigning..." : "Authorize Reassignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- DIALOG: REPLACE DAMAGED TAG --- */}
      <Dialog open={replaceModalOpen} onOpenChange={setReplaceModalOpen}>
        <DialogContent className="max-w-md bg-onyx border-onyx-border text-platinum">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-emerald-400" /> Replace Damaged Tag
            </DialogTitle>
            <DialogDescription className="text-xs text-platinum-muted">
              Retire damaged tag <span className="font-mono text-gold">{formEpc}</span> and link a fresh RFID tag to the same jewellery piece.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div>
              <label className="text-[11px] font-semibold text-platinum-muted block mb-1">
                New Replacement EPC *
              </label>
              <input
                type="text"
                placeholder="Scan or enter new EPC code..."
                value={formNewEpc}
                onChange={(e) => setFormNewEpc(e.target.value)}
                className="w-full bg-onyx-surface px-3 py-1.5 rounded-lg border border-onyx-border text-xs text-platinum font-mono focus:outline-none focus:border-gold"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-platinum-muted block mb-1">
                Reason / Defect Description
              </label>
              <input
                type="text"
                placeholder="e.g. Physical inlay bent, chip unresponsive..."
                value={formReason}
                onChange={(e) => setFormReason(e.target.value)}
                className="w-full bg-onyx-surface px-3 py-1.5 rounded-lg border border-onyx-border text-xs text-platinum focus:outline-none focus:border-gold"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReplaceModalOpen(false)}
              className="border-onyx-border text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!formNewEpc || replaceMutation.isPending}
              onClick={() =>
                replaceMutation.mutate({
                  oldEpc: formEpc,
                  newEpc: formNewEpc,
                  productItemId: selectedTag?.productItemId,
                  reason: formReason,
                })
              }
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
            >
              {replaceMutation.isPending ? "Replacing..." : "Replace RFID Tag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- DIALOG: RETIRE TAG --- */}
      <Dialog open={retireModalOpen} onOpenChange={setRetireModalOpen}>
        <DialogContent className="max-w-md bg-onyx border-onyx-border text-platinum">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-400 flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Retire RFID Tag
            </DialogTitle>
            <DialogDescription className="text-xs text-platinum-muted">
              Permanently mark tag <span className="font-mono text-gold">{formEpc}</span> as RETIRED. Historical sightings remain preserved.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <label className="text-[11px] font-semibold text-platinum-muted block mb-1">
              Retirement Reason *
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Broken antenna, recycled tag, scrapped..."
              value={formReason}
              onChange={(e) => setFormReason(e.target.value)}
              className="w-full bg-onyx-surface px-3 py-1.5 rounded-lg border border-onyx-border text-xs text-platinum focus:outline-none focus:border-gold resize-none"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRetireModalOpen(false)}
              className="border-onyx-border text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={!formReason || retireMutation.isPending}
              onClick={() =>
                retireMutation.mutate({
                  epc: formEpc,
                  reason: formReason,
                })
              }
              className="text-xs"
            >
              {retireMutation.isPending ? "Retiring..." : "Confirm Retirement"}
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
