"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import AddCustomer from "../../../../components/Billing/AddCustomer";
import { getDraftInfo } from "@/hooks/useBillingLogic";

export default function BillingPage() {
  const router = useRouter();

  // Removed auto-redirect for drafts. Drafts are now displayed in AddCustomer component.

  return <AddCustomer />;
}
