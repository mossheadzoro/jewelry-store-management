"use client";

import React from "react";
import { Printer, QrCode, Monitor, HardDrive, CheckCircle2, Sliders, Cpu } from "lucide-react";

interface PrinterHardwareTabProps {
  config: any;
  updateConfig: (section: string, key: string, value: any) => void;
  isAdmin: boolean;
}

export default function PrinterHardwareTab({ config, updateConfig, isAdmin }: PrinterHardwareTabProps) {
  const hwConfig = config?.printerHardware || {
    thermalPrinter: { name: "Epson TM-T88VI (POS 80mm)", interface: "usb", ipAddress: "192.168.1.100", paperWidth: "80mm", autoCut: true },
    labelPrinter: { name: "Zebra ZD421 (Jewelry Tag Printer)", paperSize: "38x12mm", printDensity: 12, dpi: 300 },
    barcodeScanner: { mode: "usb_hid", prefixKey: "", suffixKey: "ENTER", beepSound: true },
    qrScanner: { supportDynamicUpiQr: true, scanDelayMs: 200 },
    cashDrawer: { enabled: true, triggerMode: "printer_kickout", pinCode: "255" },
    customerDisplay: { enabled: true, mode: "secondary_screen", line1Format: "TOTAL: {TOTAL}", line2Format: "WELCOME TO ROYAL JEWELS" },
    weighingScale: { enabled: true, comPort: "COM3", baudRate: 9600, tareAutoReset: true, unit: "grams" }
  };

  const updateSubProp = (section: string, key: string, val: any) => {
    updateConfig("printerHardware", section, {
      ...(hwConfig[section] || {}),
      [key]: val
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#111113] p-4 rounded-xl border border-[#1F1F24] flex items-center justify-between">
        <div>
          <h3 className="text-[16px] font-semibold text-platinum flex items-center gap-2">
            <Printer className="w-5 h-5 text-gold" />
            Printer & Counter Hardware Integration
          </h3>
          <p className="text-[12px] text-platinum-muted mt-0.5">
            Configure thermal receipt printers, tag label printers, USB/Serial weighing scales, barcode scanners, and customer displays.
          </p>
        </div>
        <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-gold/10 text-gold border border-gold/30 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" /> 7 Peripherals Connected
        </span>
      </div>

      {/* Grid of Hardware Modules */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Thermal Printer */}
        <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-3">
          <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2 border-b border-[#1F1F24] pb-2">
            <Printer className="w-4 h-4 text-gold" /> Thermal POS Receipt Printer
          </h4>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-platinum-muted block mb-1">Printer Model / Name</label>
              <input
                type="text"
                value={hwConfig.thermalPrinter?.name || ""}
                onChange={(e) => updateSubProp("thermalPrinter", "name", e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-platinum-muted block mb-1">Connection Port</label>
                <select
                  value={hwConfig.thermalPrinter?.interface || "usb"}
                  onChange={(e) => updateSubProp("thermalPrinter", "interface", e.target.value)}
                  className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none"
                >
                  <option value="usb">USB Direct</option>
                  <option value="network">Ethernet LAN (IP)</option>
                  <option value="bluetooth">Bluetooth Wireless</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] text-platinum-muted block mb-1">Paper Roll Width</label>
                <select
                  value={hwConfig.thermalPrinter?.paperWidth || "80mm"}
                  onChange={(e) => updateSubProp("thermalPrinter", "paperWidth", e.target.value)}
                  className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none"
                >
                  <option value="80mm">80mm (3 Inch)</option>
                  <option value="58mm">58mm (2 Inch)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Jewelry Label Printer */}
        <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-3">
          <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2 border-b border-[#1F1F24] pb-2">
            <Printer className="w-4 h-4 text-gold" /> Jewelry Tag Barcode Printer
          </h4>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-platinum-muted block mb-1">Tag Printer Model (Zebra/TSC/Citizen)</label>
              <input
                type="text"
                value={hwConfig.labelPrinter?.name || ""}
                onChange={(e) => updateSubProp("labelPrinter", "name", e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-platinum-muted block mb-1">Dumbbell Tag Size</label>
                <input
                  type="text"
                  value={hwConfig.labelPrinter?.paperSize || "38x12mm"}
                  onChange={(e) => updateSubProp("labelPrinter", "paperSize", e.target.value)}
                  className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-platinum-muted block mb-1">DPI Resolution</label>
                <select
                  value={hwConfig.labelPrinter?.dpi || 300}
                  onChange={(e) => updateSubProp("labelPrinter", "dpi", parseInt(e.target.value))}
                  className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none"
                >
                  <option value={203}>203 DPI</option>
                  <option value={300}>300 DPI (High Precision)</option>
                  <option value={600}>600 DPI (Micro Tags)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Electronic Weighing Scale */}
        <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-3">
          <div className="flex items-center justify-between border-b border-[#1F1F24] pb-2">
            <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2">
              <Cpu className="w-4 h-4 text-gold" /> Precision Weighing Scale (COM Port)
            </h4>
            <input
              type="checkbox"
              checked={!!hwConfig.weighingScale?.enabled}
              onChange={(e) => updateSubProp("weighingScale", "enabled", e.target.checked)}
              className="accent-gold w-4 h-4"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="text-[11px] text-platinum-muted block mb-1">COM Port / TTY Path</label>
              <input
                type="text"
                value={hwConfig.weighingScale?.comPort || "COM3"}
                onChange={(e) => updateSubProp("weighingScale", "comPort", e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-[11px] text-platinum-muted block mb-1">Baud Rate</label>
              <select
                value={hwConfig.weighingScale?.baudRate || 9600}
                onChange={(e) => updateSubProp("weighingScale", "baudRate", parseInt(e.target.value))}
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none font-mono"
              >
                <option value={4800}>4800</option>
                <option value={9600}>9600</option>
                <option value={19200}>19200</option>
              </select>
            </div>
          </div>
        </div>

        {/* 4. Barcode & QR Scanners */}
        <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-3">
          <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2 border-b border-[#1F1F24] pb-2">
            <QrCode className="w-4 h-4 text-gold" /> Barcode & 2D QR Scanner Setup
          </h4>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <label className="text-[11px] text-platinum-muted block mb-1">Scanner Connection Mode</label>
              <select
                value={hwConfig.barcodeScanner?.mode || "usb_hid"}
                onChange={(e) => updateSubProp("barcodeScanner", "mode", e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none"
              >
                <option value="usb_hid">USB Keyboard Emulation (HID)</option>
                <option value="virtual_com">Virtual Serial COM Port</option>
              </select>
            </div>
            <div>
              <label className="text-[11px] text-platinum-muted block mb-1">Suffix Key Trigger</label>
              <input
                type="text"
                value={hwConfig.barcodeScanner?.suffixKey || "ENTER"}
                onChange={(e) => updateSubProp("barcodeScanner", "suffixKey", e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none font-mono"
              />
            </div>
          </div>
        </div>

        {/* 5. Cash Drawer & Customer Display */}
        <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-3 md:col-span-2">
          <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2 border-b border-[#1F1F24] pb-2">
            <Monitor className="w-4 h-4 text-gold" /> Cash Drawer Kickout & Customer Display Screen
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="p-3 rounded-lg bg-[#0A0A0B] border border-[#1F1F24] flex items-center justify-between">
              <div>
                <p className="text-[12px] font-medium text-platinum">Auto Open Cash Drawer on Cash Sale</p>
                <p className="text-[10px] text-platinum-muted">Sends RJ11 pulse signal via printer port</p>
              </div>
              <input
                type="checkbox"
                checked={!!hwConfig.cashDrawer?.enabled}
                onChange={(e) => updateSubProp("cashDrawer", "enabled", e.target.checked)}
                className="accent-gold w-4 h-4"
              />
            </div>

            <div className="p-3 rounded-lg bg-[#0A0A0B] border border-[#1F1F24] flex items-center justify-between">
              <div>
                <p className="text-[12px] font-medium text-platinum">Enable Customer Dual Display Screen</p>
                <p className="text-[10px] text-platinum-muted">Show cart itemization & dynamic UPI QR</p>
              </div>
              <input
                type="checkbox"
                checked={!!hwConfig.customerDisplay?.enabled}
                onChange={(e) => updateSubProp("customerDisplay", "enabled", e.target.checked)}
                className="accent-gold w-4 h-4"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
