import React from "react";
import { BellRing, FileBarChart2 } from "lucide-react";

interface Props {
  config: any;
  updateConfig: (section: string, key: string, value: any) => void;
  isAdmin: boolean;
}

export default function AnalyticsAlertsTab({ config, updateConfig, isAdmin }: Props) {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* 16. Inventory Alerts */}
      <section className="space-y-4">
        <h3 className="text-[14px] font-medium text-platinum flex items-center gap-2">
          <BellRing className="w-4 h-4 text-[#C9943A]" />
          16. Inventory Alerts & Notifications
        </h3>
        <p className="text-[11px] text-platinum-muted">Select conditions that should trigger an alert for Admins/Managers.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-2">
          {[
            { key: 'lowStock', label: 'Low Stock Level' },
            { key: 'zeroStock', label: 'Zero Stock' },
            { key: 'negativeStock', label: 'Negative Stock Occurred' },
            { key: 'duplicateHuid', label: 'Duplicate HUID Attempt' },
            { key: 'duplicateBarcode', label: 'Duplicate Barcode Attempt' },
            { key: 'missingImage', label: 'Product Missing Image' },
            { key: 'missingCertificate', label: 'Missing Stone Certificate' },
          ].map(alert => (
            <label key={alert.key} className="flex items-center gap-3 p-2.5 rounded-lg border border-[#1F1F24] bg-[#111113]">
              <input type="checkbox" checked={config.alerts?.[alert.key] ?? true} onChange={e => {
                updateConfig('alerts', alert.key, e.target.checked);
              }} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4 shrink-0" />
              <span className="text-[11px] text-platinum">{alert.label}</span>
            </label>
          ))}
        </div>
      </section>

      {/* 18. Inventory Reports */}
      <section className="space-y-4 pt-4 border-t border-[#1F1F24]">
        <h3 className="text-[14px] font-medium text-platinum flex items-center gap-2">
          <FileBarChart2 className="w-4 h-4 text-[#C9943A]" />
          18. Available Reports
        </h3>
        <p className="text-[11px] text-platinum-muted">Enable or disable specific reports from appearing in the Reports dashboard.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-2">
          {[
            { key: 'productStock', label: 'Product Stock Report' },
            { key: 'inventoryLedger', label: 'Inventory Ledger' },
            { key: 'branchInventory', label: 'Branch Inventory' },
            { key: 'purityWise', label: 'Purity Wise Inventory' },
            { key: 'categoryWise', label: 'Category Wise Inventory' },
            { key: 'stoneInventory', label: 'Stone Inventory' },
            { key: 'huidReport', label: 'HUID Report' },
            { key: 'barcodeReport', label: 'Barcode Report' },
            { key: 'costReport', label: 'Cost & Valuation' },
            { key: 'transferHistory', label: 'Transfer History' },
            { key: 'stockAuditHistory', label: 'Stock Audit History' },
          ].map(report => (
            <label key={report.key} className="flex items-center gap-3 p-2.5 rounded-lg border border-[#1F1F24] bg-[#111113]">
              <input type="checkbox" checked={config.reports?.[report.key] ?? true} onChange={e => {
                updateConfig('reports', report.key, e.target.checked);
              }} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4 shrink-0" />
              <span className="text-[11px] text-platinum">{report.label}</span>
            </label>
          ))}
        </div>
      </section>

    </div>
  );
}
