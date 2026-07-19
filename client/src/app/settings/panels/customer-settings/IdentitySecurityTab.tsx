import React from "react";
import { ShieldCheck, UserCheck, Lock, FileText } from "lucide-react";

interface Props {
  config: any;
  updateConfig: (section: string, key: string, value: any) => void;
  isAdmin: boolean;
}

export default function IdentitySecurityTab({ config, updateConfig, isAdmin }: Props) {
  const infoFields = [
    { key: "mobile", label: "Mobile Number" },
    { key: "email", label: "Email Address" },
    { key: "dob", label: "Date of Birth" },
    { key: "anniversary", label: "Anniversary" },
    { key: "gender", label: "Gender" },
    { key: "address", label: "Address" },
    { key: "city", label: "City" },
    { key: "state", label: "State" },
    { key: "pinCode", label: "PIN Code" },
    { key: "occupation", label: "Occupation" },
    { key: "referenceSource", label: "Reference Source" },
    { key: "customerPhoto", label: "Customer Photo" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Registration Section */}
      <section className="space-y-4">
        <h3 className="text-[14px] font-medium text-platinum flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-[#C9943A]" />
          1. Customer Registration
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.registration?.customerRegistrationRequired ?? true} onChange={e => updateConfig('registration', 'customerRegistrationRequired', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Customer Registration Required</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.registration?.walkInCustomerAllowed ?? true} onChange={e => updateConfig('registration', 'walkInCustomerAllowed', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Walk-in Customer Allowed</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.registration?.guestBillingAllowed ?? false} onChange={e => updateConfig('registration', 'guestBillingAllowed', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Guest Billing Allowed</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.registration?.autoCustomerIdGeneration ?? true} onChange={e => updateConfig('registration', 'autoCustomerIdGeneration', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Auto Customer ID Gen</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.registration?.manualCustomerIdAllowed ?? false} onChange={e => updateConfig('registration', 'manualCustomerIdAllowed', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Manual Customer ID</span>
          </label>
          <div className="space-y-1.5 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <span className="text-[11px] text-platinum-muted block">Customer Code Prefix</span>
            <input type="text" value={config.registration?.customerCodePrefix ?? "CUST"} onChange={e => updateConfig('registration', 'customerCodePrefix', e.target.value)} disabled={!isAdmin} className="w-full h-8 px-2 bg-[#0A0A0B] border border-[#1F1F24] rounded text-[12px] text-platinum outline-none focus:border-[#C9943A]/50" />
          </div>
        </div>
      </section>

      {/* Information Fields */}
      <section className="space-y-4 pt-4 border-t border-[#1F1F24]">
        <h3 className="text-[14px] font-medium text-platinum flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#C9943A]" />
          2. Customer Information Requirements
        </h3>
        <p className="text-[11px] text-platinum-muted">Select whether these fields are mandatory, optional, or hidden during registration.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {infoFields.map(field => (
            <div key={field.key} className="space-y-1.5">
              <label className="text-[11px] text-platinum">{field.label}</label>
              <select 
                value={config.informationFields?.[field.key] ?? "optional"} 
                onChange={e => updateConfig('informationFields', field.key, e.target.value)} 
                disabled={!isAdmin}
                className="w-full h-8 px-2 bg-[#111113] border border-[#1F1F24] rounded text-[12px] text-platinum outline-none focus:border-[#C9943A]/50"
              >
                <option value="mandatory">Mandatory</option>
                <option value="optional">Optional</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>
          ))}
        </div>
      </section>

      {/* KYC */}
      <section className="space-y-4 pt-4 border-t border-[#1F1F24]">
        <h3 className="text-[14px] font-medium text-platinum flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#C9943A]" />
          3. KYC Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <span className="text-[11px] text-platinum-muted block">PAN Mandatory Above (₹)</span>
            <input type="number" value={config.kyc?.panMandatoryAbove ?? 200000} onChange={e => updateConfig('kyc', 'panMandatoryAbove', Number(e.target.value))} disabled={!isAdmin} className="w-full h-8 px-2 bg-[#0A0A0B] border border-[#1F1F24] rounded text-[12px] text-platinum outline-none focus:border-[#C9943A]/50" />
          </div>
          <div className="space-y-1.5 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <span className="text-[11px] text-platinum-muted block">Aadhaar Collection</span>
            <select value={config.kyc?.aadhaarCollection ?? "optional"} onChange={e => updateConfig('kyc', 'aadhaarCollection', e.target.value)} disabled={!isAdmin} className="w-full h-8 px-2 bg-[#0A0A0B] border border-[#1F1F24] rounded text-[12px] text-platinum outline-none focus:border-[#C9943A]/50">
              <option value="mandatory">Mandatory</option>
              <option value="optional">Optional</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
          <div className="space-y-1.5 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <span className="text-[11px] text-platinum-muted block">GSTIN (Business Customers)</span>
            <select value={config.kyc?.gstinCollection ?? "optional"} onChange={e => updateConfig('kyc', 'gstinCollection', e.target.value)} disabled={!isAdmin} className="w-full h-8 px-2 bg-[#0A0A0B] border border-[#1F1F24] rounded text-[12px] text-platinum outline-none focus:border-[#C9943A]/50">
              <option value="mandatory">Mandatory</option>
              <option value="optional">Optional</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
          
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.kyc?.panVerification ?? true} onChange={e => updateConfig('kyc', 'panVerification', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Live PAN Verification</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.kyc?.uploadKycDocs ?? false} onChange={e => updateConfig('kyc', 'uploadKycDocs', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Upload KYC Documents</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.kyc?.customerSignatureCapture ?? false} onChange={e => updateConfig('kyc', 'customerSignatureCapture', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Signature Capture</span>
          </label>
        </div>
      </section>

      {/* Privacy & Consent */}
      <section className="space-y-4 pt-4 border-t border-[#1F1F24]">
        <h3 className="text-[14px] font-medium text-platinum flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#C9943A]" />
          13. Privacy & Consent
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.privacy?.marketingConsent ?? true} onChange={e => updateConfig('privacy', 'marketingConsent', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Require Marketing Consent</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.privacy?.whatsappConsent ?? true} onChange={e => updateConfig('privacy', 'whatsappConsent', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Require WhatsApp Consent</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.privacy?.smsConsent ?? true} onChange={e => updateConfig('privacy', 'smsConsent', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Require SMS Consent</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.privacy?.emailConsent ?? true} onChange={e => updateConfig('privacy', 'emailConsent', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Require Email Consent</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.privacy?.dataSharingConsent ?? false} onChange={e => updateConfig('privacy', 'dataSharingConsent', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">3rd Party Data Sharing Consent</span>
          </label>
          <div className="space-y-1.5 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <span className="text-[11px] text-platinum-muted block">Data Retention Period</span>
            <select value={config.privacy?.dataRetentionPeriod ?? "5_years"} onChange={e => updateConfig('privacy', 'dataRetentionPeriod', e.target.value)} disabled={!isAdmin} className="w-full h-8 px-2 bg-[#0A0A0B] border border-[#1F1F24] rounded text-[12px] text-platinum outline-none focus:border-[#C9943A]/50">
              <option value="1_year">1 Year</option>
              <option value="3_years">3 Years</option>
              <option value="5_years">5 Years</option>
              <option value="indefinite">Indefinite</option>
            </select>
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="space-y-4 pt-4 border-t border-[#1F1F24]">
        <h3 className="text-[14px] font-medium text-platinum flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#C9943A]" />
          18. Security
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.security?.otpVerification ?? true} onChange={e => updateConfig('security', 'otpVerification', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">General OTP Verification</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.security?.mobileVerification ?? true} onChange={e => updateConfig('security', 'mobileVerification', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Require Mobile Verification</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.security?.emailVerification ?? false} onChange={e => updateConfig('security', 'emailVerification', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Require Email Verification</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <input type="checkbox" checked={config.security?.twoFactorAuthentication ?? false} onChange={e => updateConfig('security', 'twoFactorAuthentication', e.target.checked)} disabled={!isAdmin} className="accent-[#C9943A] w-4 h-4" />
            <span className="text-[12px] text-platinum">Two-Factor Authentication</span>
          </label>
          <div className="space-y-1.5 p-3 rounded-lg border border-[#1F1F24] bg-[#111113]">
            <span className="text-[11px] text-platinum-muted block">Account Lock (Failed Attempts)</span>
            <input type="number" value={config.security?.accountLockAfterFailedAttempts ?? 5} onChange={e => updateConfig('security', 'accountLockAfterFailedAttempts', Number(e.target.value))} disabled={!isAdmin} className="w-full h-8 px-2 bg-[#0A0A0B] border border-[#1F1F24] rounded text-[12px] text-platinum outline-none focus:border-[#C9943A]/50" />
          </div>
        </div>
      </section>
      
    </div>
  );
}
// Adding missing FileText import artificially if needed, though Lucide provides it.
