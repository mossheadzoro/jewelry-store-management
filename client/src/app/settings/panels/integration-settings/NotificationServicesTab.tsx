"use client";

import React from "react";
import { Bell, Monitor, Smartphone, Globe, CheckCircle2, Send } from "lucide-react";

interface NotificationServicesTabProps {
  config: any;
  updateConfig: (section: string, key: string, value: any) => void;
  isAdmin: boolean;
}

export default function NotificationServicesTab({ config, updateConfig, isAdmin }: NotificationServicesTabProps) {
  const notifConfig = config?.notifications || {
    push: { enabled: true, provider: "firebase", fcmServerKey: "AAAA...", vapidKey: "BN8..." },
    desktop: { enabled: true, nativeSound: true, showOrderPopups: true },
    browser: { enabled: true, webPushPermission: "granted" },
    mobileApp: { enabled: true, provider: "onesignal", appId: "10928301...", restApiKey: "••••••••" }
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
            Configure Firebase FCM push alerts, browser web push, desktop popup alerts, and mobile staff app push notifications.
          </p>
        </div>
        <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-gold/10 text-gold border border-gold/30 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" /> Push Engine Active
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
    </div>
  );
}
