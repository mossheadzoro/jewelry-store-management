// client/src/app/settings/panels/BackupSettingsPanel.tsx
"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  Database,
  ShieldCheck,
  HardDrive,
  RefreshCw,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Lock,
  Download,
  Eye,
  Trash2,
  RotateCcw,
  Zap,
  Sliders,
  Check,
  Server,
  Cloud,
  FileText,
  AlertCircle,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";

export default function BackupSettingsPanel() {
  const queryClient = useQueryClient();

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  // Modals State
  const [backupNowModalOpen, setBackupNowModalOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<any | null>(null);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [restoreConfirmation, setRestoreConfirmation] = useState("");
  const [isProcessingRestore, setIsProcessingRestore] = useState(false);

  // 1. Fetch System Health & Statistics
  const { data: healthData, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
    queryKey: ["backupHealth"],
    queryFn: async () => {
      const res = await axios.get("/api/backups/health");
      return res.data?.data;
    },
    refetchInterval: 15000,
  });

  // 2. Fetch Backups History List
  const {
    data: backupsResponse,
    isLoading: backupsLoading,
    refetch: refetchBackups,
    isFetching,
  } = useQuery({
    queryKey: ["backupsList", search, typeFilter, statusFilter, page],
    queryFn: async () => {
      const res = await axios.get("/api/backups", {
        params: { search, type: typeFilter, status: statusFilter, page, limit: 15 },
      });
      return res.data;
    },
  });

  // 3. Fetch Settings
  const { data: settingsData, refetch: refetchSettings } = useQuery({
    queryKey: ["backupSettings"],
    queryFn: async () => {
      const res = await axios.get("/api/backups/settings");
      return res.data?.data;
    },
  });

  // Form State for Settings
  const [settingsForm, setSettingsForm] = useState<any>({
    enabled: true,
    frequency: "DAILY",
    scheduleTime: "01:00",
    timezone: "Asia/Kolkata",
    retentionDaily: 30,
    retentionWeekly: 12,
    retentionMonthly: 12,
  });

  React.useEffect(() => {
    if (settingsData) {
      setSettingsForm({
        enabled: settingsData.enabled ?? true,
        frequency: settingsData.frequency || "DAILY",
        scheduleTime: settingsData.scheduleTime || "01:00",
        timezone: settingsData.timezone || "Asia/Kolkata",
        retentionDaily: settingsData.retentionDaily ?? 30,
        retentionWeekly: settingsData.retentionWeekly ?? 12,
        retentionMonthly: settingsData.retentionMonthly ?? 12,
      });
    }
  }, [settingsData]);

  // Mutations
  const createBackupMutation = useMutation({
    mutationFn: async (payload: { type: string; description?: string }) => {
      const res = await axios.post("/api/backups", payload);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Database backup created and verified successfully!");
      setBackupNowModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["backupsList"] });
      queryClient.invalidateQueries({ queryKey: ["backupHealth"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to create database backup");
    },
  });

  const testStorageMutation = useMutation({
    mutationFn: async () => {
      const res = await axios.post("/api/backups/storage/test");
      return res.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Storage test passed! Latency: ${data.data.latencyMs}ms`);
      } else {
        toast.error(`Storage probe failed: ${data.error || "Unknown error"}`);
      }
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to communicate with storage");
    },
  });

  const syncCloudBackupsMutation = useMutation({
    mutationFn: async () => {
      const res = await axios.post("/api/backups/sync");
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Cloud backups synced successfully!");
      queryClient.invalidateQueries({ queryKey: ["backupsList"] });
      queryClient.invalidateQueries({ queryKey: ["backupHealth"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to sync backups from cloud storage");
    },
  });

  const verifyBackupMutation = useMutation({
    mutationFn: async (backupId: string) => {
      const res = await axios.post(`/api/backups/${backupId}/verify`);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Backup integrity verified successfully!");
      queryClient.invalidateQueries({ queryKey: ["backupsList"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Integrity verification failed");
    },
  });

  const deleteBackupMutation = useMutation({
    mutationFn: async (backupId: string) => {
      const res = await axios.delete(`/api/backups/${backupId}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Backup deleted successfully.");
      queryClient.invalidateQueries({ queryKey: ["backupsList"] });
      queryClient.invalidateQueries({ queryKey: ["backupHealth"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to delete backup");
    },
  });

  const previewRestoreMutation = useMutation({
    mutationFn: async (backupId: string) => {
      const res = await axios.post(`/api/backups/${backupId}/restore-preview`);
      return res.data;
    },
    onSuccess: (data) => {
      setPreviewData(data.data);
      setPreviewModalOpen(true);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to run restore preview validation");
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await axios.put("/api/backups/settings", payload);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Backup & retention settings saved successfully!");
      queryClient.invalidateQueries({ queryKey: ["backupSettings"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || "Failed to save settings");
    },
  });

  const handleDownload = async (backupId: string) => {
    try {
      const res = await axios.get(`/api/backups/${backupId}/download`);
      if (res.data?.downloadUrl) {
        window.open(res.data.downloadUrl, "_blank");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to get download URL");
    }
  };

  const handleExecuteProductionRestore = async () => {
    if (!selectedBackup) return;
    if (restoreConfirmation !== "CONFIRM_RESTORE") {
      toast.error("Please type CONFIRM_RESTORE to proceed.");
      return;
    }

    setIsProcessingRestore(true);
    try {
      const res = await axios.post(`/api/backups/${selectedBackup.backupId}/restore`, {
        confirmation: restoreConfirmation,
      });

      toast.success("Production database restored successfully!");
      setRestoreModalOpen(false);
      setRestoreConfirmation("");
      queryClient.invalidateQueries({ queryKey: ["backupsList"] });
      queryClient.invalidateQueries({ queryKey: ["backupHealth"] });
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Production restore failed");
    } finally {
      setIsProcessingRestore(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const backupsList = backupsResponse?.data || [];
  const pagination = backupsResponse?.pagination || { page: 1, total: 0, totalPages: 1 };
  const stats = healthData?.stats || {
    totalBackups: 0,
    verifiedBackups: 0,
    failedBackups: 0,
    totalStorageBytes: 0,
    storageProvider: "Cloudflare R2",
    storageBucket: "jewellery-backups",
  };

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-onyx-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gold/15 text-gold border border-gold/30 shadow-sm">
              <Database className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              PostgreSQL Backup & Disaster Recovery
            </h1>
            <Badge
              variant="outline"
              className={`text-xs ${
                healthData?.status === "HEALTHY"
                  ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
                  : "text-amber-400 border-amber-500/30 bg-amber-500/10"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                  healthData?.status === "HEALTHY" ? "bg-emerald-400" : "bg-amber-400"
                } animate-pulse`}
              />
              {healthData?.status || "HEALTHY"}
            </Badge>
          </div>
          <p className="text-xs text-platinum-muted">
            Database-level PostgreSQL snapshots with AES-256-GCM encryption, Cloudflare R2 object storage, and safe dry-run disaster recovery.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => syncCloudBackupsMutation.mutate()}
            disabled={syncCloudBackupsMutation.isPending}
            className="border-gold/30 hover:border-gold/50 bg-gold/5 text-gold hover:text-gold text-xs gap-1.5"
            title="Scan Cloudflare R2 bucket and recover all past backup records"
          >
            <Cloud className={`w-3.5 h-3.5 ${syncCloudBackupsMutation.isPending ? "animate-pulse text-gold" : ""}`} />
            {syncCloudBackupsMutation.isPending ? "Syncing..." : "Sync Cloud"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchHealth();
              refetchBackups();
            }}
            disabled={isFetching}
            className="border-onyx-border text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-gold" : ""}`} /> Refresh
          </Button>

          <Button
            size="sm"
            onClick={() => setBackupNowModalOpen(true)}
            className="bg-gold hover:bg-gold-dark text-black font-semibold text-xs gap-1.5 shadow-md"
          >
            <Play className="w-3.5 h-3.5" /> Backup Now
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Health & Next Schedule */}
        <Card className="bg-onyx-surface/80 border-onyx-border shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-platinum-muted">
              Backup Health
            </CardTitle>
            <ShieldCheck className="w-4 h-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">
                {stats.verifiedBackups} / {stats.totalBackups}
              </span>
              <span className="text-xs text-emerald-400 font-medium">Verified</span>
            </div>
            <div className="mt-3 text-[11px] text-platinum-muted">
              Last backup:{" "}
              {stats.lastBackupAt
                ? formatDistanceToNow(new Date(stats.lastBackupAt), { addSuffix: true })
                : "None"}
            </div>
          </CardContent>
        </Card>

        {/* 2. Storage Usage */}
        <Card className="bg-onyx-surface/80 border-onyx-border shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-platinum-muted">
              Storage Used
            </CardTitle>
            <Cloud className="w-4 h-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">
                {formatBytes(stats.totalStorageBytes)}
              </span>
              <span className="text-xs text-platinum-muted">Encrypted</span>
            </div>
            <div className="mt-3 text-[11px] text-platinum-muted truncate">
              Target: <span className="text-gold font-medium">{stats.storageProvider}</span>
            </div>
          </CardContent>
        </Card>

        {/* 3. Schedule & Automation */}
        <Card className="bg-onyx-surface/80 border-onyx-border shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-platinum-muted">
              Automated Schedule
            </CardTitle>
            <Clock className="w-4 h-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">
                {settingsForm.frequency}
              </span>
              <span className="text-xs text-platinum-muted">@{settingsForm.scheduleTime}</span>
            </div>
            <div className="mt-3 text-[11px] text-platinum-muted">
              Timezone: <span className="font-mono text-foreground">{settingsForm.timezone}</span>
            </div>
          </CardContent>
        </Card>

        {/* 4. Storage Probe Status */}
        <Card className="bg-onyx-surface/80 border-onyx-border shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-platinum-muted">
              Storage Connection
            </CardTitle>
            <Server className="w-4 h-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> S3 / R2 Active
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => testStorageMutation.mutate()}
                disabled={testStorageMutation.isPending}
                className="h-7 text-[10px] border-onyx-border px-2 gap-1"
              >
                <Zap className={`w-3 h-3 text-gold ${testStorageMutation.isPending ? "animate-spin" : ""}`} />
                {testStorageMutation.isPending ? "Testing..." : "Probe Test"}
              </Button>
            </div>
            <div className="mt-3 text-[11px] text-platinum-muted truncate">
              Bucket: <span className="font-mono">{stats.storageBucket}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table: Backup History */}
      <Card className="bg-onyx-surface border-onyx-border shadow-sm">
        <CardHeader className="pb-3 border-b border-onyx-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-foreground">Backup History & Snapshots</CardTitle>
              <CardDescription className="text-xs text-platinum-muted">
                Complete database-level PostgreSQL archive records with SHA-256 checksum verification.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Input
                placeholder="Search backup ID or migration..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="h-8 w-48 text-xs bg-onyx border-onyx-border"
              />

              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="h-8 text-xs bg-onyx border border-onyx-border rounded-md px-2 text-foreground"
              >
                <option value="ALL">All Types</option>
                <option value="DAILY">Daily</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="MANUAL">Manual</option>
                <option value="PRE_RESTORE_SAFETY">Safety Snapshots</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="h-8 text-xs bg-onyx border border-onyx-border rounded-md px-2 text-foreground"
              >
                <option value="ALL">All Statuses</option>
                <option value="VERIFIED">Verified</option>
                <option value="RUNNING">Running</option>
                <option value="FAILED">Failed</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-onyx-border bg-onyx-elevated/40 text-platinum-muted uppercase text-[10px] tracking-wider font-semibold">
                  <th className="py-3 px-4">Backup ID & Timestamp</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Size (Encrypted / Raw)</th>
                  <th className="py-3 px-4">Prisma Migration</th>
                  <th className="py-3 px-4">Tables / Rows</th>
                  <th className="py-3 px-4">Status & Integrity</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-onyx-border/40 text-platinum">
                {backupsLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-platinum-muted animate-pulse">
                      Loading backup records...
                    </td>
                  </tr>
                ) : backupsList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-14 text-platinum-muted space-y-3">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Cloud className="w-8 h-8 text-platinum-muted/50" />
                        <p className="text-sm font-medium text-platinum">No local backup records found.</p>
                        <p className="text-xs text-platinum-muted max-w-sm">
                          If you recently reset or reseeded the database, your snapshots are safely stored in Cloudflare R2.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => syncCloudBackupsMutation.mutate()}
                          disabled={syncCloudBackupsMutation.isPending}
                          className="mt-2 border-gold/30 hover:border-gold/50 bg-gold/10 text-gold hover:text-gold text-xs gap-2"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${syncCloudBackupsMutation.isPending ? "animate-spin" : ""}`} />
                          {syncCloudBackupsMutation.isPending ? "Discovering Cloud Backups..." : "Sync Backups from Cloudflare R2"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  backupsList.map((backup: any) => (
                    <tr key={backup.id} className="hover:bg-onyx-elevated/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-medium text-foreground">{backup.backupId}</div>
                        <div className="text-[11px] text-platinum-muted">
                          {format(new Date(backup.createdAt), "dd MMM yyyy, HH:mm:ss")}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            backup.type === "PRE_RESTORE_SAFETY"
                              ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
                              : backup.type === "DAILY"
                              ? "text-blue-400 border-blue-500/30 bg-blue-500/10"
                              : "text-gold border-gold/30 bg-gold/10"
                          }`}
                        >
                          {backup.type.replace(/_/g, " ")}
                        </Badge>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground">{formatBytes(backup.fileSize)}</div>
                        <div className="text-[10px] text-platinum-muted">
                          Raw: {formatBytes(backup.rawSize || 0)}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-mono text-[11px] text-foreground truncate max-w-[160px]" title={backup.latestMigration || "None"}>
                          {backup.latestMigration ? backup.latestMigration.split("_").slice(-2).join("_") : "Initial"}
                        </div>
                        <div className="text-[10px] text-platinum-muted">{backup.applicationVersion}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-medium text-foreground">{backup.tablesCount || 0}</span> tables ·{" "}
                        <span className="text-platinum-muted">{(backup.recordsCount || 0).toLocaleString()} rows</span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          {backup.status === "VERIFIED" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Verified
                            </span>
                          ) : backup.status === "FAILED" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-medium">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Failed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-gold font-medium">
                              <RefreshCw className="w-3.5 h-3.5 animate-spin text-gold" /> {backup.status}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-platinum-muted font-mono truncate max-w-[120px]" title={`SHA-256: ${backup.checksum}`}>
                          {backup.checksum ? `${backup.checksum.substring(0, 10)}...` : ""}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedBackup(backup);
                              setDetailsDrawerOpen(true);
                            }}
                            className="h-7 w-7 p-0 text-platinum-muted hover:text-gold"
                            title="View Metadata Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(backup.backupId)}
                            className="h-7 w-7 p-0 text-platinum-muted hover:text-gold"
                            title="Download Encrypted Backup"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => previewRestoreMutation.mutate(backup.backupId)}
                            disabled={previewRestoreMutation.isPending}
                            className="h-7 px-2 text-[11px] text-platinum-muted hover:text-gold border border-onyx-border gap-1"
                            title="Dry Run Validation & Schema Check"
                          >
                            <ShieldCheck className="w-3 h-3 text-gold" /> Dry Run
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedBackup(backup);
                              setRestoreConfirmation("");
                              setRestoreModalOpen(true);
                            }}
                            className="h-7 px-2 text-[11px] text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 gap-1"
                            title="Disaster Recovery / Production Restore"
                          >
                            <RotateCcw className="w-3 h-3 text-rose-400" /> Restore
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete backup ${backup.backupId}?`)) {
                                deleteBackupMutation.mutate(backup.backupId);
                              }
                            }}
                            className="h-7 w-7 p-0 text-platinum-muted hover:text-rose-400"
                            title="Delete Backup"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-onyx-border text-xs text-platinum-muted">
              <div>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total backups)
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-7 text-xs border-onyx-border"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="h-7 text-xs border-onyx-border"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Backup & Retention Configuration Section */}
      <Card className="bg-onyx-surface border-onyx-border shadow-sm">
        <CardHeader className="pb-3 border-b border-onyx-border/60">
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <Sliders className="w-4 h-4 text-gold" /> Backup Scheduler & Retention Policies
          </CardTitle>
          <CardDescription className="text-xs text-platinum-muted">
            Configure automated snapshot schedules, timezones, and automated cleanup rules.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Automatic Schedule Toggle */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Automated Scheduled Backups</label>
              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="schedEnabled"
                  checked={settingsForm.enabled}
                  onChange={(e) => setSettingsForm({ ...settingsForm, enabled: e.target.checked })}
                  className="w-4 h-4 accent-gold cursor-pointer rounded"
                />
                <label htmlFor="schedEnabled" className="text-xs text-platinum cursor-pointer">
                  Enable automated background snapshots
                </label>
              </div>
              <p className="text-[11px] text-platinum-muted">
                Executes via scheduled worker/cron without blocking user requests.
              </p>
            </div>

            {/* Frequency & Time */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Schedule Time & Frequency</label>
              <div className="flex items-center gap-2">
                <select
                  value={settingsForm.frequency}
                  onChange={(e) => setSettingsForm({ ...settingsForm, frequency: e.target.value })}
                  className="h-8 text-xs bg-onyx border border-onyx-border rounded-md px-2 text-foreground flex-1"
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                </select>
                <Input
                  type="time"
                  value={settingsForm.scheduleTime}
                  onChange={(e) => setSettingsForm({ ...settingsForm, scheduleTime: e.target.value })}
                  className="h-8 w-28 text-xs bg-onyx border-onyx-border"
                />
              </div>
              <p className="text-[11px] text-platinum-muted font-mono">Timezone: {settingsForm.timezone}</p>
            </div>

            {/* Timezone */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Timezone Setting</label>
              <Input
                value={settingsForm.timezone}
                onChange={(e) => setSettingsForm({ ...settingsForm, timezone: e.target.value })}
                className="h-8 text-xs bg-onyx border-onyx-border"
                placeholder="Asia/Kolkata"
              />
              <p className="text-[11px] text-platinum-muted">Standard IANA timezone identifier.</p>
            </div>
          </div>

          {/* Retention Thresholds */}
          <div className="pt-4 border-t border-onyx-border/60">
            <h4 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">
              Retention Limits & Tiering
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-platinum">Daily Retention</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    value={settingsForm.retentionDaily}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, retentionDaily: parseInt(e.target.value, 10) || 30 })
                    }
                    className="h-8 text-xs bg-onyx border-onyx-border"
                  />
                  <span className="text-xs text-platinum-muted">days</span>
                </div>
                <p className="text-[10px] text-platinum-muted">Keep all daily backups within this window.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-platinum">Weekly Retention</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={104}
                    value={settingsForm.retentionWeekly}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, retentionWeekly: parseInt(e.target.value, 10) || 12 })
                    }
                    className="h-8 text-xs bg-onyx border-onyx-border"
                  />
                  <span className="text-xs text-platinum-muted">weeks</span>
                </div>
                <p className="text-[10px] text-platinum-muted">Preserves 1 snapshot per week for this duration.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-platinum">Monthly Retention</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={60}
                    value={settingsForm.retentionMonthly}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, retentionMonthly: parseInt(e.target.value, 10) || 12 })
                    }
                    className="h-8 text-xs bg-onyx border-onyx-border"
                  />
                  <span className="text-xs text-platinum-muted">months</span>
                </div>
                <p className="text-[10px] text-platinum-muted">Preserves 1 snapshot per month for long-term archive.</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              size="sm"
              onClick={() => saveSettingsMutation.mutate(settingsForm)}
              disabled={saveSettingsMutation.isPending}
              className="bg-gold hover:bg-gold-dark text-black font-semibold text-xs gap-1.5"
            >
              <Check className="w-3.5 h-3.5" /> Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* MODAL 1: Confirm Manual Backup */}
      <Dialog open={backupNowModalOpen} onOpenChange={setBackupNowModalOpen}>
        <DialogContent className="bg-onyx-surface border-onyx-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-gold" /> Trigger Immediate Database Snapshot
            </DialogTitle>
            <DialogDescription className="text-xs text-platinum-muted">
              Extracts complete PostgreSQL catalog DDLs, all table rows, constraints, and migrations, encrypts via AES-256-GCM, and uploads to Cloudflare R2.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs text-platinum">
            <div className="p-3 rounded-lg bg-onyx border border-onyx-border space-y-1.5">
              <div className="flex justify-between">
                <span className="text-platinum-muted">Snapshot Type:</span>
                <span className="font-semibold text-gold">MANUAL FULL DATABASE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-platinum-muted">Encryption:</span>
                <span className="font-mono">AES-256-GCM (Authenticated)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-platinum-muted">Integrity Algorithm:</span>
                <span className="font-mono">SHA-256</span>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setBackupNowModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => createBackupMutation.mutate({ type: "MANUAL" })}
              disabled={createBackupMutation.isPending}
              className="bg-gold text-black font-semibold text-xs gap-1.5"
            >
              {createBackupMutation.isPending ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Generating Snapshot...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" /> Start Snapshot
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DRAWER: Backup Metadata & Event Timeline */}
      <Sheet open={detailsDrawerOpen} onOpenChange={setDetailsDrawerOpen}>
        <SheetContent className="bg-onyx-surface border-l border-onyx-border text-foreground w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 font-mono text-sm">
              <Database className="w-4 h-4 text-gold" /> {selectedBackup?.backupId}
            </SheetTitle>
            <SheetDescription className="text-xs text-platinum-muted">
              Detailed database snapshot metadata, SHA-256 hash, and execution timeline.
            </SheetDescription>
          </SheetHeader>

          {selectedBackup && (
            <div className="mt-6 space-y-6 text-xs">
              {/* Key Values Grid */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-onyx border border-onyx-border">
                <div>
                  <span className="text-platinum-muted text-[11px]">Database Provider:</span>
                  <div className="font-medium text-foreground">{selectedBackup.databaseProvider}</div>
                </div>
                <div>
                  <span className="text-platinum-muted text-[11px]">Database Name:</span>
                  <div className="font-medium text-foreground">{selectedBackup.databaseName || "jewelry_store"}</div>
                </div>
                <div>
                  <span className="text-platinum-muted text-[11px]">Created At:</span>
                  <div className="text-foreground">
                    {format(new Date(selectedBackup.createdAt), "dd MMM yyyy, HH:mm:ss")}
                  </div>
                </div>
                <div>
                  <span className="text-platinum-muted text-[11px]">Execution Time:</span>
                  <div className="text-foreground">{selectedBackup.durationMs ? `${selectedBackup.durationMs}ms` : "N/A"}</div>
                </div>
                <div>
                  <span className="text-platinum-muted text-[11px]">Compressed File Size:</span>
                  <div className="font-semibold text-gold">{formatBytes(selectedBackup.fileSize)}</div>
                </div>
                <div>
                  <span className="text-platinum-muted text-[11px]">Uncompressed Size:</span>
                  <div className="text-foreground">{formatBytes(selectedBackup.rawSize || 0)}</div>
                </div>
                <div className="col-span-2">
                  <span className="text-platinum-muted text-[11px]">SHA-256 Checksum:</span>
                  <div className="font-mono text-[10px] text-emerald-400 break-all p-1.5 rounded bg-onyx-elevated mt-0.5">
                    {selectedBackup.checksum}
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="text-platinum-muted text-[11px]">Latest Recorded Migration:</span>
                  <div className="font-mono text-[11px] text-foreground truncate">{selectedBackup.latestMigration || "None"}</div>
                </div>
              </div>

              {/* Table Stats Breakdown */}
              {selectedBackup.metadata?.tableStats && (
                <div className="space-y-2">
                  <h4 className="font-bold text-foreground uppercase tracking-wider text-[10px]">
                    Table Records Breakdown ({selectedBackup.tablesCount} Tables)
                  </h4>
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-onyx-border bg-onyx p-2 divide-y divide-onyx-border/40">
                    {Object.entries(selectedBackup.metadata.tableStats).map(([tbl, count]: [string, any]) => (
                      <div key={tbl} className="flex justify-between py-1 px-2 text-[11px]">
                        <span className="font-mono text-platinum">{tbl}</span>
                        <span className="text-gold font-semibold">{count.toLocaleString()} rows</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Event Timeline */}
              {selectedBackup.events && Array.isArray(selectedBackup.events) && (
                <div className="space-y-2">
                  <h4 className="font-bold text-foreground uppercase tracking-wider text-[10px]">
                    Execution Event Timeline
                  </h4>
                  <div className="space-y-2 p-3 rounded-xl border border-onyx-border bg-onyx">
                    {selectedBackup.events.map((evt: any, idx: number) => (
                      <div key={idx} className="flex items-start gap-2.5 text-[11px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-gold mt-1.5 shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground uppercase text-[10px]">
                              {evt.stage}
                            </span>
                            <span className="text-[10px] text-platinum-muted">
                              {evt.timestamp ? format(new Date(evt.timestamp), "HH:mm:ss") : ""}
                            </span>
                          </div>
                          <p className="text-platinum-muted leading-tight mt-0.5">{evt.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* MODAL 2: Dry Run Restore Preview & Validation */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="bg-onyx-surface border-onyx-border text-foreground max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" /> Dry-Run Restore Validation Report
            </DialogTitle>
            <DialogDescription className="text-xs text-platinum-muted">
              Validation executed in an isolated dry-run environment without touching live production data.
            </DialogDescription>
          </DialogHeader>

          {previewData && (
            <div className="space-y-4 py-2 text-xs">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="font-semibold text-emerald-400">Integrity Check & SQL Syntax Validated</div>
                  <div className="text-[11px] text-platinum-muted">
                    {previewData.tablesRestoredCount} tables and {previewData.recordsRestoredCount.toLocaleString()} rows verified in {previewData.durationMs}ms.
                  </div>
                </div>
              </div>

              {/* Migration Compatibility */}
              <div className="p-3 rounded-xl bg-onyx border border-onyx-border space-y-2">
                <div className="font-bold text-foreground text-xs">Prisma Migration Compatibility</div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-platinum-muted">Backup Migration:</span>
                  <span className="font-mono text-foreground">{previewData.compatibilityReport?.backupMigration || "None"}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-platinum-muted">Current Live Migration:</span>
                  <span className="font-mono text-foreground">{previewData.compatibilityReport?.currentMigration || "None"}</span>
                </div>

                {previewData.compatibilityReport?.warnings?.length > 0 && (
                  <div className="mt-2 p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] space-y-1">
                    <div className="font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Schema Evolution Notice:
                    </div>
                    {previewData.compatibilityReport.warnings.map((w: string, i: number) => (
                      <p key={i}>{w}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button size="sm" onClick={() => setPreviewModalOpen(false)} className="bg-gold text-black font-semibold text-xs">
              Close Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: Critical Production Restore Confirmation */}
      <Dialog open={restoreModalOpen} onOpenChange={setRestoreModalOpen}>
        <DialogContent className="bg-onyx-surface border-rose-500/40 text-foreground max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-5 h-5 text-rose-400" /> CRITICAL: Production Database Restore
            </DialogTitle>
            <DialogDescription className="text-xs text-platinum-muted">
              You are initiating a full disaster recovery restore of the production PostgreSQL database.
            </DialogDescription>
          </DialogHeader>

          {selectedBackup && (
            <div className="space-y-4 py-2 text-xs">
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-xs">
                  <ShieldCheck className="w-4 h-4" /> Automatic Safety Backup Protected
                </div>
                <p className="text-[11px] leading-relaxed">
                  Before restoring, the system will automatically create an emergency safety backup of the current live database and upload it to R2 storage.
                </p>
                <p className="text-[11px] leading-relaxed">
                  System maintenance mode will be engaged during recovery to restrict concurrent writes.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-onyx border border-onyx-border space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-platinum-muted">Target Backup ID:</span>
                  <span className="font-mono font-semibold text-gold">{selectedBackup.backupId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-platinum-muted">Backup Timestamp:</span>
                  <span>{format(new Date(selectedBackup.createdAt), "dd MMM yyyy, HH:mm:ss")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-platinum-muted">Tables / Rows:</span>
                  <span>{selectedBackup.tablesCount} tables · {(selectedBackup.recordsCount || 0).toLocaleString()} rows</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-semibold text-foreground">
                  Type <span className="font-mono text-rose-400 select-all font-bold">CONFIRM_RESTORE</span> to authorize:
                </label>
                <Input
                  value={restoreConfirmation}
                  onChange={(e) => setRestoreConfirmation(e.target.value)}
                  placeholder="CONFIRM_RESTORE"
                  className="h-8 text-xs bg-onyx border-rose-500/40 text-foreground font-mono"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRestoreModalOpen(false)}
              disabled={isProcessingRestore}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleExecuteProductionRestore}
              disabled={restoreConfirmation !== "CONFIRM_RESTORE" || isProcessingRestore}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs gap-1.5"
            >
              {isProcessingRestore ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Restoring Database...
                </>
              ) : (
                <>
                  <RotateCcw className="w-3.5 h-3.5" /> Execute Production Restore
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
