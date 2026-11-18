"use client";

import React, { useState } from "react";
import { CreditCard, CheckCircle2, Zap, Clock, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BillingPanel() {
  // Mock current plan data. In a real app, this would come from a database or session.
  const [currentPlan, setCurrentPlan] = useState<"TRIAL" | "PRO">("TRIAL");
  const trialDaysLeft = 14;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Current Plan Overview */}
      <div className="bg-onyx-surface rounded-xl gold-border p-6 md:p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
              {currentPlan === "TRIAL" ? <Clock className="w-7 h-7 text-gold" /> : <ShieldCheck className="w-7 h-7 text-gold" />}
            </div>
            <div>
              <h2 className="text-[20px] font-heading font-semibold text-platinum flex items-center gap-2">
                Current Plan: <span className="text-gold uppercase tracking-wider">{currentPlan}</span>
              </h2>
              <p className="text-[13px] text-platinum-muted mt-1">
                {currentPlan === "TRIAL" 
                  ? `Your trial expires in ${trialDaysLeft} days. Upgrade to retain access.` 
                  : "You are on the permanent PRO plan. All features unlocked."}
              </p>
            </div>
          </div>
          {currentPlan === "TRIAL" && (
            <button onClick={() => setCurrentPlan("PRO")} className="px-6 py-2.5 bg-gold hover:bg-gold/90 text-onyx font-semibold rounded-lg text-sm transition-colors shadow-[0_0_15px_rgba(212,175,55,0.3)]">
              Upgrade to PRO
            </button>
          )}
        </div>
      </div>

      {/* Plans Section */}
      <div>
        <h3 className="text-lg font-heading font-medium text-platinum mb-4">Available Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* TRIAL Plan Card */}
          <div className={cn(
            "rounded-xl p-6 border transition-all duration-300 relative overflow-hidden",
            currentPlan === "TRIAL" 
              ? "bg-onyx-elevated border-gold shadow-[0_0_20px_rgba(212,175,55,0.1)]" 
              : "bg-onyx-surface border-onyx-border hover:border-gold/50"
          )}>
            {currentPlan === "TRIAL" && (
              <div className="absolute top-0 right-0 bg-gold text-onyx text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                Current
              </div>
            )}
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xl font-heading font-semibold text-platinum">Trial Plan</h4>
              <Clock className="text-platinum-muted w-6 h-6" />
            </div>
            <div className="mb-6">
              <span className="text-3xl font-bold text-platinum">Free</span>
              <span className="text-platinum-muted text-sm ml-2">/ 14 days</span>
            </div>
            <p className="text-sm text-platinum-muted mb-6 h-10">
              Test out all the core features of our system for 14 days before committing.
            </p>
            <ul className="space-y-3 mb-8">
              {["Full POS system access", "Up to 500 Inventory Items", "Basic Reporting", "Standard Support"].map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-platinum">
                  <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <button 
              disabled={currentPlan === "TRIAL"}
              onClick={() => setCurrentPlan("TRIAL")}
              className={cn(
                "w-full py-2.5 rounded-lg text-sm font-semibold transition-colors",
                currentPlan === "TRIAL"
                  ? "bg-onyx border border-onyx-border text-platinum-muted cursor-not-allowed"
                  : "bg-onyx hover:bg-onyx-elevated border border-gold/30 text-gold"
              )}
            >
              {currentPlan === "TRIAL" ? "Active" : "Downgrade to Trial"}
            </button>
          </div>

          {/* PRO Plan Card */}
          <div className={cn(
            "rounded-xl p-6 border transition-all duration-300 relative overflow-hidden",
            currentPlan === "PRO" 
              ? "bg-onyx-elevated border-gold shadow-[0_0_20px_rgba(212,175,55,0.1)]" 
              : "bg-onyx-surface border-onyx-border hover:border-gold/50"
          )}>
            {currentPlan === "PRO" && (
              <div className="absolute top-0 right-0 bg-gold text-onyx text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                Current
              </div>
            )}
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xl font-heading font-semibold text-platinum flex items-center gap-2">
                Pro Plan
                <Zap className="w-4 h-4 text-gold fill-gold/20" />
              </h4>
            </div>
            <div className="mb-6">
              <span className="text-3xl font-bold text-platinum">$99</span>
              <span className="text-platinum-muted text-sm ml-2">/ permanent</span>
            </div>
            <p className="text-sm text-platinum-muted mb-6 h-10">
              Unlock the full potential of your jewelry business with unlimited access.
            </p>
            <ul className="space-y-3 mb-8">
              {["Unlimited Inventory Items", "Advanced Analytics & Reports", "Multi-branch Management", "Priority 24/7 Support", "RFID Integration Engine"].map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-platinum">
                  <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <button 
              disabled={currentPlan === "PRO"}
              onClick={() => setCurrentPlan("PRO")}
              className={cn(
                "w-full py-2.5 rounded-lg text-sm font-semibold transition-colors",
                currentPlan === "PRO"
                  ? "bg-onyx border border-onyx-border text-platinum-muted cursor-not-allowed"
                  : "bg-gold hover:bg-gold/90 text-onyx shadow-[0_0_15px_rgba(212,175,55,0.2)]"
              )}
            >
              {currentPlan === "PRO" ? "Active" : "Upgrade to Pro"}
            </button>
          </div>

        </div>
      </div>
      
      {/* Payment Methods Placeholder */}
      <div className="bg-onyx-surface rounded-xl border border-onyx-border p-6 mt-8">
        <h3 className="text-lg font-heading font-medium text-platinum mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-platinum-muted" />
          Payment Methods
        </h3>
        <p className="text-sm text-platinum-muted mb-4">You have no saved payment methods.</p>
        <button className="text-sm text-gold hover:text-gold/80 font-medium transition-colors">
          + Add Payment Method
        </button>
      </div>

    </div>
  );
}
