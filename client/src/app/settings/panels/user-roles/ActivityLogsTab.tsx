"use client";

import React, { useState, useEffect } from "react";
import { Search, Filter, History, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ActivityLogsTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [moduleFilter, setModuleFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    fetchLogs();
  }, [moduleFilter, actionFilter, dateFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (moduleFilter) params.append("module", moduleFilter);
      if (actionFilter) params.append("action", actionFilter);
      if (dateFilter) {
        // Simple date matching for today, week, etc. would go here. 
        // For simplicity, we just fetch all and let the user see recent ones.
      }
      
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
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(d);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex gap-2 w-full max-w-2xl">
          <div className="relative w-full">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-platinum-muted" />
            <select 
              value={moduleFilter}
              onChange={e => setModuleFilter(e.target.value)}
              className="w-full bg-onyx pl-9 pr-4 py-2 rounded-lg border border-onyx-border focus:border-gold outline-none text-[13px] text-platinum appearance-none"
            >
              <option value="">All Modules</option>
              <option value="Customers">Customers</option>
              <option value="Jewellery">Jewellery</option>
              <option value="Inventory">Inventory</option>
              <option value="Orders">Orders</option>
              <option value="Finance">Finance</option>
              <option value="Settings">Settings</option>
            </select>
          </div>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-platinum-muted" />
            <input 
              type="text" 
              placeholder="Filter by action..." 
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              className="w-full bg-onyx pl-9 pr-4 py-2 rounded-lg border border-onyx-border focus:border-gold outline-none text-[13px] text-platinum"
            />
          </div>
        </div>
        <button 
          onClick={() => fetchLogs()}
          className="bg-onyx text-platinum px-4 py-2 border border-onyx-border rounded-lg text-[13px] font-medium hover:bg-onyx-elevated transition-colors flex items-center justify-center gap-2"
        >
          <History className="w-4 h-4" />
          Refresh Logs
        </button>
      </div>

      <div className="bg-onyx-surface rounded-xl border border-onyx-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-onyx-border bg-onyx-elevated/50 text-platinum-muted font-medium">
                <th className="px-6 py-4 text-left">Time</th>
                <th className="px-6 py-4 text-left">User</th>
                <th className="px-6 py-4 text-left">Role</th>
                <th className="px-6 py-4 text-left">Module</th>
                <th className="px-6 py-4 text-left">Action</th>
                <th className="px-6 py-4 text-left">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-onyx-border text-platinum">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-platinum-muted">Loading activity logs...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-platinum-muted">No activity found for the selected filters.</td></tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} className="hover:bg-onyx/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-platinum-muted">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {log.user?.name || "Unknown User"}
                    </td>
                    <td className="px-6 py-4">
                      {log.user?.role?.name || log.user?.systemRole || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-onyx px-2 py-0.5 rounded text-[11px] text-platinum-muted border border-onyx-border">
                        {log.module}
                      </span>
                    </td>
                    <td className="px-6 py-4">{log.action}</td>
                    <td className="px-6 py-4 text-[11px] text-platinum-muted max-w-xs truncate">
                      {log.metadata ? JSON.stringify(log.metadata) : "-"}
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
