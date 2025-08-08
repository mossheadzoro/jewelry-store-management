'use client';
import React, { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useBranchStore } from "@/lib/store/useBranchStore";
import { useUserStore } from "@/lib/store/useUserStore";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import AddCustomer from "../../../components/Billing/AddCustomer";

const Billing = () => {
  const { user } = useUserStore();
  const { selectedBranch } = useBranchStore();

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    pan: "",
    gstin: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    gender: "",
    dob: undefined as Date | undefined,
    anniversary: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Customer Data:", formData);
    // TODO: send to backend
  };

  return (
    <SidebarProvider>
      <div className="flex">
        <AppSidebar />
        <AddCustomer/>
      </div>
    </SidebarProvider>
  );
};

export default Billing;
