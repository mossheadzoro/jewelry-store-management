"use client";

import { IconCirclePlusFilled, IconMail, type Icon } from "@tabler/icons-react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import AddBranchForm from "../../components/AddBranchForm";
import AddUserForm from "../../components/AddUserForm";
import { useBranchStore } from "@/lib/store/useBranchStore";
import { useRouter } from "next/navigation";
import { ScrollArea } from "./ui/scroll-area";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: Icon;
  }[];
}) {
  const { branches } = useBranchStore();
  const router=useRouter()

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center  gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  className="w-full  bg-gray-300  text-gray-950"
                  variant="outline"
                >
                  Quick Create
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-[600px]   mt-6">
                <DialogTitle>Quick Create</DialogTitle>
                <DialogHeader>
                  <DialogDescription>
                    Create a Branch, Manager or Salesman.
                  </DialogDescription>
                </DialogHeader>

               <ScrollArea className="max-h-[90vh]  px-4 pb-4">
                  <Tabs defaultValue="branch" className="mt-4">
                    <TabsList className="grid w-max grid-cols-2">
                      <TabsTrigger value="branch">Branch</TabsTrigger>
                      <TabsTrigger value="manager">
                        Manager/Salesman
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="branch">
                      <h3 className="text-lg font-medium mt-4">
                        Create Branch
                      </h3>
                      <AddBranchForm />
                    </TabsContent>

                    <TabsContent value="manager">
                      <h3 className="text-lg font-medium mb-2">
                        Create Manager
                      </h3>
                      <AddUserForm branches={branches} />
                    </TabsContent>
                  </Tabs>
               
               </ScrollArea>
                
              </DialogContent>
            </Dialog>
          </SidebarMenuItem>
        </SidebarMenu>
       <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                onClick={() => router.push(item.url)} // ✅ navigate
              >
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
