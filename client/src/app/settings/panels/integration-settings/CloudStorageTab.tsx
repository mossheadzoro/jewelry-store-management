"use client";

import React from "react";
import { Cloud, CheckCircle2, Key, Server, RefreshCw, HardDrive } from "lucide-react";

interface CloudStorageTabProps {
  config: any;
  updateConfig: (section: string, key: string, value: any) => void;
  isAdmin: boolean;
}

export default function CloudStorageTab({ config, updateConfig, isAdmin }: CloudStorageTabProps) {
  const cloudConfig = config?.cloudStorage || {
    provider: "aws_s3", // gdrive, onedrive, dropbox, aws_s3, cloudflare_r2
    gdrive: { folderId: "12XQxuTB_fOABKPJ9ziFykajKxbgZuVXX", connected: true },
    onedrive: { folderPath: "/JewelryStoreBackups", connected: false },
    dropbox: { accessToken: "••••••••", connected: false },
    awsS3: { bucketName: "jewelstore-backups-mumbai", region: "ap-south-1", accessKeyId: "AKIA...", secretKey: "••••••••" },
    cloudflareR2: { accountId: "3092109...", bucketName: "jewelstore-vault", accessKey: "", secretKey: "" },
    backupSync: {
      syncDatabase: true,
      syncProductImages: true,
      syncKycDocs: true,
      retentionDays: 30
    }
  };

  const updateProp = (key: string, val: any) => {
    updateConfig("cloudStorage", key, val);
  };

  const updateProviderProp = (prov: string, key: string, val: any) => {
    updateConfig("cloudStorage", prov, {
      ...(cloudConfig[prov] || {}),
      [key]: val
    });
  };

  const updateSyncProp = (key: string, val: any) => {
    updateConfig("cloudStorage", "backupSync", {
      ...(cloudConfig.backupSync || {}),
      [key]: val
    });
  };

  const providers = [
    { id: "aws_s3", name: "AWS S3", desc: "Amazon Web Services Object Storage (AWS Mumbai ap-south-1)", badge: "Enterprise Storage" },
    { id: "cloudflare_r2", name: "Cloudflare R2", desc: "S3 compatible zero egress fee object storage", badge: "Zero Egress Fee" },
    { id: "gdrive", name: "Google Drive", desc: "Connect Google Workspace / Gmail Drive folder", badge: "Cloud Drive" },
    { id: "onedrive", name: "Microsoft OneDrive", desc: "OneDrive for Business document cloud storage", badge: "Microsoft 365" },
    { id: "dropbox", name: "Dropbox Business", desc: "Dropbox API team folder synchronization", badge: "Cloud File Sync" }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#111113] p-4 rounded-xl border border-[#1F1F24] flex items-center justify-between">
        <div>
          <h3 className="text-[16px] font-semibold text-platinum flex items-center gap-2">
            <Cloud className="w-5 h-5 text-cyan-400" />
            Cloud Storage & Vault Integration
          </h3>
          <p className="text-[12px] text-platinum-muted mt-0.5">
            Store automated database snapshots, customer KYC identity documents, and high-resolution jewelry catalog images.
          </p>
        </div>
        <span className="text-[11px] font-medium px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" /> AWS S3 Connected
        </span>
      </div>

      {/* Storage Providers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {providers.map(p => {
          const isSelected = cloudConfig.provider === p.id;

          return (
            <div
              key={p.id}
              onClick={() => updateProp("provider", p.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? "bg-[#111113] border-gold shadow-lg shadow-gold/5"
                  : "bg-[#0A0A0B] border-[#1F1F24] hover:border-gold/40"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[14px] font-semibold text-platinum">{p.name}</h4>
                <span className="text-[10px] px-2 py-0.5 rounded bg-gold/10 text-gold font-medium">{p.badge}</span>
              </div>
              <p className="text-[11px] text-platinum-muted mb-3">{p.desc}</p>
              <div className="flex items-center justify-between pt-2 border-t border-[#1F1F24]">
                <span className={`text-[11px] font-medium ${isSelected ? "text-gold" : "text-platinum-muted"}`}>
                  {isSelected ? "Active Destination" : "Select Destination"}
                </span>
                {isSelected && <CheckCircle2 className="w-4 h-4 text-gold" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Provider Details Form */}
      <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-4">
        <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2 border-b border-[#1F1F24] pb-3">
          <Key className="w-4 h-4 text-gold" />
          {providers.find(p => p.id === cloudConfig.provider)?.name} Connection Credentials
        </h4>

        {cloudConfig.provider === "aws_s3" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[12px] font-medium text-platinum block mb-1">S3 Bucket Name</label>
              <input
                type="text"
                value={cloudConfig.awsS3?.bucketName || ""}
                onChange={(e) => updateProviderProp("awsS3", "bucketName", e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-platinum block mb-1">AWS Region</label>
              <input
                type="text"
                value={cloudConfig.awsS3?.region || "ap-south-1"}
                onChange={(e) => updateProviderProp("awsS3", "region", e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-platinum block mb-1">Access Key ID</label>
              <input
                type="text"
                value={cloudConfig.awsS3?.accessKeyId || ""}
                onChange={(e) => updateProviderProp("awsS3", "accessKeyId", e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-platinum block mb-1">Secret Access Key</label>
              <input
                type="password"
                value={cloudConfig.awsS3?.secretKey || ""}
                onChange={(e) => updateProviderProp("awsS3", "secretKey", e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
              />
            </div>
          </div>
        )}

        {cloudConfig.provider === "cloudflare_r2" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[12px] font-medium text-platinum block mb-1">Cloudflare Account ID</label>
              <input
                type="text"
                value={cloudConfig.cloudflareR2?.accountId || ""}
                onChange={(e) => updateProviderProp("cloudflareR2", "accountId", e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-platinum block mb-1">R2 Bucket Name</label>
              <input
                type="text"
                value={cloudConfig.cloudflareR2?.bucketName || ""}
                onChange={(e) => updateProviderProp("cloudflareR2", "bucketName", e.target.value)}
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
              />
            </div>
          </div>
        )}

        {cloudConfig.provider === "gdrive" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[12px] font-medium text-platinum block mb-1">Target Google Drive Folder ID</label>
              <input
                type="text"
                value={cloudConfig.gdrive?.folderId || ""}
                onChange={(e) => updateProviderProp("gdrive", "folderId", e.target.value)}
                placeholder="1920192019..."
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-platinum block mb-1">Google OAuth Client ID / Access Token</label>
              <input
                type="password"
                value={cloudConfig.gdrive?.accessToken || ""}
                onChange={(e) => updateProviderProp("gdrive", "accessToken", e.target.value)}
                placeholder="ya29.a0..."
                className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none font-mono"
              />
            </div>
          </div>
        )}
      </div>

      {/* Backup Sync Preferences */}
      <div className="bg-[#111113] p-5 rounded-xl border border-[#1F1F24] space-y-4">
        <h4 className="text-[14px] font-semibold text-platinum flex items-center gap-2 border-b border-[#1F1F24] pb-3">
          <RefreshCw className="w-4 h-4 text-gold" />
          Cloud Vault Sync Content Rules
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-lg bg-[#0A0A0B] border border-[#1F1F24] flex items-center justify-between">
            <div>
              <p className="text-[12px] font-medium text-platinum">Database Dumps</p>
              <p className="text-[10px] text-platinum-muted">Daily SQL & JSON snapshots</p>
            </div>
            <input
              type="checkbox"
              checked={!!cloudConfig.backupSync?.syncDatabase}
              onChange={(e) => updateSyncProp("syncDatabase", e.target.checked)}
              className="accent-gold w-4 h-4"
            />
          </div>

          <div className="p-3.5 rounded-lg bg-[#0A0A0B] border border-[#1F1F24] flex items-center justify-between">
            <div>
              <p className="text-[12px] font-medium text-platinum">Jewelry Product Images</p>
              <p className="text-[10px] text-platinum-muted">Tag photos & catalog images</p>
            </div>
            <input
              type="checkbox"
              checked={!!cloudConfig.backupSync?.syncProductImages}
              onChange={(e) => updateSyncProp("syncProductImages", e.target.checked)}
              className="accent-gold w-4 h-4"
            />
          </div>

          <div className="p-3.5 rounded-lg bg-[#0A0A0B] border border-[#1F1F24] flex items-center justify-between">
            <div>
              <p className="text-[12px] font-medium text-platinum">Customer KYC Documents</p>
              <p className="text-[10px] text-platinum-muted">Encrypted Aadhaar & PAN files</p>
            </div>
            <input
              type="checkbox"
              checked={!!cloudConfig.backupSync?.syncKycDocs}
              onChange={(e) => updateSyncProp("syncKycDocs", e.target.checked)}
              className="accent-gold w-4 h-4"
            />
          </div>

          <div>
            <label className="text-[12px] font-medium text-platinum block mb-1">Snapshot Retention (Days)</label>
            <input
              type="number"
              value={cloudConfig.backupSync?.retentionDays || 30}
              onChange={(e) => updateSyncProp("retentionDays", parseInt(e.target.value))}
              className="w-full bg-[#0A0A0B] border border-[#1F1F24] rounded-lg px-3 py-2 text-[12px] text-platinum focus:border-gold outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
