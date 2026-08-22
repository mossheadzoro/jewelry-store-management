// client/components/RFID/RFIDReadersClient.tsx
"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Cpu,
  Radio,
  Plus,
  RefreshCw,
  Zap,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Power,
  Signal,
  MapPin,
  Edit2,
  Trash2,
  Server,
  Wifi,
  WifiOff,
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

export default function RFIDReadersClient() {
  const queryClient = useQueryClient();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedReader, setSelectedReader] = useState<any | null>(null);

  // Form states
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formManufacturer, setFormManufacturer] = useState("Generic");
  const [formModel, setFormModel] = useState("Fixed-4Port");
  const [formIpAddress, setFormIpAddress] = useState("192.168.1.120");
  const [formPort, setFormPort] = useState("5084");
  const [formConnectionType, setFormConnectionType] = useState("NETWORK_TCP");
  const [formPowerDbm, setFormPowerDbm] = useState("30.0");
  const [formZoneId, setFormZoneId] = useState("");
  const [formIsMock, setFormIsMock] = useState(true);
  const [formNumAntennas, setFormNumAntennas] = useState("4");

  // Fetch Readers
  const { data: readers = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["rfidReadersList"],
    queryFn: async () => {
      const res = await axios.get("/api/rfid/readers");
      return res.data?.data || [];
    },
    refetchInterval: 12000,
  });

  // Fetch Zones
  const { data: zones = [] } = useQuery({
    queryKey: ["rfidZonesList"],
    queryFn: async () => {
      const res = await axios.get("/api/rfid/zones");
      return res.data?.data || [];
    },
  });

  // Ping Mutation
  const pingMutation = useMutation({
    mutationFn: async (readerId: string) => {
      const res = await axios.post(`/api/rfid/readers/${readerId}/ping`);
      return res.data;
    },
    onSuccess: (data, readerId) => {
      toast.success(`Ping successful! Latency: ${data.data?.latencyMs || 10}ms (${data.data?.status})`);
      refetch();
    },
    onError: () => {
      toast.error("Reader is unreachable or offline.");
    },
  });

  // Mock Trigger Mutation
  const mockTriggerMutation = useMutation({
    mutationFn: async (readerId: string) => {
      const res = await axios.post(`/api/rfid/readers/${readerId}/mock-trigger`, { count: 5 });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Simulated reads processed!");
      refetch();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to trigger simulator");
    },
  });

  // Create Reader Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await axios.post("/api/rfid/readers", payload);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Reader created successfully!");
      queryClient.invalidateQueries({ queryKey: ["rfidReadersList"] });
      setCreateModalOpen(false);
      resetForms();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to create reader");
    },
  });

  // Update Reader Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      const res = await axios.patch(`/api/rfid/readers/${id}`, payload);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success("Reader updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["rfidReadersList"] });
      setEditModalOpen(false);
      resetForms();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to update reader");
    },
  });

  // Delete Reader Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await axios.delete(`/api/rfid/readers/${id}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Reader deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["rfidReadersList"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to delete reader");
    },
  });

  const resetForms = () => {
    setFormCode("");
    setFormName("");
    setFormManufacturer("Generic");
    setFormModel("Fixed-4Port");
    setFormIpAddress("192.168.1.120");
    setFormPort("5084");
    setFormConnectionType("NETWORK_TCP");
    setFormPowerDbm("30.0");
    setFormZoneId("");
    setFormIsMock(true);
    setFormNumAntennas("4");
    setSelectedReader(null);
  };

  const handleOpenEdit = (reader: any) => {
    setSelectedReader(reader);
    setFormCode(reader.readerCode);
    setFormName(reader.name);
    setFormManufacturer(reader.manufacturer);
    setFormModel(reader.model || "");
    setFormIpAddress(reader.ipAddress || "");
    setFormPort(reader.port ? reader.port.toString() : "5084");
    setFormConnectionType(reader.connectionType);
    setFormPowerDbm(reader.powerDbm ? reader.powerDbm.toString() : "30.0");
    setFormZoneId(reader.zoneId || "");
    setFormIsMock(reader.isMock);
    setEditModalOpen(true);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-onyx-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gold/15 text-gold border border-gold/30">
              <Cpu className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">RFID Hardware Readers & Antennas</h1>
            <Badge variant="outline" className="text-xs text-gold border-gold/40">
              {readers.length} Readers Registered
            </Badge>
          </div>
          <p className="text-xs text-platinum-muted">
            Hardware-vendor agnostic reader abstraction layer supporting TCP/IP, REST, WebSockets, and Built-in Mock Simulators.
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
              setCreateModalOpen(true);
            }}
            className="bg-gold hover:bg-gold-dark text-black font-semibold text-xs gap-1.5 shadow-md"
          >
            <Plus className="w-3.5 h-3.5" /> Register Reader
          </Button>
        </div>
      </div>

      {/* Readers Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-platinum-muted animate-pulse">
          Loading RFID hardware network...
        </div>
      ) : readers.length === 0 ? (
        <Card className="bg-onyx-surface/60 border-onyx-border p-12 text-center">
          <Cpu className="w-12 h-12 text-gold/40 mx-auto mb-3" />
          <h3 className="text-base font-bold text-foreground mb-1">No RFID Readers Configured</h3>
          <p className="text-xs text-platinum-muted max-w-md mx-auto mb-4">
            Register your physical fixed reader, counter pad, or activate a mock hardware simulator for testing.
          </p>
          <Button
            onClick={() => {
              resetForms();
              setCreateModalOpen(true);
            }}
            className="bg-gold text-black font-semibold text-xs gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add First Reader
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {readers.map((reader: any) => {
            const isOnline = reader.status === "ONLINE" || reader.status === "SCANNING";
            return (
              <Card
                key={reader.id}
                className="bg-onyx-surface border-onyx-border shadow-sm flex flex-col justify-between hover:border-gold/30 transition-all"
              >
                <div>
                  {/* Card Header */}
                  <CardHeader className="pb-3 border-b border-onyx-border/60">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              isOnline ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
                            }`}
                          />
                          <CardTitle className="text-sm font-bold text-foreground">{reader.name}</CardTitle>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-gold">
                          <span>{reader.readerCode}</span>
                          <span>·</span>
                          <span className="text-platinum-muted">{reader.manufacturer}</span>
                        </div>
                      </div>

                      <Badge
                        variant={isOnline ? "default" : "outline"}
                        className={`text-[10px] ${
                          reader.status === "SCANNING"
                            ? "bg-amber-500 text-black animate-pulse"
                            : isOnline
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                            : "text-rose-400 border-rose-500/40"
                        }`}
                      >
                        {reader.status}
                      </Badge>
                    </div>
                  </CardHeader>

                  {/* Card Body */}
                  <CardContent className="pt-4 space-y-3 text-xs">
                    {/* Location & Connection */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-platinum-muted">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-gold" /> Physical Zone:
                        </span>
                        <span className="font-medium text-platinum">
                          {reader.zone?.name || "Showroom Area"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-platinum-muted">
                        <span className="flex items-center gap-1.5">
                          <Server className="w-3.5 h-3.5 text-gold" /> Connection:
                        </span>
                        <span className="font-mono text-platinum">
                          {reader.isMock ? "Mock Simulator" : `${reader.ipAddress || "LAN"}:${reader.port}`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-platinum-muted">
                        <span className="flex items-center gap-1.5">
                          <Signal className="w-3.5 h-3.5 text-gold" /> RF Power:
                        </span>
                        <span className="font-semibold text-platinum">{reader.powerDbm} dBm</span>
                      </div>
                    </div>

                    {/* Antennas status */}
                    <div className="pt-2 border-t border-onyx-border/60">
                      <div className="text-[11px] font-semibold text-platinum-muted mb-1.5 flex items-center justify-between">
                        <span>Antenna Ports ({reader.antennas?.length || 0})</span>
                        <span className="text-[10px] text-platinum-faint">Auto-Switched</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5 text-center">
                        {(reader.antennas || []).map((ant: any) => (
                          <div
                            key={ant.id}
                            className={`p-1 rounded text-[10px] font-mono border ${
                              ant.isEnabled
                                ? "bg-onyx border-gold/30 text-gold"
                                : "bg-onyx/40 border-onyx-border text-platinum-faint"
                            }`}
                          >
                            ANT {ant.antennaNo}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Heartbeat time */}
                    <div className="text-[10px] text-platinum-muted flex items-center justify-between pt-1">
                      <span>Last Heartbeat:</span>
                      <span>
                        {reader.lastHeartbeat
                          ? new Date(reader.lastHeartbeat).toLocaleTimeString()
                          : "Never"}
                      </span>
                    </div>
                  </CardContent>
                </div>

                {/* Card Footer Actions */}
                <div className="p-3 bg-onyx/50 border-t border-onyx-border flex items-center justify-between gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => pingMutation.mutate(reader.id)}
                    disabled={pingMutation.isPending}
                    className="border-onyx-border text-[11px] h-7 px-2 flex-1"
                  >
                    <Activity className="w-3 h-3 mr-1 text-gold" /> Ping
                  </Button>

                  {reader.isMock && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => mockTriggerMutation.mutate(reader.id)}
                      disabled={mockTriggerMutation.isPending}
                      className="border-onyx-border text-[11px] h-7 px-2 flex-1 hover:text-gold"
                      title="Simulate tag burst"
                    >
                      <Zap className="w-3 h-3 mr-1 text-amber-400" /> Burst
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEdit(reader)}
                    className="text-platinum-muted hover:text-gold h-7 w-7 p-0"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Delete reader "${reader.name}"?`)) {
                        deleteMutation.mutate(reader.id);
                      }
                    }}
                    className="text-platinum-muted hover:text-rose-400 h-7 w-7 p-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* --- DIALOG: REGISTER NEW READER --- */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-md bg-onyx border-onyx-border text-platinum">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Cpu className="w-4 h-4 text-gold" /> Register RFID Reader
            </DialogTitle>
            <DialogDescription className="text-xs text-platinum-muted">
              Connect a physical RFID fixed reader, countertop scanner, or activate a simulator.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-semibold text-platinum-muted block mb-1">
                  Reader Code *
                </label>
                <input
                  type="text"
                  placeholder="e.g. READER-01"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  className="w-full bg-onyx-surface px-3 py-1.5 rounded-lg border border-onyx-border text-xs text-platinum font-mono focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-platinum-muted block mb-1">
                  Manufacturer
                </label>
                <select
                  value={formManufacturer}
                  onChange={(e) => setFormManufacturer(e.target.value)}
                  className="w-full bg-onyx-surface px-3 py-1.5 rounded-lg border border-onyx-border text-xs text-platinum focus:outline-none focus:border-gold"
                >
                  <option value="Generic">Generic (LLRP/TCP)</option>
                  <option value="Impinj">Impinj Speedway</option>
                  <option value="Zebra">Zebra FX-Series</option>
                  <option value="Chainway">Chainway Handheld</option>
                  <option value="Alien">Alien Technology</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-platinum-muted block mb-1">
                Reader Friendly Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Counter 04 RFID Tray / Vault Portal"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full bg-onyx-surface px-3 py-1.5 rounded-lg border border-onyx-border text-xs text-platinum focus:outline-none focus:border-gold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-semibold text-platinum-muted block mb-1">
                  Connection Protocol
                </label>
                <select
                  value={formConnectionType}
                  onChange={(e) => setFormConnectionType(e.target.value)}
                  className="w-full bg-onyx-surface px-3 py-1.5 rounded-lg border border-onyx-border text-xs text-platinum focus:outline-none focus:border-gold"
                >
                  <option value="NETWORK_TCP">Network Socket (TCP)</option>
                  <option value="HTTP_REST">HTTP / REST Gateway</option>
                  <option value="WEBSOCKET">WebSocket Stream</option>
                  <option value="MOCK_SIMULATOR">Mock Hardware Simulator</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-platinum-muted block mb-1">
                  RF Power (dBm)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="10"
                  max="33"
                  value={formPowerDbm}
                  onChange={(e) => setFormPowerDbm(e.target.value)}
                  className="w-full bg-onyx-surface px-3 py-1.5 rounded-lg border border-onyx-border text-xs text-platinum focus:outline-none focus:border-gold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-semibold text-platinum-muted block mb-1">
                  Physical Zone Assignment
                </label>
                <select
                  value={formZoneId}
                  onChange={(e) => setFormZoneId(e.target.value)}
                  className="w-full bg-onyx-surface px-3 py-1.5 rounded-lg border border-onyx-border text-xs text-platinum focus:outline-none focus:border-gold"
                >
                  <option value="">Default Floor</option>
                  {zones.map((z: any) => (
                    <option key={z.id} value={z.id}>
                      {z.name} ({z.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-platinum-muted block mb-1">
                  Antenna Count
                </label>
                <select
                  value={formNumAntennas}
                  onChange={(e) => setFormNumAntennas(e.target.value)}
                  className="w-full bg-onyx-surface px-3 py-1.5 rounded-lg border border-onyx-border text-xs text-platinum focus:outline-none focus:border-gold"
                >
                  <option value="1">1 Antenna</option>
                  <option value="2">2 Antennas</option>
                  <option value="4">4 Antennas</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isMockCheck"
                checked={formIsMock}
                onChange={(e) => setFormIsMock(e.target.checked)}
                className="rounded border-onyx-border text-gold focus:ring-gold"
              />
              <label htmlFor="isMockCheck" className="text-xs text-platinum cursor-pointer">
                Enable Built-in Software Simulator (Generates live RF tag reads for dev)
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
                  readerCode: formCode,
                  name: formName,
                  manufacturer: formManufacturer,
                  model: formModel,
                  ipAddress: formIpAddress,
                  port: formPort,
                  connectionType: formConnectionType,
                  powerDbm: formPowerDbm,
                  zoneId: formZoneId || undefined,
                  isMock: formIsMock,
                  numAntennas: formNumAntennas,
                })
              }
              className="bg-gold hover:bg-gold-dark text-black font-semibold text-xs"
            >
              {createMutation.isPending ? "Registering..." : "Register Reader"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- DIALOG: EDIT READER --- */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md bg-onyx border-onyx-border text-platinum">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-gold" /> Edit RFID Reader Settings
            </DialogTitle>
            <DialogDescription className="text-xs text-platinum-muted">
              Configure power output, assigned zone, and network parameters.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div>
              <label className="text-[11px] font-semibold text-platinum-muted block mb-1">
                Reader Friendly Name
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full bg-onyx-surface px-3 py-1.5 rounded-lg border border-onyx-border text-xs text-platinum focus:outline-none focus:border-gold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-semibold text-platinum-muted block mb-1">
                  RF Power (dBm)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="10"
                  max="33"
                  value={formPowerDbm}
                  onChange={(e) => setFormPowerDbm(e.target.value)}
                  className="w-full bg-onyx-surface px-3 py-1.5 rounded-lg border border-onyx-border text-xs text-platinum focus:outline-none focus:border-gold"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-platinum-muted block mb-1">
                  Zone Assignment
                </label>
                <select
                  value={formZoneId}
                  onChange={(e) => setFormZoneId(e.target.value)}
                  className="w-full bg-onyx-surface px-3 py-1.5 rounded-lg border border-onyx-border text-xs text-platinum focus:outline-none focus:border-gold"
                >
                  <option value="">None / Floating</option>
                  {zones.map((z: any) => (
                    <option key={z.id} value={z.id}>
                      {z.name} ({z.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditModalOpen(false)}
              className="border-onyx-border text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={updateMutation.isPending}
              onClick={() =>
                updateMutation.mutate({
                  id: selectedReader.id,
                  payload: {
                    name: formName,
                    powerDbm: formPowerDbm,
                    zoneId: formZoneId || null,
                  },
                })
              }
              className="bg-gold hover:bg-gold-dark text-black font-semibold text-xs"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
