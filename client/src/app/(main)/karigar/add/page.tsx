import React from "react";
import KarigarForm from "@/components/Karigar/KarigarForm";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

const AddKarigar = () => {
  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="w-full">
        <KarigarForm />
      </div>
    </SidebarProvider>
  );
};

export default AddKarigar;
