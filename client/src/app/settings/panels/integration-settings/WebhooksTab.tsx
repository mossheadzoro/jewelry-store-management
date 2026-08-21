"use client";

import React from "react";
import { Webhook, RefreshCw, CheckCircle2, Sliders, PlayCircle } from "lucide-react";

interface WebhooksTabProps {
  config: any;
  updateConfig: (section: string, key: string, value: any) => void;
  isAdmin: boolean;
}

export default function WebhooksTab({ config, updateConfig, isAdmin }: WebhooksTabProps) {
  const whConfig = config?.webhooks || {
    endpointUrl: "https://api.jewelstore.com/v1/webhooks/listener",
    secretKey: "whsec_live_992019201...",
    events: {
      // Invoice Events
      "invoice.created": true,
      "invoice.paid": true,
      "invoice.cancelled": true,
      // Order Events
      "order.placed": true,
      "order.status_updated": true,
      "order.fulfilled": true,
      // Customer Events
      "customer.created": true,
      "customer.updated": true,
      "kyc.verified": true,
      // Inventory Events
      "stock.low_alert": true,
      "stock.adjusted": true,
      // Payment Events
      "payment.success": true,
      "payment.failed": true,
      "refund.processed": true
    },
    retrySettings: {
      maxRetries: 5,
      exponentialBackoff: true,
      initialIntervalSeconds: 10
    }
  };

  const updateProp = (key: string, val: any) => {
    updateConfig("webhooks", key, val);
  };

  const toggleEvent = (evtKey: string) => {
    updateConfig("webhooks", "events", {
      ...(whConfig.events || {}),
      [evtKey]: !whConfig.events?.[evtKey]
    });
  };

  const updateRetryProp = (key: string, val: any) => {
    updateConfig("webhooks", "retrySettings", {
      ...(whConfig.retrySettings || {}),
      [key]: val
    });
  };

  const eventCategories = [
    {
      title: "Invoice & Billing Events",
      events: [
        { key: "invoice.created", label: "invoice.created", desc: "Fired when new invoice draft is issued" },
        { key: "invoice.paid", label: "invoice.paid", desc: "Fired when full or partial payment is settled" },
        { key: "invoice.cancelled", label: "invoice.cancelled", desc: "Fired when bill is voided or cancelled" }
      ]
    },
    {
      title: "Order & Crafting Events",
      events: [
        { key: "order.placed", label: "order.placed", desc: "Custom karigar order booking created" },
        { key: "order.status_updated", label: "order.status_updated", desc: "Manufacturing stage update" },
        { key: "order.fulfilled", label: "order.fulfilled", desc: "Jewelry item ready for delivery" }
      ]
    },
    {
      title: "Customer & Identity Events",
      events: [
        { key: "customer.created", label: "customer.created", desc: "New customer profile registered" },
        { key: "customer.updated", label: "customer.updated", desc: "Profile or address detail modified" },
        { key: "kyc.verified", label: "kyc.verified", desc: "Aadhaar/PAN document verification passed" }
      ]
    },
    {
      title: "Stock & Inventory Events",
      events: [
        { key: "stock.low_alert", label: "stock.low_alert", desc: "Gold/Diamond tag stock below threshold" },
        { key: "stock.adjusted", label: "stock.adjusted", desc: "Manual stock audit or weight adjustment" }
      ]
    },
    {
      title: "Payment Gateway Events",
      events: [
        { key: "payment.success", label: "payment.success", desc: "Online or card machine payment capture" },
        { key: "payment.failed", label: "payment.failed", desc: "Payment attempt failed or declined" },
        { key: "refund.processed", label: "refund.processed", desc: "Customer refund processed successfully" }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#111113] p-4 rounded-xl border border-[#1F1F24] flex items-center justify-between">
        <div>
          <h3 className="text-[16px] font-semibold text-platinum flex items-center gap-2">
            <Webhook className="w-5 h-5 text-indigo-400" />
            Outgoing Webhooks & Real-Time Event Stream
          </h3>
          <p className="text-[12px] text-platinum-muted mt-0.5">
            Push instant real-time event payloads for invoices, orders, stock alerts, and payment updates to external systems.
          </p>
        </div>
        <button className="px-3 py-1.5 rounded-lg bg-[#1F1F24] text-[12px] text-gold hover:bg-gold/10 transition-colors flex items-center gap-1.5 font-medium">
          <PlayCircle className="w-4 h-4" /> Send Test Webhook
        </button>
      </div>

      {/* Target URL & Secret */}
      <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-4">
        <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2 border-b border-[#1F1F24] pb-3">
          <Webhook className="w-4 h-4 text-gold" />
          Destination Endpoint Configuration
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-[12px] font-medium text-platinum block mb-1">Webhook Target URL</label>
            <input
              type="text"
              value={whConfig.endpointUrl || ""}
              onChange={(e) => updateProp("endpointUrl", e.target.value)}
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none font-mono"
            />
          </div>
          <div>
            <label className="text-[12px] font-medium text-platinum block mb-1">HMAC Signature Secret</label>
            <input
              type="password"
              value={whConfig.secretKey || ""}
              onChange={(e) => updateProp("secretKey", e.target.value)}
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none font-mono"
            />
          </div>
        </div>
      </div>

      {/* Event Selection Sub-sections */}
      <div className="space-y-4">
        {eventCategories.map(cat => (
          <div key={cat.title} className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-3">
            <h4 className="text-[13px] font-semibold text-gold border-b border-[#1F1F24] pb-2">
              {cat.title}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {cat.events.map(evt => {
                const isSubscribed = !!whConfig.events?.[evt.key];

                return (
                  <div
                    key={evt.key}
                    onClick={() => toggleEvent(evt.key)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isSubscribed
                        ? "bg-[#0A0A0B] border-gold/40 text-platinum"
                        : "bg-[#080809] border-[#1F1F24] text-platinum-muted opacity-70"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-mono font-semibold text-gold">{evt.label}</span>
                      <input
                        type="checkbox"
                        checked={isSubscribed}
                        onChange={() => {}} // handled by parent onClick
                        className="accent-gold w-3.5 h-3.5"
                      />
                    </div>
                    <p className="text-[10px] text-platinum-muted mt-1">{evt.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Retry Settings */}
      <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-4">
        <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2 border-b border-[#1F1F24] pb-3">
          <RefreshCw className="w-4 h-4 text-gold" />
          Delivery Retry & Backoff Configuration
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[12px] font-medium text-platinum block mb-1">Max Delivery Retries</label>
            <input
              type="number"
              value={whConfig.retrySettings?.maxRetries || 5}
              onChange={(e) => updateRetryProp("maxRetries", parseInt(e.target.value))}
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
            />
          </div>

          <div>
            <label className="text-[12px] font-medium text-platinum block mb-1">Initial Retry Interval (Seconds)</label>
            <input
              type="number"
              value={whConfig.retrySettings?.initialIntervalSeconds || 10}
              onChange={(e) => updateRetryProp("initialIntervalSeconds", parseInt(e.target.value))}
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
            />
          </div>

          <div className="flex flex-col justify-center pt-4">
            <label className="flex items-center gap-2 text-[12px] text-platinum cursor-pointer">
              <input
                type="checkbox"
                checked={!!whConfig.retrySettings?.exponentialBackoff}
                onChange={(e) => updateRetryProp("exponentialBackoff", e.target.checked)}
                className="accent-gold"
              />
              Exponential Backoff Strategy
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
