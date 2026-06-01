"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import AddCustomer from "../../../../components/Billing/AddCustomer";
import { getDraftInfo } from "@/hooks/useBillingLogic";

export default function BillingPage() {
  const router = useRouter();

  useEffect(() => {
    // If there's a valid saved draft, skip customer selection and go straight to billing
    const info = getDraftInfo();
    if (info.hasValidDraft) {
      router.replace("/billing/create");
    }
  }, [router]);

  return <AddCustomer />;
}
