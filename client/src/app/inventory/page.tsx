// /app/dashboard/admin/page.tsx
"use client"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";


import { useBranchStore } from "@/lib/store/useBranchStore";
import { InventoryHeader } from "../../../components/Inventory/InventoryHeader";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import AddCategory from "../../../components/Inventory/Category/AddCategory";
import { useState } from "react";
import AddCategoryDialog from "../../../components/Inventory/Category/AddCategory";
import ShowCategory from "../../../components/Inventory/Category/ShowCategory";
import SubCategoryModal from "../../../components/Inventory/SubCategory/AddSubCategory";
import ShowAllSubCategory from "../../../components/Inventory/SubCategory/ShowAllSubCategory";
import AddProductModal from "../../../components/Inventory/Product/AddProductForm";
import ShowAllProducts from "../../../components/Inventory/Product/ShowAllProducts";




export default function Inventory() {
  
  const {branches}=useBranchStore();

  const router=useRouter();

   const [categoryOpen, setCategoryOpen] = useState(false)
   const [subCategoryOpen,setSubCategoryOpen]=useState(false);
   const [addProduct,setProduct]=useState(false);
  
return(
 <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
          
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <InventoryHeader/>
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-row justify-evenly py-4 md:gap-2 md:py-6">

              <div className="flex flex-col gap-10">
             
              <Button className="bg-zinc-300 w-[20rem] py-5 hover:bg-zinc-400 " onClick={(e) => setCategoryOpen(true)}>Add Category</Button>
              <AddCategoryDialog open={categoryOpen} setOpen={setCategoryOpen} />
              <ShowCategory />
              </div>
              
            <div className="flex flex-col gap-10">
             <Button className="bg-zinc-300 w-m py-5  hover:bg-zinc-400" onClick={(e)=>setSubCategoryOpen(true)}  >Add Subcategory</Button>
             <SubCategoryModal open={subCategoryOpen} setOpen={setSubCategoryOpen}/>
             <ShowAllSubCategory/>
            </div>

            <div className="flex flex-col gap-10">
             <Button className="bg-zinc-300 w-lg py-5  hover:bg-zinc-400" onClick={(e)=>setProduct(true)}>Add Product</Button>
             <AddProductModal open={addProduct} setOpen={setProduct}  branches={branches} />
            <ShowAllProducts/>
            </div>
             
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
)
}
