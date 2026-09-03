// client/src/app/login/page.tsx
"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  ShieldCheck, Lock, Mail, KeyRound, Eye, EyeOff, 
  Loader2, AlertCircle, CheckCircle2, ArrowRight, Smartphone, RefreshCw 
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  // Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // 2FA Challenge State
  const [is2FAChallenge, setIs2FAChallenge] = useState(false);
  const [challengeToken, setChallengeToken] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [rememberDevice, setRememberDevice] = useState(true);

  // Step 1: Initial Login Challenge
  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email || !password) {
      setErrorMessage("Please enter both your email address and password.");
      return;
    }

    setLoading(true);

    try {
      // Retrieve any client-stored trusted device token as fallback
      const savedDeviceToken = typeof window !== "undefined" ? localStorage.getItem("moual_trusted_device") : null;

      // Call security challenge endpoint
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (savedDeviceToken) {
        headers["x-trusted-device-token"] = savedDeviceToken;
      }

      const challengeRes = await fetch("/api/security/challenge", {
        method: "POST",
        headers,
        body: JSON.stringify({
          email,
          password,
          trustedDeviceToken: savedDeviceToken || undefined,
        }),
      });

      const data = await challengeRes.json();

      if (!challengeRes.ok || !data.success) {
        setErrorMessage(data.error || "Invalid email or password. Please try again.");
        setLoading(false);
        return;
      }

      // If 2FA is required
      if (data.requires2FA) {
        setChallengeToken(data.challengeToken);
        setIs2FAChallenge(true);
        setLoading(false);
        return;
      }

      // 2FA not required (single-factor or bypassed via trusted device) -> finalize sign in
      await finalizeNextAuthSignIn();
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred during login.");
      setLoading(false);
    }
  };

  // Step 2: 2FA Verification (TOTP or Recovery Code)
  const handle2FAVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const codeToVerify = isRecoveryMode ? recoveryCode.trim() : totpCode.trim();
    if (!codeToVerify) {
      setErrorMessage(isRecoveryMode ? "Please enter your emergency recovery code." : "Please enter the 6-digit verification code.");
      return;
    }

    setLoading(true);

    try {
      const verifyRes = await fetch("/api/security/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeToken,
          code: codeToVerify,
          isRecoveryCode: isRecoveryMode,
          rememberDevice,
          deviceName: navigator.userAgent.slice(0, 80),
        }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.success) {
        setErrorMessage(verifyData.error || "Invalid verification code. Please check and try again.");
        setLoading(false);
        return;
      }

      // Save trusted device token in localStorage if rememberDevice is checked
      if (rememberDevice && verifyData?.data?.trustedDeviceToken) {
        try {
          localStorage.setItem("moual_trusted_device", verifyData.data.trustedDeviceToken);
        } catch {
          // Ignore localStorage failure in incognito/restricted mode
        }
      } else if (!rememberDevice) {
        try {
          localStorage.removeItem("moual_trusted_device");
        } catch {}
      }

      // 2FA passed! Finalize NextAuth session
      await finalizeNextAuthSignIn();
    } catch (err: any) {
      setErrorMessage(err.message || "2FA verification failed.");
      setLoading(false);
    }
  };

  // Finalizes NextAuth credentials session and routes to role dashboard
  const finalizeNextAuthSignIn = async () => {
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (res?.ok) {
      try {
        const sessionRes = await fetch("/api/auth/session");
        const session = await sessionRes.json();
        const role = session?.user?.role;

        if (role === "ADMIN") router.push("/dashboard/admin");
        else if (role === "MANAGER") router.push("/dashboard/manager");
        else if (role === "SALESMAN") router.push("/dashboard/salesman");
        else router.push("/dashboard/viewer");
      } catch {
        router.push("/dashboard/admin");
      }
    } else {
      setErrorMessage(res?.error || "Session authentication failed.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-foreground flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient gold glow circles */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-[440px] z-10">
        {/* Brand Banner */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#111113] border border-gold/30 shadow-lg shadow-gold/5 mb-4">
            <ShieldCheck className="w-7 h-7 text-gold" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-platinum font-heading">
            MOUAL ERP Software
          </h1>
          <p className="text-[13px] text-platinum-muted mt-1">
            Enterprise Jewellery Management & Secure POS
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-[#111113] border border-[#1F1F24] rounded-2xl p-8 shadow-2xl shadow-black/80 relative">
          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[13px] flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="leading-snug">{errorMessage}</div>
            </div>
          )}

          {!is2FAChallenge ? (
            /* STEP 1: CREDENTIALS LOGIN */
            <form onSubmit={handleInitialSubmit} className="space-y-4">
              <div>
                <label className="text-[12px] font-medium text-platinum-muted block mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3 text-platinum-muted" />
                  <input
                    type="email"
                    required
                    autoFocus
                    placeholder="admin@jewelleryerp.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#0A0A0B] border border-[#25252B] rounded-xl pl-10 pr-4 py-2.5 text-[13px] text-platinum placeholder:text-neutral-600 focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-[12px] font-medium text-platinum-muted block mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3 text-platinum-muted" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#0A0A0B] border border-[#25252B] rounded-xl pl-10 pr-11 py-2.5 text-[13px] text-platinum placeholder:text-neutral-600 focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-platinum-muted hover:text-platinum transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gold hover:bg-gold-light text-onyx font-semibold py-3 rounded-xl text-[13px] transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-gold/10 hover:shadow-gold/20 disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-onyx" />
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: 2FA VERIFICATION */
            <form onSubmit={handle2FAVerify} className="space-y-4">
              <div className="text-center pb-2">
                <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center mx-auto mb-3 text-gold">
                  {isRecoveryMode ? <KeyRound className="w-6 h-6" /> : <Smartphone className="w-6 h-6" />}
                </div>
                <h3 className="text-[16px] font-semibold text-platinum">
                  {isRecoveryMode ? "Emergency Backup Code" : "Two-Factor Verification"}
                </h3>
                <p className="text-[12px] text-platinum-muted mt-1">
                  {isRecoveryMode
                    ? "Enter one of your 12-character emergency recovery codes."
                    : `Enter the 6-digit code from Google/Microsoft Authenticator for ${email}.`}
                </p>
              </div>

              {!isRecoveryMode ? (
                <div>
                  <label className="text-[11px] font-medium text-platinum-muted block mb-1.5 uppercase tracking-wider text-center">
                    6-Digit Passcode
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    placeholder="000000"
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/[^0-9]/g, ""))}
                    className="w-full bg-[#0A0A0B] border border-[#25252B] rounded-xl py-3 text-[22px] text-gold font-mono tracking-widest text-center focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-all"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-[11px] font-medium text-platinum-muted block mb-1.5 uppercase tracking-wider text-center">
                    Recovery Code (e.g. ABCD-1234-EF56)
                  </label>
                  <input
                    type="text"
                    autoFocus
                    placeholder="XXXX-XXXX-XXXX"
                    value={recoveryCode}
                    onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                    className="w-full bg-[#0A0A0B] border border-[#25252B] rounded-xl py-2.5 text-[15px] text-gold font-mono tracking-widest text-center focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-all uppercase"
                  />
                </div>
              )}

              {/* Remember device checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="rememberDevice"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  className="accent-gold rounded w-3.5 h-3.5"
                />
                <label htmlFor="rememberDevice" className="text-[12px] text-platinum-muted cursor-pointer select-none">
                  Remember this trusted device for 30 days
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gold hover:bg-gold-light text-onyx font-semibold py-3 rounded-xl text-[13px] transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-gold/10 hover:shadow-gold/20 disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-onyx" />
                ) : (
                  <>
                    <span>{isRecoveryMode ? "Verify Recovery Code" : "Authenticate & Sign In"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-[12px] pt-3 border-t border-[#1F1F24]">
                <button
                  type="button"
                  onClick={() => {
                    setIsRecoveryMode(!isRecoveryMode);
                    setErrorMessage("");
                  }}
                  className="text-platinum-muted hover:text-gold transition-colors flex items-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{isRecoveryMode ? "Use Authenticator App" : "Use Backup Recovery Code"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIs2FAChallenge(false);
                    setErrorMessage("");
                  }}
                  className="text-platinum-muted hover:text-platinum transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-neutral-600 mt-6">
          © {new Date().getFullYear()} MOUAL ERP Software. High-Security Enterprise Access.
        </div>
      </div>
    </div>
  );
}
