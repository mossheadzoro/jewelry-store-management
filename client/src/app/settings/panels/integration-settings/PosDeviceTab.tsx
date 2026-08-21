"use client";

import React from "react";
import { Monitor, CreditCard, Fingerprint, Printer, CheckCircle2, Key } from "lucide-react";

interface PosDeviceTabProps {
  config: any;
  updateConfig: (section: string, key: string, value: any) => void;
  isAdmin: boolean;
}

export default function PosDeviceTab({ config, updateConfig, isAdmin }: PosDeviceTabProps) {
  const posConfig = config?.posDevice || {
    cardMachine: { provider: "pinelabs", terminalId: "PL_T_99201", ipAddress: "192.168.1.150", autoAmountPush: true },
    paymentTerminal: { provider: "paytm_pos", merchantId: "PTM_M_10928", soundboxConnected: true },
    biometricDevice: { brand: "mantra", model: "MFS100", purpose: "staff_login_and_customer_kyc", sdkStatus: "ready" },
    receiptPrinter: { directEscPos: true, commandStream: "ESC/POS Native" }
  };

  const updateSubProp = (section: string, key: string, val: any) => {
    updateConfig("posDevice", section, {
      ...(posConfig[section] || {}),
      [key]: val
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#111113] p-4 rounded-xl border border-[#1F1F24] flex items-center justify-between">
        <div>
          <h3 className="text-[16px] font-semibold text-platinum flex items-center gap-2">
            <Monitor className="w-5 h-5 text-purple-400" />
            POS Terminal & Smart Device Integration
          </h3>
          <p className="text-[12px] text-platinum-muted mt-0.5">
            Integrate Pine Labs / Paytm Card swiping machines, biometric fingerprint scanners, and ESC/POS receipt stream printers.
          </p>
        </div>
        <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" /> POS Terminals Ready
        </span>
      </div>

      {/* Grid of POS Devices */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Card Machine */}
        <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-3">
          <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2 border-b border-[#1F1F24] pb-2">
            <CreditCard className="w-4 h-4 text-gold" /> Card Machine (Pine Labs / EDC Swiper)
          </h4>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-platinum-muted block mb-1">Terminal Brand / Provider</label>
              <select
                value={posConfig.cardMachine?.provider || "pinelabs"}
                onChange={(e) => updateSubProp("cardMachine", "provider", e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none"
              >
                <option value="pinelabs">Pine Labs Smart EDC</option>
                <option value="paytm_pos">Paytm POS Terminal</option>
                <option value="mosambee">Mosambee POS</option>
                <option value="mswipe">Mswipe Merchant Terminal</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-platinum-muted block mb-1">Terminal ID (TID)</label>
                <input
                  type="text"
                  value={posConfig.cardMachine?.terminalId || ""}
                  onChange={(e) => updateSubProp("cardMachine", "terminalId", e.target.value)}
                  className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-platinum-muted block mb-1">Terminal IP Address</label>
                <input
                  type="text"
                  value={posConfig.cardMachine?.ipAddress || ""}
                  onChange={(e) => updateSubProp("cardMachine", "ipAddress", e.target.value)}
                  className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. Biometric Device */}
        <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-3">
          <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2 border-b border-[#1F1F24] pb-2">
            <Fingerprint className="w-4 h-4 text-gold" /> Biometric Fingerprint Scanner
          </h4>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-platinum-muted block mb-1">Device Brand & SDK</label>
              <select
                value={posConfig.biometricDevice?.brand || "mantra"}
                onChange={(e) => updateSubProp("biometricDevice", "brand", e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none"
              >
                <option value="mantra">Mantra MFS100 / MIS100</option>
                <option value="morpho">Morpho MSO1300 E3</option>
                <option value="secugen">SecuGen Hamster Pro</option>
                <option value="startek">Startek FM220U</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-platinum-muted block mb-1">Usage Purpose</label>
              <select
                value={posConfig.biometricDevice?.purpose || "staff_login_and_customer_kyc"}
                onChange={(e) => updateSubProp("biometricDevice", "purpose", e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none"
              >
                <option value="staff_login_and_customer_kyc">Staff Attendance & Customer Aadhaar KYC</option>
                <option value="staff_login_only">Staff Biometric Login Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. Direct Receipt Printer ESC/POS */}
        <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-3 md:col-span-2">
          <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2 border-b border-[#1F1F24] pb-2">
            <Printer className="w-4 h-4 text-gold" /> ESC/POS Command Direct Stream
          </h4>
          <div className="flex items-center justify-between p-3 rounded-lg bg-[#0A0A0B] border border-[#1F1F24]">
            <div>
              <p className="text-[13px] font-medium text-platinum">Direct ESC/POS Raw Byte Stream Printing</p>
              <p className="text-[11px] text-platinum-muted">Bypasses browser print dialog for instant 0.1-second bill printing</p>
            </div>
            <input
              type="checkbox"
              checked={!!posConfig.receiptPrinter?.directEscPos}
              onChange={(e) => updateSubProp("receiptPrinter", "directEscPos", e.target.checked)}
              className="accent-gold w-4 h-4"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
