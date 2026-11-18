"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { ProfileSidebar, profileCategories } from "./ProfileSidebar";
import { useSession } from "next-auth/react";

// Panel imports
import AccountPanel from "./panels/AccountPanel";
import BillingPanel from "./panels/BillingPanel";
import NotificationsPanel from "./panels/NotificationsPanel";

function ProfileContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?callbackUrl=/profile");
    }
  }, [status, router]);

  const tabParam = searchParams.get("tab");
  const initialCategory =
    tabParam && profileCategories.some((c) => c.id === tabParam)
      ? tabParam
      : profileCategories[0].id;

  const [activeCategoryId, setActiveCategoryId] = useState(initialCategory);

  // Sync state if URL query param changes
  useEffect(() => {
    if (tabParam && profileCategories.some((c) => c.id === tabParam)) {
      setActiveCategoryId(tabParam);
    }
  }, [tabParam]);

  const handleSelectCategory = (id: string) => {
    setActiveCategoryId(id);
    router.replace(`/profile?tab=${id}`, { scroll: false });
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-onyx flex items-center justify-center text-platinum-muted">
        Loading profile...
      </div>
    );
  }

  // Render the selected content
  const renderPanel = () => {
    switch (activeCategoryId) {
      case "account":
        return <AccountPanel />;
      case "billing":
        return <BillingPanel />;
      case "notifications":
        return <NotificationsPanel />;
      default:
        const category = profileCategories.find((c) => c.id === activeCategoryId);
        return (
          <div className="bg-onyx-surface rounded-xl gold-border p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mb-4">
              {category && <category.icon className="w-8 h-8 text-gold" />}
            </div>
            <h2 className="text-[20px] font-heading font-semibold text-platinum mb-2">
              {category?.title}
            </h2>
            <p className="text-[13px] text-platinum-muted max-w-sm mx-auto">
              This panel is currently a structural placeholder.
            </p>
          </div>
        );
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex-1 overflow-hidden bg-onyx flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 px-6 lg:px-8 py-6 border-b border-onyx-border bg-onyx-elevated/50">
          <h1 className="text-[36px] font-normal text-platinum">My Profile</h1>
          <p className="text-[12px] text-platinum-muted mt-0.5">Manage your account, billing and notification preferences.</p>
        </div>

        {/* 2-Column Profile Layout */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row max-w-[1600px] w-full mx-auto">
          {/* Profile Nav */}
          <div className="w-full md:w-64 flex-shrink-0 border-r border-onyx-border bg-onyx-elevated overflow-y-auto hidden md:block">
            <ProfileSidebar activeCategoryId={activeCategoryId} onSelect={handleSelectCategory} />
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-8 flex flex-col">
            {renderPanel()}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-platinum-muted animate-pulse">Loading profile...</div>}>
      <ProfileContent />
    </Suspense>
  );
}
