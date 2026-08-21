"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useBranchStore } from "@/lib/store/useBranchStore";
import { Save, Loader2, Info } from "lucide-react";

export default function OrderBookSettingsPanel() {
  const { selectedBranch } = useBranchStore();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("numbering");

  useEffect(() => {
    if (!selectedBranch?.id) return;
    setLoading(true);
    axios.get(`/api/settings/order-book?branchId=${selectedBranch.id}`)
      .then((res) => {
        setSettings(res.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [selectedBranch]);

  const handleSave = async () => {
    if (!selectedBranch?.id || !settings) return;
    setSaving(true);
    try {
      await axios.put(`/api/settings/order-book`, {
        ...settings,
        branchId: selectedBranch.id,
      });
      alert("Settings saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (category: string, field: string, value: any) => {
    setSettings((prev: any) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-gold" /></div>;
  }

  if (!settings) return null;

  const tabs = [
    { id: "numbering", label: "Numbering & Lifecycle" },
    { id: "customer", label: "Customer & Items" },
    { id: "delivery", label: "Delivery & Karigar" },
    { id: "financial", label: "Advance & Financials" },
    { id: "cancellation", label: "Rules & Notes" },
    { id: "printing", label: "Printing & Dashboard" },
    { id: "advanced", label: "Docs, RBAC & Audit" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-semibold text-platinum">Order Book Configuration</h2>
          <p className="text-[13px] text-platinum-muted">Manage comprehensive rules, limits, and workflows for your bespoke orders.</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="flex items-center gap-2 bg-gold text-foreground px-6 py-2 rounded-lg font-medium text-[13px] hover:bg-gold/90 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Configuration
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-onyx-border">
        {tabs.map(t => (
          <button 
            key={t.id} 
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap ${activeTab === t.id ? "bg-onyx-surface text-gold border border-gold/30" : "text-platinum-muted hover:text-platinum hover:bg-onyx-surface/50"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-6 max-w-4xl pb-20">
        
        {/* NUMBERING & LIFECYCLE */}
        {activeTab === "numbering" && (
          <>
            <Section title="Order Numbering">
              <Toggle label="Auto Generate Order Number" val={settings.numberingSettings?.autoGenerateOrderNumber} onChange={(v) => updateSetting("numberingSettings", "autoGenerateOrderNumber", v)} />
              <Input label="Order Prefix (e.g. ORD-, BK-)" val={settings.numberingSettings?.prefix} onChange={(v) => updateSetting("numberingSettings", "prefix", v)} />
              <Toggle label="Financial Year Reset" val={settings.numberingSettings?.financialYearReset} onChange={(v) => updateSetting("numberingSettings", "financialYearReset", v)} />
              <Toggle label="Branch-wise Numbering" val={settings.numberingSettings?.branchWiseNumbering} onChange={(v) => updateSetting("numberingSettings", "branchWiseNumbering", v)} />
              
              <div className="h-px bg-onyx-border my-4" />
              <h4 className="text-[13px] font-semibold text-platinum mb-3">Slip Numbering</h4>
              <Toggle label="Auto Generate Slip Number" val={settings.numberingSettings?.autoGenerateSlipNumber} onChange={(v) => updateSetting("numberingSettings", "autoGenerateSlipNumber", v)} />
              <Toggle label="Separate Customer Slip Series" val={settings.numberingSettings?.separateCustomerSlipSeries} onChange={(v) => updateSetting("numberingSettings", "separateCustomerSlipSeries", v)} />
              <Toggle label="Separate Workshop Slip Series" val={settings.numberingSettings?.separateWorkshopSlipSeries} onChange={(v) => updateSetting("numberingSettings", "separateWorkshopSlipSeries", v)} />
            </Section>

            <Section title="Order Lifecycle">
              <Select label="Default Status" val={settings.lifecycleSettings?.defaultStatus} options={["CREATED", "ASSIGNED", "IN_PROGRESS", "COMPLETED", "DELIVERED", "CANCELLED"]} onChange={(v) => updateSetting("lifecycleSettings", "defaultStatus", v)} />
              <Toggle label="Auto Status Change (e.g., automatically advance when karigar starts)" val={settings.lifecycleSettings?.autoStatusChange} onChange={(v) => updateSetting("lifecycleSettings", "autoStatusChange", v)} />
              <Toggle label="Require Remarks Before Cancellation" val={settings.lifecycleSettings?.requireRemarksBeforeCancel} onChange={(v) => updateSetting("lifecycleSettings", "requireRemarksBeforeCancel", v)} />
              <Toggle label="Allow Reopen Completed Order" val={settings.lifecycleSettings?.allowReopenCompleted} onChange={(v) => updateSetting("lifecycleSettings", "allowReopenCompleted", v)} />
              <Toggle label="Allow Reopen Delivered Order" val={settings.lifecycleSettings?.allowReopenDelivered} onChange={(v) => updateSetting("lifecycleSettings", "allowReopenDelivered", v)} />
            </Section>
          </>
        )}

        {/* CUSTOMER & ITEMS */}
        {activeTab === "customer" && (
          <>
            <Section title="Customer Settings">
              <Toggle label="Allow Existing Customer Search" val={settings.customerSettings?.allowExistingSearch} onChange={(v) => updateSetting("customerSettings", "allowExistingSearch", v)} />
              <Toggle label="Allow Quick Customer Creation" val={settings.customerSettings?.quickCreation} onChange={(v) => updateSetting("customerSettings", "quickCreation", v)} />
              <Toggle label="Allow Guest Customer (No profile created)" val={settings.customerSettings?.guestCustomer} onChange={(v) => updateSetting("customerSettings", "guestCustomer", v)} />
              <Toggle label="Duplicate Mobile Warning" val={settings.customerSettings?.duplicateWarning} onChange={(v) => updateSetting("customerSettings", "duplicateWarning", v)} />
              <Toggle label="Duplicate Customer Merge" val={settings.customerSettings?.duplicateMerge} onChange={(v) => updateSetting("customerSettings", "duplicateMerge", v)} />
            </Section>

            <Section title="Multi Item Settings">
              <Input label="Max Items Per Order (0 = unlimited)" type="number" val={settings.multiItemSettings?.maxItemsPerOrder} onChange={(v) => updateSetting("multiItemSettings", "maxItemsPerOrder", Number(v))} />
              <Toggle label="Allow Duplicate Category in same order (e.g. Ring & Ring)" val={settings.multiItemSettings?.allowDuplicateCategory} onChange={(v) => updateSetting("multiItemSettings", "allowDuplicateCategory", v)} />
            </Section>

            <Section title="Design Reference Settings">
              <h4 className="text-[13px] font-semibold text-platinum mb-3">Images</h4>
              <Toggle label="Enable Image Upload" val={settings.designSettings?.enableImages} onChange={(v) => updateSetting("designSettings", "enableImages", v)} />
              <Input label="Max Images Per Item" type="number" val={settings.designSettings?.maxImages} onChange={(v) => updateSetting("designSettings", "maxImages", Number(v))} />
              <Input label="Max File Size (MB)" type="number" val={settings.designSettings?.maxFileSize} onChange={(v) => updateSetting("designSettings", "maxFileSize", Number(v))} />
              
              <div className="h-px bg-onyx-border my-4" />
              <h4 className="text-[13px] font-semibold text-platinum mb-3">Voice Notes</h4>
              <Toggle label="Enable Voice Recording" val={settings.designSettings?.enableVoice} onChange={(v) => updateSetting("designSettings", "enableVoice", v)} />
              <Input label="Max Recording Time (seconds)" type="number" val={settings.designSettings?.maxRecordingTime} onChange={(v) => updateSetting("designSettings", "maxRecordingTime", Number(v))} />
              <Toggle label="Allow Multiple Recordings" val={settings.designSettings?.allowMultipleRecordings} onChange={(v) => updateSetting("designSettings", "allowMultipleRecordings", v)} />
            </Section>
          </>
        )}

        {/* DELIVERY & KARIGAR */}
        {activeTab === "delivery" && (
          <>
            <Section title="Delivery Settings">
              <Input label="Default Delivery Days" type="number" val={settings.deliverySettings?.defaultDeliveryDays} onChange={(v) => updateSetting("deliverySettings", "defaultDeliveryDays", Number(v))} />
              <Toggle label="Allow Custom Priority (Standard, Urgent, Rush)" val={settings.deliverySettings?.allowCustomPriority} onChange={(v) => updateSetting("deliverySettings", "allowCustomPriority", v)} />
              <Toggle label="Working Days Only (Holiday Calendar Check)" val={settings.deliverySettings?.workingDaysOnly} onChange={(v) => updateSetting("deliverySettings", "workingDaysOnly", v)} />
              <Toggle label="Enable Overdue Alerts" val={settings.deliverySettings?.overdueAlerts} onChange={(v) => updateSetting("deliverySettings", "overdueAlerts", v)} />
            </Section>

            <Section title="Karigar Assignment">
              <Toggle label="Auto Assignment via Rules" val={settings.karigarAssignment?.autoAssignment} onChange={(v) => updateSetting("karigarAssignment", "autoAssignment", v)} />
              <Toggle label="Allow Reassigning Karigar" val={settings.karigarAssignment?.allowReassign} onChange={(v) => updateSetting("karigarAssignment", "allowReassign", v)} />
              <Toggle label="Require Reason for Reassignment" val={settings.karigarAssignment?.requireReason} onChange={(v) => updateSetting("karigarAssignment", "requireReason", v)} />
              <Toggle label="Track Assignment History" val={settings.karigarAssignment?.trackHistory} onChange={(v) => updateSetting("karigarAssignment", "trackHistory", v)} />
              <Toggle label="Only Show Active Karigars" val={settings.karigarAssignment?.onlyActive} onChange={(v) => updateSetting("karigarAssignment", "onlyActive", v)} />
              <Toggle label="Show Department Filter (Gold/Silver)" val={settings.karigarAssignment?.showDepartmentFilter} onChange={(v) => updateSetting("karigarAssignment", "showDepartmentFilter", v)} />
            </Section>
          </>
        )}

        {/* FINANCIALS */}
        {activeTab === "financial" && (
          <>
            <Section title="Advance Settings">
              <h4 className="text-[13px] font-semibold text-platinum mb-3">Cash Advance</h4>
              <Toggle label="Enable Cash Advance" val={settings.advanceSettings?.cashAdvanceEnable} onChange={(v) => updateSetting("advanceSettings", "cashAdvanceEnable", v)} />
              <Input label="Minimum Advance %" type="number" val={settings.advanceSettings?.minAdvancePercent} onChange={(v) => updateSetting("advanceSettings", "minAdvancePercent", Number(v))} />
              <Input label="Maximum Advance %" type="number" val={settings.advanceSettings?.maxAdvancePercent} onChange={(v) => updateSetting("advanceSettings", "maxAdvancePercent", Number(v))} />
              <Toggle label="Reference Number Mandatory (for non-cash)" val={settings.advanceSettings?.referenceNumberMandatory} onChange={(v) => updateSetting("advanceSettings", "referenceNumberMandatory", v)} />
              
              <div className="h-px bg-onyx-border my-4" />
              <h4 className="text-[13px] font-semibold text-platinum mb-3">Metal Advance</h4>
              <Toggle label="Enable Metal Advance" val={settings.advanceSettings?.metalAdvanceEnable} onChange={(v) => updateSetting("advanceSettings", "metalAdvanceEnable", v)} />
              <Toggle label="Require Metal Purity" val={settings.advanceSettings?.requirePurity} onChange={(v) => updateSetting("advanceSettings", "requirePurity", v)} />
              <Toggle label="Require Rate" val={settings.advanceSettings?.requireRate} onChange={(v) => updateSetting("advanceSettings", "requireRate", v)} />
              <Toggle label="Allow Multiple Advances" val={settings.advanceSettings?.allowMultipleAdvances} onChange={(v) => updateSetting("advanceSettings", "allowMultipleAdvances", v)} />
              <Toggle label="Auto Update Customer Metal Balance" val={settings.advanceSettings?.autoUpdateCustomerMetalBalance} onChange={(v) => updateSetting("advanceSettings", "autoUpdateCustomerMetalBalance", v)} />
            </Section>

            <Section title="Booking Financial Rules">
              <Toggle label="Mixed Advance Allowed (Cash + Metal)" val={settings.financialRules?.mixedAdvanceAllowed} onChange={(v) => updateSetting("financialRules", "mixedAdvanceAllowed", v)} />
              <Toggle label="Auto Calculate Total Advance" val={settings.financialRules?.autoCalculateTotalAdvance} onChange={(v) => updateSetting("financialRules", "autoCalculateTotalAdvance", v)} />
              <Input label="Booking Expiry (Days)" type="number" val={settings.financialRules?.bookingExpiryDays} onChange={(v) => updateSetting("financialRules", "bookingExpiryDays", Number(v))} />
            </Section>
          </>
        )}

        {/* CANCELLATION & NOTES */}
        {activeTab === "cancellation" && (
          <>
            <Section title="Cancellation Rules">
              <Toggle label="Allow Order Cancellation" val={settings.cancellationRules?.allowCancellation} onChange={(v) => updateSetting("cancellationRules", "allowCancellation", v)} />
              <Toggle label="Require Cancellation Reason" val={settings.cancellationRules?.requireReason} onChange={(v) => updateSetting("cancellationRules", "requireReason", v)} />
              <Input label="Cancellation Charges (%)" type="number" val={settings.cancellationRules?.cancellationCharges} onChange={(v) => updateSetting("cancellationRules", "cancellationCharges", Number(v))} />
              <Toggle label="Restore Inventory on Cancel" val={settings.cancellationRules?.restoreInventory} onChange={(v) => updateSetting("cancellationRules", "restoreInventory", v)} />
              <Toggle label="Release Reserved Stock" val={settings.cancellationRules?.releaseReservedStock} onChange={(v) => updateSetting("cancellationRules", "releaseReservedStock", v)} />
              <Toggle label="Return Metal Advance" val={settings.cancellationRules?.returnMetalAdvance} onChange={(v) => updateSetting("cancellationRules", "returnMetalAdvance", v)} />
              <Toggle label="Return Wallet Balance" val={settings.cancellationRules?.returnWalletBalance} onChange={(v) => updateSetting("cancellationRules", "returnWalletBalance", v)} />
            </Section>

            <Section title="Order Notes Visibility">
              <Toggle label="Customer Notes Visible on Slip" val={settings.orderNotesSettings?.visibilityCustomer} onChange={(v) => updateSetting("orderNotesSettings", "visibilityCustomer", v)} />
              <Toggle label="Workshop Notes Visible to Karigar" val={settings.orderNotesSettings?.visibilityWorkshop} onChange={(v) => updateSetting("orderNotesSettings", "visibilityWorkshop", v)} />
              <Toggle label="Enable Internal Notes" val={settings.orderNotesSettings?.visibilityInternalOnly} onChange={(v) => updateSetting("orderNotesSettings", "visibilityInternalOnly", v)} />
            </Section>
          </>
        )}

        {/* PRINTING */}
        {activeTab === "printing" && (
          <>
            <Section title="Dashboard Display Cards">
              <p className="text-[11px] text-platinum-muted mb-3 flex items-center gap-2"><Info className="w-3 h-3" /> Select which metric cards show up on the Order Book dashboard.</p>
              {["Total Orders", "Active Orders", "Pending Delivery", "Metal In Process", "Total Booking Value", "Urgent Orders", "Today's Orders", "Karigar Workload"].map(card => {
                const checked = settings.dashboardSettings?.enableCards?.includes(card) || false;
                return (
                  <Toggle key={card} label={`Show '${card}' Card`} val={checked} onChange={(v) => {
                    const cards = settings.dashboardSettings?.enableCards || [];
                    updateSetting("dashboardSettings", "enableCards", v ? [...cards, card] : cards.filter((c: string) => c !== card));
                  }} />
                );
              })}
            </Section>
          </>
        )}

        {/* ADVANCED */}
        {activeTab === "advanced" && (
          <>
             <Section title="Document Requirements (To finalize order)">
              <Toggle label="Require Reference Images" val={settings.documentSettings?.requireReferenceImages} onChange={(v) => updateSetting("documentSettings", "requireReferenceImages", v)} />
              <Toggle label="Require Voice Notes" val={settings.documentSettings?.requireVoiceNotes} onChange={(v) => updateSetting("documentSettings", "requireVoiceNotes", v)} />
              <Toggle label="Require Customer Signature" val={settings.documentSettings?.requireCustomerSignature} onChange={(v) => updateSetting("documentSettings", "requireCustomerSignature", v)} />
            </Section>

            <Section title="Role-Based Access (Manager Permissions)">
              <p className="text-[11px] text-platinum-muted mb-3 flex items-center gap-2"><Info className="w-3 h-3" /> Admins have full access. Configure what Managers are allowed to do.</p>
              <Toggle label="Can Delete Orders" val={settings.rbacSettings?.managerCanDeleteOrders} onChange={(v) => updateSetting("rbacSettings", "managerCanDeleteOrders", v)} />
              <Toggle label="Can Modify Settings" val={settings.rbacSettings?.managerCanModifySettings} onChange={(v) => updateSetting("rbacSettings", "managerCanModifySettings", v)} />
              <Toggle label="Can Force Close Orders" val={settings.rbacSettings?.managerCanForceCloseOrders} onChange={(v) => updateSetting("rbacSettings", "managerCanForceCloseOrders", v)} />
              <Toggle label="Can Restore Deleted Orders" val={settings.rbacSettings?.managerCanRestoreDeletedOrders} onChange={(v) => updateSetting("rbacSettings", "managerCanRestoreDeletedOrders", v)} />
              <Toggle label="Can Edit Old Closed Orders" val={settings.rbacSettings?.managerCanEditOldClosedOrders} onChange={(v) => updateSetting("rbacSettings", "managerCanEditOldClosedOrders", v)} />
              <Toggle label="Can View Other Branch Orders" val={settings.rbacSettings?.managerCanViewOtherBranchOrders} onChange={(v) => updateSetting("rbacSettings", "managerCanViewOtherBranchOrders", v)} />
            </Section>
            
            <Section title="Audit Tracking (Events to log)">
              <Toggle label="Track Status Changes" val={settings.auditSettings?.trackStatusChange} onChange={(v) => updateSetting("auditSettings", "trackStatusChange", v)} />
              <Toggle label="Track Advance Edited" val={settings.auditSettings?.trackAdvanceEdited} onChange={(v) => updateSetting("auditSettings", "trackAdvanceEdited", v)} />
              <Toggle label="Track Karigar Changed" val={settings.auditSettings?.trackKarigarChanged} onChange={(v) => updateSetting("auditSettings", "trackKarigarChanged", v)} />
              <Toggle label="Track Delivery Date Changed" val={settings.auditSettings?.trackDeliveryChanged} onChange={(v) => updateSetting("auditSettings", "trackDeliveryChanged", v)} />
              <Toggle label="Track Items Edited (Images/Specs)" val={settings.auditSettings?.trackItemEdited} onChange={(v) => updateSetting("auditSettings", "trackItemEdited", v)} />
            </Section>
          </>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="bg-onyx-surface rounded-xl border border-onyx-border p-5">
      <h3 className="text-[14px] font-semibold text-gold uppercase tracking-wider mb-4">{title}</h3>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

function Toggle({ label, val, onChange }: { label: string, val: boolean, onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <span className="text-[13px] text-platinum">{label}</span>
      <div className={`w-9 h-5 rounded-full transition-colors relative ${val ? 'bg-gold' : 'bg-onyx-border'}`}>
        <div className={`absolute top-1 w-3 h-3 rounded-full bg-onyx transition-all ${val ? 'left-5' : 'left-1'}`} />
      </div>
      <input type="checkbox" checked={val || false} onChange={(e) => onChange(e.target.checked)} className="hidden" />
    </label>
  );
}

function Input({ label, type = "text", val, onChange }: { label: string, type?: string, val: string | number, onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-[11px] font-medium text-platinum-muted uppercase tracking-wider mb-1 block">{label}</label>
      <input 
        type={type} 
        value={val || ""} 
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 px-3 rounded-lg bg-onyx border border-onyx-border text-[13px] text-platinum focus:outline-none focus:border-gold/50 transition-colors"
      />
    </div>
  );
}

function Select({ label, options, val, onChange }: { label: string, options: string[], val: string, onChange: (v: string) => void }) {
  return (
    <div>
      <label className="text-[11px] font-medium text-platinum-muted uppercase tracking-wider mb-1 block">{label}</label>
      <select 
        value={val || ""} 
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 px-3 rounded-lg bg-onyx border border-onyx-border text-[13px] text-platinum focus:outline-none focus:border-gold/50 transition-colors appearance-none"
      >
        <option value="">Select...</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
