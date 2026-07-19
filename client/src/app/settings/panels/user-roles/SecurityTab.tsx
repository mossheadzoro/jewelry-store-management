"use client";

import React, { useState } from "react";
import { Shield, Key, Clock, MonitorSmartphone, Globe, AlertTriangle } from "lucide-react";

export default function SecurityTab() {
  const [settings, setSettings] = useState({
    twoFactorAuth: false,
    forcePasswordReset: false,
    sessionTimeout: "30",
    maxFailedAttempts: "5",
    passwordExpiry: "90"
  });

  return (
    <div className="space-y-6">
      <div className="bg-onyx-surface rounded-xl border border-onyx-border p-6">
        <h3 className="text-[16px] font-semibold text-platinum flex items-center gap-2 mb-6">
          <Shield className="w-5 h-5 text-gold" />
          Global Security Policies
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 2FA */}
          <div className="p-4 border border-onyx-border rounded-xl bg-onyx flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MonitorSmartphone className="w-4 h-4 text-platinum-muted" />
                <span className="text-[13px] font-medium text-platinum">Two-Factor Auth (2FA)</span>
              </div>
              <p className="text-[11px] text-platinum-muted leading-relaxed">Require all users to verify logins via authenticator app or SMS.</p>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-[12px] text-gold">{settings.twoFactorAuth ? "Enabled" : "Disabled"}</span>
              <button 
                onClick={() => setSettings(s => ({...s, twoFactorAuth: !s.twoFactorAuth}))}
                className={`w-10 h-5 rounded-full relative transition-colors ${settings.twoFactorAuth ? 'bg-gold' : 'bg-onyx-border'}`}
              >
                <div className={`w-3 h-3 bg-onyx rounded-full absolute top-1 transition-all ${settings.twoFactorAuth ? 'left-6' : 'left-1'}`}></div>
              </button>
            </div>
          </div>

          {/* Password Expiry */}
          <div className="p-4 border border-onyx-border rounded-xl bg-onyx flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Key className="w-4 h-4 text-platinum-muted" />
                <span className="text-[13px] font-medium text-platinum">Password Expiry</span>
              </div>
              <p className="text-[11px] text-platinum-muted leading-relaxed">Force users to change passwords regularly.</p>
            </div>
            <div className="mt-4">
              <select 
                value={settings.passwordExpiry}
                onChange={e => setSettings({...settings, passwordExpiry: e.target.value})}
                className="w-full bg-onyx-surface px-3 py-1.5 rounded border border-onyx-border text-[12px] text-platinum outline-none focus:border-gold"
              >
                <option value="30">Every 30 Days</option>
                <option value="60">Every 60 Days</option>
                <option value="90">Every 90 Days</option>
                <option value="never">Never Expire</option>
              </select>
            </div>
          </div>

          {/* Session Timeout */}
          <div className="p-4 border border-onyx-border rounded-xl bg-onyx flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-platinum-muted" />
                <span className="text-[13px] font-medium text-platinum">Idle Session Timeout</span>
              </div>
              <p className="text-[11px] text-platinum-muted leading-relaxed">Automatically log out inactive users.</p>
            </div>
            <div className="mt-4">
              <select 
                value={settings.sessionTimeout}
                onChange={e => setSettings({...settings, sessionTimeout: e.target.value})}
                className="w-full bg-onyx-surface px-3 py-1.5 rounded border border-onyx-border text-[12px] text-platinum outline-none focus:border-gold"
              >
                <option value="15">15 Minutes</option>
                <option value="30">30 Minutes</option>
                <option value="60">1 Hour</option>
                <option value="120">2 Hours</option>
              </select>
            </div>
          </div>

        </div>
      </div>

      <div className="bg-onyx-surface rounded-xl border border-onyx-border p-6 opacity-75">
        <h3 className="text-[16px] font-semibold text-platinum flex items-center gap-2 mb-6">
          <Globe className="w-5 h-5 text-platinum-muted" />
          IP & Time Restrictions <span className="ml-2 text-[10px] bg-onyx px-2 py-0.5 rounded-full text-gold border border-gold/20">Coming Soon</span>
        </h3>
        <p className="text-[13px] text-platinum-muted mb-4">Restrict access to specific IP addresses (e.g., store Wi-Fi) and working hours.</p>
        <div className="bg-onyx border border-onyx-border rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />
          <p className="text-[12px] text-platinum-muted leading-relaxed">
            IP restrictions require backend proxy configurations to accurately track client IPs. This feature is currently in development.
          </p>
        </div>
      </div>
    </div>
  );
}
