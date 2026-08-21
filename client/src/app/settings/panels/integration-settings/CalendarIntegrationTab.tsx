"use client";

import React from "react";
import { Calendar, RefreshCw, CheckCircle2, Link2, Clock } from "lucide-react";

interface CalendarIntegrationTabProps {
  config: any;
  updateConfig: (section: string, key: string, value: any) => void;
  isAdmin: boolean;
}

export default function CalendarIntegrationTab({ config, updateConfig, isAdmin }: CalendarIntegrationTabProps) {
  const calConfig = config?.calendar || {
    googleCalendar: { connected: true, calendarId: "primary_jewelry_orders@gmail.com" },
    outlookCalendar: { connected: false, email: "" },
    deliveryScheduleSync: { autoCreateDeliveryEvent: true, reminderMinutesBefore: 120 },
    reminderSync: { syncSavingSchemeDues: true, syncKarigarPromisedDates: true }
  };

  const updateSubProp = (section: string, key: string, val: any) => {
    updateConfig("calendar", section, {
      ...(calConfig[section] || {}),
      [key]: val
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#111113] p-4 rounded-xl border border-[#1F1F24] flex items-center justify-between">
        <div>
          <h3 className="text-[16px] font-semibold text-platinum flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            Calendar & Event Schedule Integration
          </h3>
          <p className="text-[12px] text-platinum-muted mt-0.5">
            Sync custom jewelry delivery schedules, karigar crafting promised dates, and installment due reminders with Google & Outlook calendars.
          </p>
        </div>
        <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" /> Google Calendar Synced
        </span>
      </div>

      {/* Calendar Providers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Google Calendar */}
        <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-3">
          <div className="flex items-center justify-between border-b border-[#1F1F24] pb-2">
            <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" /> Google Calendar Integration
            </h4>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              Connected
            </span>
          </div>
          <div className="space-y-2 pt-1">
            <label className="text-[11px] text-platinum-muted block">Calendar ID / Target Mail</label>
            <input
              type="text"
              value={calConfig.googleCalendar?.calendarId || ""}
              onChange={(e) => updateSubProp("googleCalendar", "calendarId", e.target.value)}
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none"
            />
          </div>
        </div>

        {/* Outlook Calendar */}
        <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-3">
          <div className="flex items-center justify-between border-b border-[#1F1F24] pb-2">
            <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-400" /> Microsoft Outlook Calendar
            </h4>
            <button className="text-[11px] text-gold hover:underline flex items-center gap-1 font-medium">
              <Link2 className="w-3 h-3" /> Connect Account
            </button>
          </div>
          <div className="space-y-2 pt-1">
            <label className="text-[11px] text-platinum-muted block">Outlook Account Email</label>
            <input
              type="email"
              value={calConfig.outlookCalendar?.email || ""}
              onChange={(e) => updateSubProp("outlookCalendar", "email", e.target.value)}
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none"
              placeholder="store@outlook.com"
            />
          </div>
        </div>
      </div>

      {/* Sync Preferences */}
      <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-4">
        <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2 border-b border-[#1F1F24] pb-3">
          <Clock className="w-4 h-4 text-gold" />
          Automated Event Creation & Reminder Rules
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-[#0A0A0B] border border-[#1F1F24] flex items-center justify-between">
            <div>
              <p className="text-[12px] font-medium text-platinum">Delivery Schedule Sync</p>
              <p className="text-[10px] text-platinum-muted">Auto create calendar event on order promise date</p>
            </div>
            <input
              type="checkbox"
              checked={!!calConfig.deliveryScheduleSync?.autoCreateDeliveryEvent}
              onChange={(e) => updateSubProp("deliveryScheduleSync", "autoCreateDeliveryEvent", e.target.checked)}
              className="accent-gold w-4 h-4"
            />
          </div>

          <div className="p-3 rounded-lg bg-[#0A0A0B] border border-[#1F1F24] flex items-center justify-between">
            <div>
              <p className="text-[12px] font-medium text-platinum">Karigar Completion Date Reminder</p>
              <p className="text-[10px] text-platinum-muted">Notify staff 2 hours before promised delivery</p>
            </div>
            <input
              type="checkbox"
              checked={!!calConfig.reminderSync?.syncKarigarPromisedDates}
              onChange={(e) => updateSubProp("reminderSync", "syncKarigarPromisedDates", e.target.checked)}
              className="accent-gold w-4 h-4"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
