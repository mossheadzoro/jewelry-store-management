"use client";

import React, { useState } from "react";
import { Sparkles, Bot, Key, Eye, EyeOff, CheckCircle2, Mic, Image, ScanText } from "lucide-react";

interface AiIntegrationTabProps {
  config: any;
  updateConfig: (section: string, key: string, value: any) => void;
  isAdmin: boolean;
}

export default function AiIntegrationTab({ config, updateConfig, isAdmin }: AiIntegrationTabProps) {
  const aiConfig = config?.ai || {
    openai: { apiKey: "sk-proj-90192801...", defaultModel: "gpt-4o", enabled: true },
    gemini: { apiKey: "AIzaSy...", defaultModel: "gemini-1.5-pro", enabled: true },
    claude: { apiKey: "sk-ant-api03-...", defaultModel: "claude-3-5-sonnet-20241022", enabled: true },
    ocrService: { enabled: true, autoTagScan: true, panOcrParser: true, confidenceThreshold: 85 },
    imageAi: { enabled: true, bgRemoval: true, jewelryEnhancement: true },
    voiceAi: { enabled: true, speechToText: true, voiceSearch: true }
  };

  const [showKey, setShowKey] = useState<Record<string, boolean>>({});

  const toggleShow = (key: string) => {
    setShowKey(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const updateSubProp = (section: string, key: string, val: any) => {
    updateConfig("ai", section, {
      ...(aiConfig[section] || {}),
      [key]: val
    });
  };

  const aiProviders = [
    { id: "openai", name: "OpenAI GPT-4o", desc: "OpenAI GPT-4o & GPT-4o-mini text generation API", badge: "GPT-4o Ready", logoColor: "text-emerald-400" },
    { id: "gemini", name: "Google Gemini AI", desc: "Google AI Studio Multimodal Flash & Pro Models", badge: "Gemini 1.5", logoColor: "text-blue-400" },
    { id: "claude", name: "Anthropic Claude", desc: "Claude 3.5 Sonnet advanced reasoning engine", badge: "Claude 3.5", logoColor: "text-purple-400" }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#111113] p-4 rounded-xl border border-[#1F1F24] flex items-center justify-between">
        <div>
          <h3 className="text-[16px] font-semibold text-platinum flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gold" />
            Artificial Intelligence & Machine Vision Integration
          </h3>
          <p className="text-[12px] text-platinum-muted mt-0.5">
            Integrate LLM AI APIs for jewelry tag OCR parsing, AI image background removal, and voice command sales entry.
          </p>
        </div>
        <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-gold/10 text-gold border border-gold/30 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" /> LLM APIs Active
        </span>
      </div>

      {/* AI LLM Provider Keys */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {aiProviders.map(p => {
          const isEnabled = aiConfig[p.id]?.enabled;

          return (
            <div key={p.id} className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-3">
              <div className="flex items-center justify-between border-b border-[#1F1F24] pb-2">
                <div className="flex items-center gap-2">
                  <Bot className={`w-4 h-4 ${p.logoColor}`} />
                  <h4 className="text-[14px] font-semibold text-platinum">{p.name}</h4>
                </div>
                <input
                  type="checkbox"
                  checked={!!isEnabled}
                  onChange={(e) => updateSubProp(p.id, "enabled", e.target.checked)}
                  className="accent-gold w-4 h-4"
                />
              </div>

              {isEnabled && (
                <div className="space-y-2 pt-1">
                  <div>
                    <label className="text-[11px] text-platinum-muted block mb-1">API Key</label>
                    <div className="relative">
                      <input
                        type={showKey[p.id] ? "text" : "password"}
                        value={aiConfig[p.id]?.apiKey || ""}
                        onChange={(e) => updateSubProp(p.id, "apiKey", e.target.value)}
                        className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none pr-8"
                      />
                      <button
                        type="button"
                        onClick={() => toggleShow(p.id)}
                        className="absolute right-2.5 top-2 text-platinum-muted hover:text-platinum"
                      >
                        {showKey[p.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] text-platinum-muted block mb-1">Default Model Target</label>
                    <input
                      type="text"
                      value={aiConfig[p.id]?.defaultModel || ""}
                      onChange={(e) => updateSubProp(p.id, "defaultModel", e.target.value)}
                      className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-1.5 text-[12px] text-platinum focus:border-gold outline-none font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Special AI Services: OCR, Image AI, Voice AI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* OCR Service */}
        <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-3">
          <div className="flex items-center justify-between border-b border-[#1F1F24] pb-2">
            <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2">
              <ScanText className="w-4 h-4 text-gold" /> OCR Document Scanner Service
            </h4>
            <input
              type="checkbox"
              checked={!!aiConfig.ocrService?.enabled}
              onChange={(e) => updateSubProp("ocrService", "enabled", e.target.checked)}
              className="accent-gold w-4 h-4"
            />
          </div>
          <div className="space-y-2 pt-1 text-[12px]">
            <label className="flex items-center justify-between text-platinum">
              Auto Scan Jewelry Tag Barcode OCR
              <input
                type="checkbox"
                checked={!!aiConfig.ocrService?.autoTagScan}
                onChange={(e) => updateSubProp("ocrService", "autoTagScan", e.target.checked)}
                className="accent-gold"
              />
            </label>
            <label className="flex items-center justify-between text-platinum">
              Aadhaar & PAN Auto OCR Parsing
              <input
                type="checkbox"
                checked={!!aiConfig.ocrService?.panOcrParser}
                onChange={(e) => updateSubProp("ocrService", "panOcrParser", e.target.checked)}
                className="accent-gold"
              />
            </label>
          </div>
        </div>

        {/* Image AI */}
        <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-3">
          <div className="flex items-center justify-between border-b border-[#1F1F24] pb-2">
            <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2">
              <Image className="w-4 h-4 text-gold" /> Jewelry Image AI Studio
            </h4>
            <input
              type="checkbox"
              checked={!!aiConfig.imageAi?.enabled}
              onChange={(e) => updateSubProp("imageAi", "enabled", e.target.checked)}
              className="accent-gold w-4 h-4"
            />
          </div>
          <div className="space-y-2 pt-1 text-[12px]">
            <label className="flex items-center justify-between text-platinum">
              Auto Background Removal
              <input
                type="checkbox"
                checked={!!aiConfig.imageAi?.bgRemoval}
                onChange={(e) => updateSubProp("imageAi", "bgRemoval", e.target.checked)}
                className="accent-gold"
              />
            </label>
            <label className="flex items-center justify-between text-platinum">
              AI Gemstone Polish Enhancement
              <input
                type="checkbox"
                checked={!!aiConfig.imageAi?.jewelryEnhancement}
                onChange={(e) => updateSubProp("imageAi", "jewelryEnhancement", e.target.checked)}
                className="accent-gold"
              />
            </label>
          </div>
        </div>

        {/* Voice AI */}
        <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-3">
          <div className="flex items-center justify-between border-b border-[#1F1F24] pb-2">
            <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2">
              <Mic className="w-4 h-4 text-gold" /> Voice AI Assistant
            </h4>
            <input
              type="checkbox"
              checked={!!aiConfig.voiceAi?.enabled}
              onChange={(e) => updateSubProp("voiceAi", "enabled", e.target.checked)}
              className="accent-gold w-4 h-4"
            />
          </div>
          <div className="space-y-2 pt-1 text-[12px]">
            <label className="flex items-center justify-between text-platinum">
              Speech-to-Text Invoice Dictation
              <input
                type="checkbox"
                checked={!!aiConfig.voiceAi?.speechToText}
                onChange={(e) => updateSubProp("voiceAi", "speechToText", e.target.checked)}
                className="accent-gold"
              />
            </label>
            <label className="flex items-center justify-between text-platinum">
              Voice Product Search at POS
              <input
                type="checkbox"
                checked={!!aiConfig.voiceAi?.voiceSearch}
                onChange={(e) => updateSubProp("voiceAi", "voiceSearch", e.target.checked)}
                className="accent-gold"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
