"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Users, Shield, Lock, History, FileCheck } from "lucide-react";
import UsersTab from "./user-roles/UsersTab";
import RolesTab from "./user-roles/RolesTab";
import SecurityTab from "./user-roles/SecurityTab";
import ActivityLogsTab from "./user-roles/ActivityLogsTab";
import ApprovalMatrixTab from "./user-roles/ApprovalMatrixTab";

const tabs = [
  { id: "users", label: "Users", icon: Users },
  { id: "roles", label: "Roles & Permissions", icon: Shield },
  { id: "security", label: "Login Security", icon: Lock },
  { id: "activity", label: "Activity Logs", icon: History },
  { id: "approval", label: "Approval Matrix", icon: FileCheck },
];

export default function UserAndRolesSettingsPanel() {
  const [activeTab, setActiveTab] = useState("users");

  const renderTab = () => {
    switch (activeTab) {
      case "users": return <UsersTab />;
      case "roles": return <RolesTab />;
      case "security": return <SecurityTab />;
      case "activity": return <ActivityLogsTab />;
      case "approval": return <ApprovalMatrixTab />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-onyx-border pb-4">
        <div>
          <h2 className="text-[20px] font-heading font-semibold text-platinum">Users & Roles</h2>
          <p className="text-[13px] text-platinum-muted mt-1">
            Manage employees, custom roles, granular permissions, and security policies.
          </p>
        </div>
      </div>

      <div className="flex space-x-1 border-b border-onyx-border">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-[13px] font-medium transition-all border-b-2",
              activeTab === tab.id
                ? "border-gold text-gold"
                : "border-transparent text-platinum-muted hover:text-platinum hover:border-onyx-muted"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="pt-4">
        {renderTab()}
      </div>
    </div>
  );
}
