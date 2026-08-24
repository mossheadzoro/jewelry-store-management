"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, History, Calendar, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StaffActivityLogsTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [moduleFilter, setModuleFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchLogs();
  }, [moduleFilter, actionFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (moduleFilter) params.append("module", moduleFilter);
      if (actionFilter) params.append("action", actionFilter);

      const res = await fetch(`/api/settings/activity-logs?${params.toString()}`);
      if (res.ok) setLogs(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return d.toLocaleString("en-IN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredLogs = logs.filter((l) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      l.user?.name?.toLowerCase().includes(s) ||
      l.action?.toLowerCase().includes(s) ||
      l.details?.toLowerCase().includes(s) ||
      l.module?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-platinum-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search staff logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-onyx pl-9 pr-4 py-2 rounded-lg border border-onyx-border text-[13px] text-platinum placeholder:text-platinum-muted focus:outline-none focus:border-gold"
            />
          </div>

          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="bg-onyx border border-onyx-border text-platinum text-[13px] rounded-lg px-3 py-2 focus:outline-none focus:border-gold"
          >
            <option value="">All Modules</option>
            <option value="AUTH">Authentication</option>
            <option value="STAFF">Staff & Users</option>
            <option value="CUSTOMERS">Customers</option>
            <option value="BILLING">Billing & POS</option>
            <option value="INVENTORY">Inventory</option>
            <option value="SETTINGS">Settings</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-onyx-surface rounded-2xl border border-onyx-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-onyx-border bg-[#111] text-platinum-muted font-medium">
                <th className="px-6 py-3.5 text-left">Staff Member</th>
                <th className="px-6 py-3.5 text-left">Module</th>
                <th className="px-6 py-3.5 text-left">Action</th>
                <th className="px-6 py-3.5 text-left">Details</th>
                <th className="px-6 py-3.5 text-left">IP Address</th>
                <th className="px-6 py-3.5 text-left">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-onyx-border text-platinum">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-platinum-muted">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-gold mb-2" />
                    Loading staff activity logs...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-platinum-muted">
                    No activity logs found for the selected filters.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-onyx-elevated/40 transition-colors">
                    <td className="px-6 py-4 font-medium flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gold/10 text-gold flex items-center justify-center font-bold text-[11px]">
                        {log.user?.name ? log.user.name[0].toUpperCase() : "U"}
                      </div>
                      <div>
                        <div>{log.user?.name || "System"}</div>
                        <div className="text-[11px] text-platinum-muted">{log.user?.systemRole}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-onyx border border-onyx-border text-platinum-muted">
                        {log.module}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-[12px] text-gold">{log.action}</td>
                    <td className="px-6 py-4 text-platinum-muted max-w-xs truncate">
                      {log.details || "-"}
                    </td>
                    <td className="px-6 py-4 font-mono text-[11px] text-platinum-muted">
                      {log.ipAddress || "127.0.0.1"}
                    </td>
                    <td className="px-6 py-4 text-platinum-muted text-[12px]">
                      {formatDate(log.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
