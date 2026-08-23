"use client";

import React, { useState, useEffect } from "react";
import { 
  Bell, Monitor, Smartphone, Globe, CheckCircle2, Send, 
  Mail, RefreshCw, AlertCircle, Clock, Search, ChevronRight, X, Eye
} from "lucide-react";
import { useBranchStore } from "@/lib/store/useBranchStore";

interface NotificationServicesTabProps {
  config: any;
  updateConfig: (section: string, key: string, value: any) => void;
  isAdmin: boolean;
}

export default function NotificationServicesTab({ config, updateConfig, isAdmin }: NotificationServicesTabProps) {
  const { selectedBranch } = useBranchStore();
  const notifConfig = config?.notifications || {
    push: { enabled: true, provider: "firebase", fcmServerKey: "AAAA...", vapidKey: "BN8..." },
    desktop: { enabled: true, nativeSound: true, showOrderPopups: true },
    browser: { enabled: true, webPushPermission: "granted" },
    mobileApp: { enabled: true, provider: "onesignal", appId: "10928301...", restApiKey: "••••••••" }
  };

  // Email Logs State
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState<any | null>(null);

  useEffect(() => {
    fetchEmailLogs();
  }, [selectedBranch?.id, statusFilter]);

  const fetchEmailLogs = async () => {
    setLogsLoading(true);
    try {
      const branchParam = selectedBranch?.id ? `&branchId=${selectedBranch.id}` : "";
      const statusParam = statusFilter !== "ALL" ? `&status=${statusFilter}` : "";
      const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : "";

      const res = await fetch(`/api/settings/email/logs?page=1&limit=8${branchParam}${statusParam}${searchParam}`);
      if (res.ok) {
        const json = await res.json();
        setEmailLogs(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load email logs", err);
    } finally {
      setLogsLoading(false);
    }
  };

  const updateSubProp = (section: string, key: string, val: any) => {
    updateConfig("notifications", section, {
      ...(notifConfig[section] || {}),
      [key]: val
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#111113] p-4 rounded-xl border border-[#1F1F24] flex items-center justify-between">
        <div>
          <h3 className="text-[16px] font-semibold text-platinum flex items-center gap-2">
            <Bell className="w-5 h-5 text-gold" />
            Cross-Platform Notification Services
          </h3>
          <p className="text-[12px] text-platinum-muted mt-0.5">
            Configure Firebase FCM push alerts, browser web push, desktop popup alerts, and inspect live transactional email delivery logs.
          </p>
        </div>
        <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-gold/10 text-gold border border-gold/30 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" /> Push & Email Engine Active
        </span>
      </div>

      {/* Grid of Notification Channels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Push Notifications (FCM / VAPID) */}
        <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-3">
          <div className="flex items-center justify-between border-b border-[#1F1F24] pb-2">
            <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2">
              <Send className="w-4 h-4 text-gold" /> Firebase Cloud Messaging (FCM Push)
            </h4>
            <input
              type="checkbox"
              checked={!!notifConfig.push?.enabled}
              onChange={(e) => updateSubProp("push", "enabled", e.target.checked)}
              className="accent-gold w-4 h-4"
            />
          </div>
          <div className="space-y-3 pt-1">
            <div>
              <label className="text-[11px] text-platinum-muted block mb-1">FCM Server Key</label>
              <input
                type="password"
                value={notifConfig.push?.fcmServerKey || ""}
                onChange={(e) => updateSubProp("push", "fcmServerKey", e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] text-platinum-muted block mb-1">Web Push VAPID Key</label>
              <input
                type="text"
                value={notifConfig.push?.vapidKey || ""}
                onChange={(e) => updateSubProp("push", "vapidKey", e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* 2. Mobile App Notifications (OneSignal) */}
        <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-3">
          <div className="flex items-center justify-between border-b border-[#1F1F24] pb-2">
            <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-gold" /> Mobile App Push (OneSignal / Expo)
            </h4>
            <input
              type="checkbox"
              checked={!!notifConfig.mobileApp?.enabled}
              onChange={(e) => updateSubProp("mobileApp", "enabled", e.target.checked)}
              className="accent-gold w-4 h-4"
            />
          </div>
          <div className="space-y-3 pt-1">
            <div>
              <label className="text-[11px] text-platinum-muted block mb-1">OneSignal App ID</label>
              <input
                type="text"
                value={notifConfig.mobileApp?.appId || ""}
                onChange={(e) => updateSubProp("mobileApp", "appId", e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] text-platinum-muted block mb-1">REST API Key</label>
              <input
                type="password"
                value={notifConfig.mobileApp?.restApiKey || ""}
                onChange={(e) => updateSubProp("mobileApp", "restApiKey", e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none"
              />
            </div>
          </div>
        </div>

        {/* 3. Desktop & Browser Notifications */}
        <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-3 md:col-span-2">
          <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2 border-b border-[#1F1F24] pb-2">
            <Monitor className="w-4 h-4 text-gold" /> Desktop & Native Web Browser Popups
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="p-3 rounded-lg bg-[#0A0A0B] border border-[#1F1F24] flex items-center justify-between">
              <div>
                <p className="text-[12px] font-medium text-platinum">Native Windows Desktop Sound & Chime</p>
                <p className="text-[10px] text-platinum-muted">Audio chime on new order or customer arrival</p>
              </div>
              <input
                type="checkbox"
                checked={!!notifConfig.desktop?.nativeSound}
                onChange={(e) => updateSubProp("desktop", "nativeSound", e.target.checked)}
                className="accent-gold w-4 h-4"
              />
            </div>

            <div className="p-3 rounded-lg bg-[#0A0A0B] border border-[#1F1F24] flex items-center justify-between">
              <div>
                <p className="text-[12px] font-medium text-platinum">Live Order Toast Banner Alerts</p>
                <p className="text-[10px] text-platinum-muted">Display floating counter alert on sale</p>
              </div>
              <input
                type="checkbox"
                checked={!!notifConfig.desktop?.showOrderPopups}
                onChange={(e) => updateSubProp("desktop", "showOrderPopups", e.target.checked)}
                className="accent-gold w-4 h-4"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: Live Email Delivery Logs */}
      <div className="bg-[#111113] p-5 rounded-2xl border border-[#1F1F24] space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#1F1F24] pb-3">
          <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2">
            <Mail className="w-4 h-4 text-indigo-400" />
            Transactional Email Delivery Logs
          </h4>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Filter Tabs */}
            <div className="flex items-center bg-[#0A0A0B] border border-[#1F1F24] rounded-lg p-0.5 text-[11px]">
              {["ALL", "SENT", "QUEUED", "FAILED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    statusFilter === st ? "bg-gold text-black font-semibold" : "text-platinum-muted hover:text-platinum"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Refresh */}
            <button
              onClick={fetchEmailLogs}
              disabled={logsLoading}
              className="p-1.5 rounded-lg bg-[#1A1A1E] border border-[#2F2F36] text-platinum-muted hover:text-platinum disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${logsLoading ? "animate-spin text-gold" : ""}`} />
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead>
              <tr className="border-b border-[#1F1F24] text-platinum-muted text-[11px]">
                <th className="pb-2 font-medium">Recipient</th>
                <th className="pb-2 font-medium">Subject</th>
                <th className="pb-2 font-medium">Template / Type</th>
                <th className="pb-2 font-medium">Provider</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Time</th>
                <th className="pb-2 font-medium text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F1F24]/50">
              {logsLoading && emailLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-platinum-muted">
                    Loading delivery logs...
                  </td>
                </tr>
              ) : emailLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-platinum-muted">
                    No email logs found for this filter.
                  </td>
                </tr>
              ) : (
                emailLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#16161A]/50 transition-colors">
                    <td className="py-2.5 font-mono text-platinum truncate max-w-[150px]">{log.recipient}</td>
                    <td className="py-2.5 text-platinum-muted truncate max-w-[200px]">{log.subject}</td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded bg-[#1F1F24] text-platinum-muted text-[10px] font-mono">
                        {log.templateId || "CUSTOM"}
                      </span>
                    </td>
                    <td className="py-2.5 text-[11px] text-platinum-muted">{log.provider}</td>
                    <td className="py-2.5">
                      {log.status === "SENT" || log.status === "DELIVERED" ? (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-medium flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" /> {log.status}
                        </span>
                      ) : log.status === "QUEUED" || log.status === "SENDING" ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-medium flex items-center gap-1 w-fit">
                          <Clock className="w-3 h-3" /> {log.status}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] font-medium flex items-center gap-1 w-fit">
                          <AlertCircle className="w-3 h-3" /> {log.status}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 text-platinum-muted text-[11px]">
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        onClick={() => setSelectedJob(log)}
                        className="p-1 rounded bg-[#1A1A1E] text-platinum-muted hover:text-platinum border border-[#2F2F36]"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Diagnostic Detail Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#111113] border border-[#1F1F24] rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1F1F24] pb-3">
              <h3 className="text-[15px] font-semibold text-platinum flex items-center gap-2">
                <Mail className="w-4 h-4 text-gold" /> Delivery Diagnostic Details
              </h3>
              <button onClick={() => setSelectedJob(null)} className="text-platinum-muted hover:text-platinum">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-[12px]">
              <div className="flex justify-between py-1.5 border-b border-[#1F1F24]">
                <span className="text-platinum-muted">Job ID:</span>
                <span className="font-mono text-platinum">{selectedJob.id}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1F1F24]">
                <span className="text-platinum-muted">Recipient:</span>
                <span className="font-mono text-platinum">{selectedJob.recipient}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1F1F24]">
                <span className="text-platinum-muted">Subject:</span>
                <span className="text-platinum">{selectedJob.subject}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1F1F24]">
                <span className="text-platinum-muted">Provider:</span>
                <span className="text-platinum">{selectedJob.provider}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1F1F24]">
                <span className="text-platinum-muted">Status:</span>
                <span className="font-medium text-platinum">{selectedJob.status}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#1F1F24]">
                <span className="text-platinum-muted">Attempts:</span>
                <span className="font-mono text-platinum">{selectedJob.attempts} / {selectedJob.maxAttempts}</span>
              </div>
              {selectedJob.providerMessageId && (
                <div className="flex justify-between py-1.5 border-b border-[#1F1F24]">
                  <span className="text-platinum-muted">Message ID:</span>
                  <span className="font-mono text-gold truncate max-w-[250px]">{selectedJob.providerMessageId}</span>
                </div>
              )}
              {selectedJob.errorMessage && (
                <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/20 text-rose-300 text-[11px] mt-2">
                  <strong>Diagnostic Error:</strong> {selectedJob.errorMessage}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedJob(null)}
                className="px-4 py-2 rounded-xl bg-[#1A1A1E] text-platinum hover:text-white text-[12px]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
