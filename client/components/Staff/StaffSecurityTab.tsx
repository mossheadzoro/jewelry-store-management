"use client";

import React, { useState } from "react";
import { Shield, MonitorSmartphone, Key, Clock, AlertTriangle, Globe } from "lucide-react";

export default function StaffSecurityTab() {
  const [settings, setSettings] = useState({
    twoFactorAuth: false,
    forcePasswordReset: false,
    sessionTimeout: "30",
    maxFailedAttempts: "5",
    passwordExpiry: "90",
  });

  return (
    <div className="space-y-6">
      <div className="bg-onyx-surface rounded-2xl border border-onyx-border p-6">
        <h3 className="text-[16px] font-semibold text-platinum flex items-center gap-2 mb-6">
          <Shield className="w-5 h-5 text-gold" />
          Staff Security & Authentication Policies
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 2FA */}
          <div className="p-4 border border-onyx-border rounded-xl bg-onyx flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <MonitorSmartphone className="w-4 h-4 text-platinum-muted" />
                <span className="text-[13px] font-medium text-platinum">Two-Factor Auth (2FA)</span>
              </div>
              <p className="text-[11px] text-platinum-muted leading-relaxed">
                Require all staff members to verify logins via authenticator app or SMS OTP.
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-[12px] text-gold">{settings.twoFactorAuth ? "Enabled" : "Disabled"}</span>
              <button
                onClick={() => setSettings((s) => ({ ...s, twoFactorAuth: !s.twoFactorAuth }))}
                className={`w-10 h-5 rounded-full relative transition-colors ${
                  settings.twoFactorAuth ? "bg-gold" : "bg-onyx-border"
                }`}
              >
                <div
                  className={`w-3 h-3 bg-onyx rounded-full absolute top-1 transition-all ${
                    settings.twoFactorAuth ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Password Expiration */}
          <div className="p-4 border border-onyx-border rounded-xl bg-onyx flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Key className="w-4 h-4 text-platinum-muted" />
                <span className="text-[13px] font-medium text-platinum">Password Rotation</span>
              </div>
              <p className="text-[11px] text-platinum-muted leading-relaxed">
                Force staff password renewal every N days to ensure credential security.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <select
                value={settings.passwordExpiry}
                onChange={(e) => setSettings((s) => ({ ...s, passwordExpiry: e.target.value }))}
                className="w-full bg-onyx-surface border border-onyx-border text-platinum text-[12px] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-gold"
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
                <span className="text-[13px] font-medium text-platinum">Inactivity Timeout</span>
              </div>
              <p className="text-[11px] text-platinum-muted leading-relaxed">
                Automatically lock inactive staff POS sessions to prevent unauthorized counter access.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <select
                value={settings.sessionTimeout}
                onChange={(e) => setSettings((s) => ({ ...s, sessionTimeout: e.target.value }))}
                className="w-full bg-onyx-surface border border-onyx-border text-platinum text-[12px] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-gold"
              >
                <option value="15">15 Minutes</option>
                <option value="30">30 Minutes</option>
                <option value="60">1 Hour</option>
                <option value="120">2 Hours</option>
              </select>
            </div>
          </div>

          {/* Failed Login Lockout */}
          <div className="p-4 border border-onyx-border rounded-xl bg-onyx flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-platinum-muted" />
                <span className="text-[13px] font-medium text-platinum">Account Lockout Threshold</span>
              </div>
              <p className="text-[11px] text-platinum-muted leading-relaxed">
                Lock employee accounts automatically after consecutive failed password attempts.
              </p>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <select
                value={settings.maxFailedAttempts}
                onChange={(e) => setSettings((s) => ({ ...s, maxFailedAttempts: e.target.value }))}
                className="w-full bg-onyx-surface border border-onyx-border text-platinum text-[12px] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-gold"
              >
                <option value="3">3 Attempts</option>
                <option value="5">5 Attempts</option>
                <option value="10">10 Attempts</option>
              </select>
            </div>
          </div>

          {/* Force Reset Next Login */}
          <div className="p-4 border border-onyx-border rounded-xl bg-onyx flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-platinum-muted" />
                <span className="text-[13px] font-medium text-platinum">Force Reset on First Login</span>
              </div>
              <p className="text-[11px] text-platinum-muted leading-relaxed">
                Prompt newly created employees to change their temporary passwords immediately.
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-[12px] text-gold">
                {settings.forcePasswordReset ? "Enabled" : "Disabled"}
              </span>
              <button
                onClick={() =>
                  setSettings((s) => ({ ...s, forcePasswordReset: !s.forcePasswordReset }))
                }
                className={`w-10 h-5 rounded-full relative transition-colors ${
                  settings.forcePasswordReset ? "bg-gold" : "bg-onyx-border"
                }`}
              >
                <div
                  className={`w-3 h-3 bg-onyx rounded-full absolute top-1 transition-all ${
                    settings.forcePasswordReset ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
