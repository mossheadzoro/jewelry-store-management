"use client";

import React, { useState } from "react";
import { CreditCard, Key, ShieldCheck, Eye, EyeOff, CheckCircle2, AlertCircle, RefreshCw, Webhook } from "lucide-react";

interface PaymentGatewayTabProps {
  config: any;
  updateConfig: (section: string, key: string, value: any) => void;
  isAdmin: boolean;
}

export default function PaymentGatewayTab({ config, updateConfig, isAdmin }: PaymentGatewayTabProps) {
  const pgConfig = config?.paymentGateway || {
    environment: "test", // test or live
    activeGateway: "razorpay",
    razorpay: { enabled: true, keyId: "rzp_test_9A8xK2lPq", keySecret: "••••••••••••••••", webhookSecret: "whsec_rzp_9908" },
    stripe: { enabled: false, publishableKey: "pk_test_51Mz...", secretKey: "", webhookSecret: "" },
    cashfree: { enabled: false, appId: "", secretKey: "", environment: "sandbox" },
    phonepe: { enabled: true, merchantId: "M220199201", saltKey: "••••••••", saltIndex: "1" },
    paytm: { enabled: false, merchantId: "", merchantKey: "", website: "DEFAULT" },
    bharatpe: { enabled: false, merchantId: "", token: "" },
    webhooks: {
      url: "https://api.jewelstore.com/v1/webhooks/payments",
      autoVerifySignature: true,
      retryCount: 3,
      events: { invoicePaid: true, refundProcessed: true, paymentFailed: true }
    }
  };

  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});

  const toggleShow = (key: string) => {
    setShowSecret(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const setGatewayProp = (gateway: string, key: string, val: any) => {
    updateConfig("paymentGateway", gateway, {
      ...(pgConfig[gateway] || {}),
      [key]: val
    });
  };

  const gateways = [
    { id: "razorpay", name: "Razorpay", desc: "Cards, UPI, Netbanking & Razorpay POS", badge: "Popular in India", logoBg: "bg-blue-500/10 text-blue-400" },
    { id: "phonepe", name: "PhonePe PG", desc: "Direct UPI & QR Code merchant payments", badge: "Instant UPI", logoBg: "bg-purple-500/10 text-purple-400" },
    { id: "stripe", name: "Stripe", desc: "International Cards & Recurring Subscriptions", badge: "Global Payments", logoBg: "bg-indigo-500/10 text-indigo-400" },
    { id: "cashfree", name: "Cashfree Payments", desc: "Payment Gateway, Subscriptions & Instant Payouts", badge: "Low Fees", logoBg: "bg-emerald-500/10 text-emerald-400" },
    { id: "paytm", name: "Paytm Business", desc: "Paytm Wallet, UPI, Postpaid & Soundbox sync", badge: "Wallet & Soundbox", logoBg: "bg-sky-500/10 text-sky-400" },
    { id: "bharatpe", name: "BharatPe", desc: "Zero Fee UPI QR & Merchant POS settlements", badge: "0% UPI Fee", logoBg: "bg-teal-500/10 text-teal-400" },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111113] p-4 rounded-xl border border-[#1F1F24]">
        <div>
          <h3 className="text-[16px] font-semibold text-platinum flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-gold" />
            Payment Gateway Integration
          </h3>
          <p className="text-[12px] text-platinum-muted mt-0.5">
            Configure card, UPI, and netbanking gateways for online sales and POS payment collections.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-[#0A0A0B] p-1.5 rounded-lg border border-[#1F1F24] shrink-0">
          <span className="text-[12px] text-platinum-muted px-2 font-medium">Environment:</span>
          <button
            onClick={() => updateConfig("paymentGateway", "environment", "test")}
            className={`px-3 py-1 rounded text-[12px] font-medium transition-all ${
              pgConfig.environment === "test"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                : "text-platinum-muted hover:text-platinum"
            }`}
          >
            Sandbox / Test
          </button>
          <button
            onClick={() => updateConfig("paymentGateway", "environment", "live")}
            className={`px-3 py-1 rounded text-[12px] font-medium transition-all ${
              pgConfig.environment === "live"
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                : "text-platinum-muted hover:text-platinum"
            }`}
          >
            Live Production
          </button>
        </div>
      </div>

      {/* Gateway Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {gateways.map(gw => {
          const isEnabled = pgConfig[gw.id]?.enabled;
          const isPrimary = pgConfig.activeGateway === gw.id;

          return (
            <div
              key={gw.id}
              className={`p-4 rounded-xl border transition-all ${
                isEnabled
                  ? "bg-[#111113] border-gold/30 hover:border-gold/60"
                  : "bg-[#0E0E10] border-[#1F1F24] opacity-80 hover:opacity-100"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${gw.logoBg}`}>
                    {gw.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-[14px] font-semibold text-platinum">{gw.name}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/10 text-gold font-medium">
                        {gw.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-platinum-muted mt-0.5">{gw.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!isEnabled}
                      onChange={(e) => setGatewayProp(gw.id, "enabled", e.target.checked)}
                      disabled={!isAdmin}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-[#1F1F24] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gold"></div>
                  </label>
                </div>
              </div>

              {isEnabled && (
                <div className="mt-4 pt-3 border-t border-[#1F1F24] space-y-3">
                  {gw.id === "razorpay" && (
                    <>
                      <div>
                        <label className="text-[11px] text-platinum-muted block mb-1">Key ID</label>
                        <input
                          type="text"
                          value={pgConfig.razorpay?.keyId || ""}
                          onChange={(e) => setGatewayProp("razorpay", "keyId", e.target.value)}
                          className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none"
                          placeholder="rzp_test_..."
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-platinum-muted block mb-1">Key Secret</label>
                        <div className="relative">
                          <input
                            type={showSecret["rzp"] ? "text" : "password"}
                            value={pgConfig.razorpay?.keySecret || ""}
                            onChange={(e) => setGatewayProp("razorpay", "keySecret", e.target.value)}
                            className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none pr-8"
                          />
                          <button
                            type="button"
                            onClick={() => toggleShow("rzp")}
                            className="absolute right-2.5 top-2 text-platinum-muted hover:text-platinum"
                          >
                            {showSecret["rzp"] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {gw.id === "phonepe" && (
                    <>
                      <div>
                        <label className="text-[11px] text-platinum-muted block mb-1">Merchant ID</label>
                        <input
                          type="text"
                          value={pgConfig.phonepe?.merchantId || ""}
                          onChange={(e) => setGatewayProp("phonepe", "merchantId", e.target.value)}
                          className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] text-platinum-muted block mb-1">Salt Key</label>
                          <input
                            type="password"
                            value={pgConfig.phonepe?.saltKey || ""}
                            onChange={(e) => setGatewayProp("phonepe", "saltKey", e.target.value)}
                            className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-platinum-muted block mb-1">Salt Index</label>
                          <input
                            type="text"
                            value={pgConfig.phonepe?.saltIndex || "1"}
                            onChange={(e) => setGatewayProp("phonepe", "saltIndex", e.target.value)}
                            className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {gw.id === "stripe" && (
                    <>
                      <div>
                        <label className="text-[11px] text-platinum-muted block mb-1">Publishable Key</label>
                        <input
                          type="text"
                          value={pgConfig.stripe?.publishableKey || ""}
                          onChange={(e) => setGatewayProp("stripe", "publishableKey", e.target.value)}
                          className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none"
                          placeholder="pk_test_..."
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-platinum-muted block mb-1">Secret Key</label>
                        <input
                          type="password"
                          value={pgConfig.stripe?.secretKey || ""}
                          onChange={(e) => setGatewayProp("stripe", "secretKey", e.target.value)}
                          className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none"
                          placeholder="sk_test_..."
                        />
                      </div>
                    </>
                  )}

                  {gw.id === "cashfree" && (
                    <>
                      <div>
                        <label className="text-[11px] text-platinum-muted block mb-1">App ID</label>
                        <input
                          type="text"
                          value={pgConfig.cashfree?.appId || ""}
                          onChange={(e) => setGatewayProp("cashfree", "appId", e.target.value)}
                          className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-platinum-muted block mb-1">Secret Key</label>
                        <input
                          type="password"
                          value={pgConfig.cashfree?.secretKey || ""}
                          onChange={(e) => setGatewayProp("cashfree", "secretKey", e.target.value)}
                          className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none"
                        />
                      </div>
                    </>
                  )}

                  {gw.id === "paytm" && (
                    <>
                      <div>
                        <label className="text-[11px] text-platinum-muted block mb-1">Merchant ID (MID)</label>
                        <input
                          type="text"
                          value={pgConfig.paytm?.merchantId || ""}
                          onChange={(e) => setGatewayProp("paytm", "merchantId", e.target.value)}
                          className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-platinum-muted block mb-1">Merchant Key</label>
                        <input
                          type="password"
                          value={pgConfig.paytm?.merchantKey || ""}
                          onChange={(e) => setGatewayProp("paytm", "merchantKey", e.target.value)}
                          className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none"
                        />
                      </div>
                    </>
                  )}

                  {gw.id === "bharatpe" && (
                    <>
                      <div>
                        <label className="text-[11px] text-platinum-muted block mb-1">Merchant ID</label>
                        <input
                          type="text"
                          value={pgConfig.bharatpe?.merchantId || ""}
                          onChange={(e) => setGatewayProp("bharatpe", "merchantId", e.target.value)}
                          className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-platinum-muted block mb-1">Auth Token</label>
                        <input
                          type="password"
                          value={pgConfig.bharatpe?.token || ""}
                          onChange={(e) => setGatewayProp("bharatpe", "token", e.target.value)}
                          className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none"
                        />
                      </div>
                    </>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => updateConfig("paymentGateway", "activeGateway", gw.id)}
                      className={`text-[11px] font-medium px-2.5 py-1 rounded transition-colors ${
                        isPrimary
                          ? "bg-gold text-foreground font-semibold"
                          : "bg-[#1F1F24] text-platinum-muted hover:text-platinum"
                      }`}
                    >
                      {isPrimary ? "Default Gateway" : "Set as Default"}
                    </button>
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Ready
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Webhook Settings Sub-section */}
      <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-4">
        <div className="flex items-center justify-between border-b border-[#1F1F24] pb-3">
          <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2">
            <Webhook className="w-4 h-4 text-gold" />
            Webhook Settings
          </h4>
          <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            SSL Verified
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[12px] font-medium text-platinum block mb-1">Webhook Endpoint URL</label>
            <input
              type="text"
              readOnly
              value={pgConfig.webhooks?.url || "https://api.jewelstore.com/v1/webhooks/payments"}
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-gold font-mono cursor-pointer"
            />
            <p className="text-[11px] text-platinum-muted mt-1">Copy this URL into your Razorpay / PhonePe webhook settings panel.</p>
          </div>

          <div>
            <label className="text-[12px] font-medium text-platinum block mb-1">Webhook Signature Secret</label>
            <input
              type="password"
              value={pgConfig.razorpay?.webhookSecret || "whsec_rzp_9908"}
              onChange={(e) => setGatewayProp("razorpay", "webhookSecret", e.target.value)}
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
