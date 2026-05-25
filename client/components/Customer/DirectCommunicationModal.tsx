"use client";

import React, { useState } from "react";
import { X, Send, History, Loader2, MessageSquare, Phone, Mail, Clock, ShoppingBag } from "lucide-react";
import { CustomerRow } from "./CustomerTable"; // Reusing type for convenience
import Image from "next/image";

interface DirectCommunicationModalProps {
  open: boolean;
  onClose: () => void;
  customer: any; // We'll pass the full customer details
}

export default function DirectCommunicationModal({ open, onClose, customer }: DirectCommunicationModalProps) {
  const [activeTab, setActiveTab] = useState<"WhatsApp" | "SMS" | "Email">("WhatsApp");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  if (!open || !customer) return null;

  const initials = customer.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

  const handleTemplate = (templateId: string) => {
    switch (templateId) {
      case "birthday":
        setMessage(`Dear ${customer.name},\n\nWishing you a very happy birthday! We hope your day is filled with joy and celebration.\n\nWarm regards,\nThe Atelier`);
        break;
      case "anniversary":
        setMessage(`Dear ${customer.name},\n\nHappy Anniversary! We wish you many more years of happiness and sparkle.\n\nWarm regards,\nThe Atelier`);
        break;
      case "reminder":
        setMessage(`Dear ${customer.name},\n\nThis is a gentle reminder regarding your pending balance. Please ignore if already paid.\n\nWarm regards,\nThe Atelier`);
        break;
      case "festival":
        setMessage(`Dear ${customer.name},\n\nWishing you and your family a joyous festival season! May your year be filled with prosperity.\n\nWarm regards,\nThe Atelier`);
        break;
    }
  };

  const handleSend = () => {
    if (!message.trim()) return;
    setSending(true);
    // Mock sending process
    setTimeout(() => {
      setSending(false);
      setMessage("");
      onClose();
      alert(`${activeTab} sent successfully to ${customer.name}!`);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-5xl max-h-[85vh] bg-[#0f0f0f] border border-[#222] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-[#1f1f1f] bg-[#141414]">
          <div>
            <h2 className="text-[20px] font-bold text-white tracking-tight">Direct Communication</h2>
            <p className="text-[13px] text-[#777] mt-1">Secure messaging hub for personal client relations.</p>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#333] text-[#ccc] hover:bg-[#1f1f1f] hover:text-white transition-colors text-[13px] font-medium">
              <History className="w-4 h-4" />
              View History
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-[#777] hover:text-white hover:bg-[#222] transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Left Panel - Context */}
          <div className="w-[320px] border-r border-[#1f1f1f] bg-[#111] flex flex-col p-6 overflow-y-auto custom-scrollbar">
            
            {/* Profile Summary */}
            <div className="bg-[#1a1a1a] border border-[#252525] rounded-xl p-5 mb-6 flex flex-col items-center text-center">
              <div className="relative w-20 h-20 rounded-full bg-[#222] border-2 border-[#D4A843]/30 flex items-center justify-center text-2xl font-bold text-[#D4A843] mb-4">
                {initials}
                <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#1a1a1a]"></div>
              </div>
              <h3 className="text-[18px] font-bold text-white">{customer.name}</h3>
              {customer.tier && (
                <div className="mt-1.5 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-[#D4A843]/15 text-[#D4A843]">
                  {customer.tier} Tier
                </div>
              )}
              <p className="text-[12px] text-[#666] mt-2">Client since {new Date(customer.createdAt).getFullYear()}</p>
              
              <div className="w-full mt-6 space-y-4 text-left">
                <div className="flex items-center gap-3 text-[13px]">
                  <Phone className="w-4 h-4 text-[#555]" />
                  <span className="text-[#ccc]">{customer.mobile}</span>
                </div>
                {customer.email && (
                  <div className="flex items-center gap-3 text-[13px]">
                    <Mail className="w-4 h-4 text-[#555]" />
                    <span className="text-[#ccc] truncate">{customer.email}</span>
                  </div>
                )}
                {customer.dob && (
                  <div className="flex items-center gap-3 text-[13px]">
                    <span className="w-4 h-4 text-[#555] flex justify-center text-[12px]">🎂</span>
                    <span className="text-[#D4A843]">{new Date(customer.dob).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Context */}
            <div>
              <h4 className="text-[11px] font-bold text-[#555] uppercase tracking-wider mb-3">Recent Context</h4>
              <div className="bg-[#1a1a1a] border border-[#252525] rounded-xl p-4 space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#D4A843]/10 flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-4 h-4 text-[#D4A843]" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-[#eee]">Purchased Item</p>
                    <p className="text-[12px] text-[#777] mt-0.5">Recently completed a transaction.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#333] flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-[#999]" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-[#eee]">Profile Updated</p>
                    <p className="text-[12px] text-[#777] mt-0.5">Details recently modified.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Panel - Messaging */}
          <div className="flex-1 flex flex-col bg-[#0a0a0a]">
            
            {/* Tabs */}
            <div className="flex border-b border-[#1f1f1f] px-8">
              {["WhatsApp", "SMS", "Email"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-6 py-4 text-[14px] font-medium transition-colors border-b-2 ${
                    activeTab === tab 
                    ? "text-[#D4A843] border-[#D4A843]" 
                    : "text-[#666] border-transparent hover:text-[#aaa]"
                  }`}
                >
                  {tab === "WhatsApp" && <span className="mr-2">💬</span>}
                  {tab === "SMS" && <span className="mr-2">📱</span>}
                  {tab === "Email" && <span className="mr-2">✉️</span>}
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex-1 p-8 flex flex-col">
              
              {/* Quick Templates */}
              <div className="mb-6">
                <h4 className="text-[11px] font-bold text-[#666] uppercase tracking-wider mb-3">Quick Templates</h4>
                <div className="flex flex-wrap gap-3">
                  {[
                    { id: "birthday", icon: "🎂", label: "Birthday Wishes" },
                    { id: "anniversary", icon: "❤️", label: "Anniversary" },
                    { id: "reminder", icon: "📅", label: "Due Reminder" },
                    { id: "festival", icon: "🎉", label: "Festival Greeting" },
                  ].map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => handleTemplate(tpl.id)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#141414] border border-[#252525] text-[13px] text-[#ccc] hover:bg-[#1f1f1f] hover:text-white transition-all"
                    >
                      <span>{tpl.icon}</span>
                      {tpl.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Area */}
              <div className="flex-1 relative bg-[#141414] border border-[#252525] rounded-xl overflow-hidden flex flex-col focus-within:border-[#D4A843]/50 transition-colors">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={`Draft your personalized ${activeTab.toLowerCase()} to ${customer.name.split(' ')[0]} here...`}
                  className="flex-1 bg-transparent p-5 text-[14px] text-white placeholder:text-[#555] outline-none resize-none custom-scrollbar"
                />
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-between mt-6">
                <p className="text-[12px] text-[#666]">
                  Character count: <span className="text-[#999]">{message.length}</span> • Sending via Official Business {activeTab === 'Email' ? 'Email' : 'Number'}
                </p>
                <div className="flex gap-3">
                  <button className="px-5 py-2.5 rounded-xl border border-[#333] text-[#ccc] text-[13px] font-medium hover:text-white hover:bg-[#1a1a1a] transition-all">
                    Save Draft
                  </button>
                  <button 
                    onClick={handleSend}
                    disabled={sending || !message.trim()}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#D4A843] text-black text-[14px] font-semibold hover:bg-[#e6bc5a] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Message 🚀"}
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #555; }
      `}} />
    </div>
  );
}
