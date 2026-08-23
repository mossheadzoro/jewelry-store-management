// client/src/app/settings/panels/integration-settings/SecurityIntegrationTab.tsx
"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, Globe, Smartphone, Server, CheckCircle2, 
  AlertCircle, Loader2, Save, Key, RefreshCw, Radio, Check, 
  ExternalLink, Lock, ShieldAlert, Cpu
} from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

interface SecurityIntegrationTabProps {
  config: any;
  updateConfig: (section: string, key: string, value: any) => void;
  isAdmin: boolean;
}

export default function SecurityIntegrationTab({ config, updateConfig, isAdmin }: SecurityIntegrationTabProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingRecaptcha, setTestingRecaptcha] = useState(false);
  const [recaptchaTestResult, setRecaptchaTestResult] = useState<{
    success: boolean;
    latencyMs?: number;
    score?: number;
    message?: string;
  } | null>(null);

  // Form States
  const [recaptchaEnabled, setRecaptchaEnabled] = useState(false);
  const [recaptchaSiteKey, setRecaptchaSiteKey] = useState("");
  const [recaptchaSecretKey, setRecaptchaSecretKey] = useState("");
  const [hasExistingSecretKey, setHasExistingSecretKey] = useState(false);
  const [isReplacingSecretKey, setIsReplacingSecretKey] = useState(false);
  const [recaptchaEnvironment, setRecaptchaEnvironment] = useState("PRODUCTION");
  const [recaptchaStatus, setRecaptchaStatus] = useState("NOT_CONFIGURED");
  const [recaptchaLastTestedAt, setRecaptchaLastTestedAt] = useState<string | null>(null);

  // IP Proxy Configuration
  const [ipDetectionMode, setIpDetectionMode] = useState("AUTO");
  const [proxyHeader, setProxyHeader] = useState("AUTO");
  const [trustedProxiesInput, setTrustedProxiesInput] = useState("");

  // Load configuration from API on mount
  useEffect(() => {
    fetchSecurityIntegrations();
  }, []);

  const fetchSecurityIntegrations = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/security/integrations/recaptcha");
      if (res.data?.success) {
        const d = res.data.data;
        setRecaptchaSiteKey(d.recaptchaSiteKey || "");
        setHasExistingSecretKey(Boolean(d.hasSecretKey));
        setRecaptchaSecretKey(d.recaptchaSecretKey || "");
        setIsReplacingSecretKey(false);
        setRecaptchaEnvironment(d.recaptchaEnvironment || "PRODUCTION");
        setRecaptchaStatus(d.recaptchaStatus || "NOT_CONFIGURED");
        setRecaptchaLastTestedAt(d.recaptchaLastTestedAt || null);
        setIpDetectionMode(d.ipDetectionMode || "AUTO");
        setProxyHeader(d.proxyHeader || "AUTO");
        setTrustedProxiesInput((d.trustedProxies || []).join(", "));
        setRecaptchaEnabled(Boolean(d.enabled));
      }
    } catch (err) {
      console.error("Failed to load security integration config", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const trustedProxies = trustedProxiesInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const payload: any = {
        recaptchaSiteKey,
        recaptchaEnvironment,
        ipDetectionMode,
        proxyHeader,
        trustedProxies,
        enabled: recaptchaEnabled,
      };

      if (!hasExistingSecretKey || isReplacingSecretKey) {
        payload.recaptchaSecretKey = recaptchaSecretKey;
      }

      const res = await axios.put("/api/security/integrations/recaptcha", payload);
      if (res.data?.success) {
        toast.success("Security integrations saved successfully!");
        fetchSecurityIntegrations();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to save security integrations");
    } finally {
      setSaving(false);
    }
  };

  const handleTestRecaptcha = async () => {
    setTestingRecaptcha(true);
    setRecaptchaTestResult(null);

    try {
      const secretToTest = (!hasExistingSecretKey || isReplacingSecretKey) ? recaptchaSecretKey : undefined;

      const res = await axios.post("/api/security/integrations/recaptcha/test", {
        siteKey: recaptchaSiteKey,
        secretKey: secretToTest,
      });

      if (res.data?.success) {
        setRecaptchaTestResult({
          success: true,
          latencyMs: res.data.latencyMs,
          score: res.data.data?.score || 0.9,
          message: res.data.message,
        });
        setRecaptchaStatus("CONNECTED");
        toast.success("reCAPTCHA v3 API connection verified successfully!");
      } else {
        setRecaptchaTestResult({
          success: false,
          latencyMs: res.data.latencyMs,
          message: res.data.error || "Verification failed.",
        });
        setRecaptchaStatus("ERROR");
        toast.error(res.data.error || "reCAPTCHA test failed");
      }
    } catch (err: any) {
      setRecaptchaTestResult({
        success: false,
        message: err.response?.data?.error || "Failed to connect to Google reCAPTCHA servers.",
      });
      toast.error("reCAPTCHA verification test failed");
    } finally {
      setTestingRecaptcha(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-platinum-muted animate-pulse flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-gold" /> Loading 2FA & Security Integrations...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-[16px] font-semibold text-platinum flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-gold" />
            2FA & Security Integrations (External Service Connectors)
          </h3>
          <p className="text-[12px] text-platinum-muted mt-1">
            Configure external security providers including Google reCAPTCHA v3 credentials, internal RFC TOTP engine profile, and IP proxy detection headers.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-gold text-onyx px-4 py-2 rounded-lg text-[13px] font-semibold hover:bg-gold-light transition-colors flex items-center gap-2 shadow-lg shadow-gold/10 self-start sm:self-auto"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving..." : "Save Credentials"}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ========================================== */}
        {/* CARD A: Google reCAPTCHA v3 Credentials    */}
        {/* ========================================== */}
        <div className="lg:col-span-2 bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-4">
          <div className="flex items-center justify-between border-b border-[#1F1F24] pb-3">
            <div className="flex items-center gap-2.5">
              <Globe className="w-5 h-5 text-gold" />
              <div>
                <h4 className="text-[14px] font-semibold text-platinum">Google reCAPTCHA v3</h4>
                <p className="text-[11px] text-platinum-muted">Automated invisible bot and abuse protection</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
                recaptchaStatus === "CONNECTED"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : recaptchaStatus === "ERROR"
                  ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                  : "bg-neutral-800 text-neutral-400 border-neutral-700"
              }`}>
                {recaptchaStatus === "CONNECTED" ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                {recaptchaStatus === "CONNECTED" ? "Connected" : recaptchaStatus === "ERROR" ? "Connection Error" : "Not Configured"}
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#0A0A0B] border border-[#1F1F24]">
              <div>
                <span className="text-[13px] text-platinum font-medium block">Enable reCAPTCHA Protection</span>
                <span className="text-[11px] text-platinum-muted">Evaluate user interaction risk scores during login & recovery</span>
              </div>
              <input
                type="checkbox"
                checked={recaptchaEnabled}
                onChange={(e) => setRecaptchaEnabled(e.target.checked)}
                className="accent-gold w-4 h-4"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-medium text-platinum-muted block mb-1">
                  reCAPTCHA v3 Site Key
                </label>
                <input
                  type="text"
                  placeholder="6Ld_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={recaptchaSiteKey}
                  onChange={(e) => setRecaptchaSiteKey(e.target.value)}
                  className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum font-mono focus:border-gold outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-platinum-muted block mb-1">
                  Environment Mode
                </label>
                <select
                  value={recaptchaEnvironment}
                  onChange={(e) => setRecaptchaEnvironment(e.target.value)}
                  className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
                >
                  <option value="PRODUCTION">Production (Google reCAPTCHA)</option>
                  <option value="TEST">Sandbox / Test Mode</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-medium text-platinum-muted">
                  reCAPTCHA v3 Secret Key (Encrypted at Rest)
                </label>
                {hasExistingSecretKey && !isReplacingSecretKey && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsReplacingSecretKey(true);
                      setRecaptchaSecretKey("");
                    }}
                    className="text-[11px] text-gold hover:underline"
                  >
                    Replace Stored Key
                  </button>
                )}
              </div>

              {hasExistingSecretKey && !isReplacingSecretKey ? (
                <div className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-neutral-500 font-mono flex items-center justify-between">
                  <span>••••••••••••••••••••••••••••••••</span>
                  <span className="text-[10px] bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded">AES-256-GCM Encrypted</span>
                </div>
              ) : (
                <input
                  type="password"
                  placeholder="6Ld_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={recaptchaSecretKey}
                  onChange={(e) => setRecaptchaSecretKey(e.target.value)}
                  className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum font-mono focus:border-gold outline-none"
                />
              )}
            </div>

            {/* Test Connection Button & Result */}
            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleTestRecaptcha}
                disabled={testingRecaptcha}
                className="bg-[#0A0A0B] border border-[#25252B] hover:border-gold/40 text-platinum px-3.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors flex items-center gap-2"
              >
                {testingRecaptcha ? <Loader2 className="w-3.5 h-3.5 animate-spin text-gold" /> : <RefreshCw className="w-3.5 h-3.5 text-gold" />}
                <span>{testingRecaptcha ? "Testing Connection..." : "Test Connection"}</span>
              </button>

              {recaptchaLastTestedAt && (
                <span className="text-[11px] text-platinum-muted">
                  Last verified: {new Date(recaptchaLastTestedAt).toLocaleString("en-IN")}
                </span>
              )}
            </div>

            {recaptchaTestResult && (
              <div className={`p-3 rounded-lg border text-[12px] flex items-start gap-2 animate-in fade-in ${
                recaptchaTestResult.success
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-400"
              }`}>
                {recaptchaTestResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                <div>
                  <div className="font-semibold">{recaptchaTestResult.success ? "Google API Connection Verified" : "Verification Error"}</div>
                  <div className="text-[11px] opacity-90 mt-0.5">
                    {recaptchaTestResult.message}
                    {recaptchaTestResult.latencyMs ? ` (Latency: ${recaptchaTestResult.latencyMs}ms)` : ""}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ========================================== */}
        {/* CARD B: Standard TOTP Engine Configuration */}
        {/* ========================================== */}
        <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[#1F1F24] pb-3">
            <Smartphone className="w-5 h-5 text-gold" />
            <div>
              <h4 className="text-[14px] font-semibold text-platinum">Authenticator / TOTP Engine</h4>
              <p className="text-[11px] text-platinum-muted">RFC 6238 Standard Time-based Passcodes</p>
            </div>
          </div>

          <div className="space-y-3 pt-1 text-[12px]">
            <div className="p-3 bg-[#0A0A0B] rounded-lg border border-[#1F1F24] space-y-2">
              <span className="text-[11px] font-medium text-platinum-muted block uppercase tracking-wider">
                Compatible Applications
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-platinum">
                <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Google Authenticator</div>
                <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> MS Authenticator</div>
                <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> Authy</div>
                <div className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-400" /> 1Password / Bitwarden</div>
              </div>
            </div>

            <div className="space-y-2 text-[12px]">
              <div className="flex justify-between py-1 border-b border-[#1F1F24]">
                <span className="text-platinum-muted">Algorithm</span>
                <span className="text-platinum font-mono">HMAC-SHA1</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1F1F24]">
                <span className="text-platinum-muted">Code Length</span>
                <span className="text-platinum font-mono">6 Digits</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1F1F24]">
                <span className="text-platinum-muted">Step Period</span>
                <span className="text-platinum font-mono">30 Seconds</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1F1F24]">
                <span className="text-platinum-muted">Clock Tolerance</span>
                <span className="text-platinum font-mono">±1 Step Window</span>
              </div>
            </div>

            <p className="text-[11px] text-platinum-muted leading-relaxed pt-1">
              Standard RFC TOTP engine does not require external OAuth API tokens. Authenticator apps generate codes offline with zero vendor dependency.
            </p>
          </div>
        </div>

        {/* ========================================== */}
        {/* CARD C: IP Security & Reverse Proxy Setup  */}
        {/* ========================================== */}
        <div className="lg:col-span-3 bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-4">
          <div className="flex items-center gap-2.5 border-b border-[#1F1F24] pb-3">
            <Server className="w-5 h-5 text-gold" />
            <div>
              <h4 className="text-[14px] font-semibold text-platinum">IP Security & Reverse Proxy Resolution</h4>
              <p className="text-[11px] text-platinum-muted">
                Configure real client IP detection headers for Cloudflare, AWS CloudFront, NGINX, and corporate gateways
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            <div>
              <label className="text-[11px] font-medium text-platinum-muted block mb-1">
                IP Detection Mode
              </label>
              <select
                value={ipDetectionMode}
                onChange={(e) => setIpDetectionMode(e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
              >
                <option value="AUTO">Auto Detect (Cloudflare / Real-IP / Forwarded)</option>
                <option value="REVERSE_PROXY">Reverse Proxy (Strict Trusted Header)</option>
                <option value="DIRECT">Direct Socket Connection</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-platinum-muted block mb-1">
                Primary Forwarded Header
              </label>
              <select
                value={proxyHeader}
                onChange={(e) => setProxyHeader(e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
              >
                <option value="AUTO">Auto Priority (CF-Connecting-IP → X-Real-IP → X-Forwarded-For)</option>
                <option value="CF-Connecting-IP">CF-Connecting-IP (Cloudflare Edge)</option>
                <option value="X-Real-IP">X-Real-IP (NGINX / Caddy)</option>
                <option value="X-Forwarded-For">X-Forwarded-For (Standard Load Balancer)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-platinum-muted block mb-1">
                Trusted Proxy Subnets (Comma-separated)
              </label>
              <input
                type="text"
                placeholder="e.g. 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16"
                value={trustedProxiesInput}
                onChange={(e) => setTrustedProxiesInput(e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum font-mono focus:border-gold outline-none"
              />
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#0A0A0B] border border-[#1F1F24] text-[11px] text-platinum-muted flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-platinum">Security Advisory:</strong> Forwarded headers are sanitized to prevent IP spoofing attacks. For business policy configuration, navigate to <strong>Settings &rarr; Security Settings</strong>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
