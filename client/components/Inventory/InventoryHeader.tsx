'use client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useBranchStore } from "@/lib/store/useBranchStore"
import { PlusCircleIcon } from "lucide-react"
import { useRouter } from "next/navigation"


export function InventoryHeader() {

  const {selectedBranch}=useBranchStore();




  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex flex-row w-full items-center gap-1 px-1 lg:gap-2 lg:px-10 ">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">Moumita Alankar ({selectedBranch?.name})</h1>
        <Input className="max-w-sm px-4 xl:ml-[100px]"  placeholder="Search items..."/>
        
      </div>
    </header>
  )
}
