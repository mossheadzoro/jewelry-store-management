"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Info, SearchCheck, SearchIcon } from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

import { useBranchStore } from "@/lib/store/useBranchStore";
import { useUserStore } from "@/lib/store/useUserStore";
import GSTDetails from "./GSTDetails";
import { toast } from "sonner";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";

// 🔐 Zod Schema
const customerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  mobile: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  email: z
  .string()
  .optional()
  .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
    message: "Enter a valid email",
  }),



  pan: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Invalid PAN number")
    .optional()
    .or(z.literal("")),
  gstin: z
  .string()
  .transform((val) => (val === "" ? undefined : val))
  .optional()
  .refine((val) => !val || val.length === 15, {
    message: "Enter Correct GST Number",
  }),

  aadhar: z
    .string()
    .regex(/^\d{12}$/, "Invalid Aadhar number")
    .optional()
    .or(z.literal("")),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z
    .string()
    .regex(/^\d{6}$/, "Invalid PIN code")
    .min(6)
    .max(6),
  gender: z.enum(["Male", "Female", "Other"]),
  dob: z
    .string()
    .refine(
      (val) => {
        const date = new Date(val);
        return !isNaN(date.getTime()) && date <= new Date();
      },
      {
        message: "Invalid or future date not allowed",
      }
    )
    .optional(),
  anniversary: z
    .string()
    .refine(
      (val) => {
        if(!val)return true;
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      {
        message: "Invalid date",
      }
    )
    .optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

const AddCustomer = () => {

const router=useRouter();

  const { selectedBranch } = useBranchStore();
  const { user } = useUserStore();
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    watch,
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
  });

  const [cusID,setCusID]=useState('');

  const [customerInfo, setCustomerInfo] = useState<null | {
    name: string;
    mobile: string;
    address?: string;
    gstNo?: string;
  }>(null);

  async function handleMobileSearch(mobile: string) {
    if (mobile.length === 10) {
      try {
        const res = await axios.get(`/api/customer/search?mobile=${mobile}`);
        if (res.data.customer) {
          setCustomerInfo(res.data.customer);
        } else {
          setCustomerInfo(null);
          toast("No user found. Create One !!")
        }
      } catch (err) {
        console.error("Error searching mobile:", err);
        setCustomerInfo(null);
      }
    }
  }

  const onSubmit = async (data: CustomerFormData) => {
  try {
    if (!cusID) {
      const response = await axios.post("/api/customer/create", data);

      const customer = response.data

      

      toast("Customer created successfully!");
      router.push(`/billing/create?customerId=${customer.id}`);
    } else {
      router.push(`/billing/create?customerId=${cusID}`);
    }
  } catch (error: any) {
    console.error("Error creating customer:", error);
    alert(error.message || "Failed to create customer");
  }
};

  const dobString = watch("dob");
  const dobDate = dobString ? new Date(dobString) : undefined;
  const isValidDate = dobDate instanceof Date && !isNaN(dobDate.getTime());
  const gstinValue = watch("gstin"); // gets the current GSTIN value from the form

  return (
    <div className="flex">
      <div className="p-6 flex-1">
        <h2 className="text-2xl font-semibold mb-6">Customer Information</h2>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <div>
            <Label htmlFor="name">Customer Name</Label>
            <Input id="name" {...register("name")} />
            <span className="text-red-500 text-sm">{errors.name?.message}</span>
          </div>

          <div  >
            <Label htmlFor="mobile">Mobile Number <SearchIcon className="h-4 w-4"/> </Label>
            <Input
              id="mobile"
              {...register("mobile")}
              onBlur={(e) => handleMobileSearch(e.target.value)}
              placeholder="Enter 10-digit mobile to search"
            />
            
            <span className="text-red-500 text-sm">
              {errors.mobile?.message}
            </span>
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" {...register("email")} />
            <span className="text-red-500 text-sm">
              {errors.email?.message}
            </span>
          </div>

          <div>
            <Label htmlFor="pan">PAN Number</Label>
            <Input id="pan" {...register("pan")} />
            <span className="text-red-500 text-sm">{errors.pan?.message}</span>
          </div>

          <div>
            <Label htmlFor="gstin">GSTIN</Label>
            <div className="flex-row flex gap-2">
              <Input id="gstin" {...register("gstin")} />
              <Button
                type="button"
                className="bg-black text-white hover:text-black"
                onClick={(e) => setOpen(true)}
              >
                <Info />
              </Button>
              <GSTDetails open={open} setOpen={setOpen} GSTIN={gstinValue} />
            </div>
          </div>

          <div>
            <Label htmlFor="gender">Gender</Label>
            <select
              id="gender"
              {...register("gender")}
              className="w-full border border-gray-300 bg-black text-white rounded-md p-2"
            >
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <span className="text-red-500 text-sm">
              {errors.gender?.message}
            </span>
          </div>

          {/* Date of Birth Calendar */}
          <div>
            <Label>Date of Birth</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  data-empty={!watch("dob")}
                  className="data-[empty=true]:text-muted-foreground w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {isValidDate ? (
                    format(dobDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={isValidDate ? dobDate : undefined}
                  onSelect={(date) => {
                    if (date) {
                      setValue("dob", date.toISOString().split("T")[0]);
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <span className="text-red-500 text-sm">{errors.dob?.message}</span>
          </div>

          <div>
            <Label htmlFor="anniversary">Anniversary</Label>
            <Input type="date" id="anniversary" {...register("anniversary")} />
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Input id="address" {...register("address")} />
            <span className="text-red-500 text-sm">
              {errors.address?.message}
            </span>
          </div>

          <div>
            <Label htmlFor="city">City</Label>
            <Input id="city" {...register("city")} />
            <span className="text-red-500 text-sm">{errors.city?.message}</span>
          </div>

          <div>
            <Label htmlFor="state">State</Label>
            <Input id="state" {...register("state")} />
            <span className="text-red-500 text-sm">
              {errors.state?.message}
            </span>
          </div>

          <div>
            <Label htmlFor="pincode">Pincode</Label>
            <Input id="pincode" {...register("pincode")} />
            <span className="text-red-500 text-sm">
              {errors.pincode?.message}
            </span>
          </div>

          <div>
            <Label htmlFor="aadhar">Aadhar Number</Label>
            <Input id="aadhar" {...register("aadhar")} />
            <span className="text-red-500 text-sm">
              {errors.aadhar?.message}
            </span>
          </div>

          <div className="col-span-full flex-row flex gap-4">
            <div className="col-span-full flex">
              <Button
                className=" bg-green-600 hover:text-white hover:bg-green-900"
                type="submit"
              >
                Bill the Customer
              </Button>
            </div>
          </div>

          
        </form>
       
            { customerInfo && (
      <Card className="mt-6 shadow-lg border-none bg-muted text-base text-foreground">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Customer Details:-</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <p>
              <span className="font-medium">Name:</span> {customerInfo.name}
            </p>
            <p>
              <span className="font-medium">Mobile:</span> {customerInfo.mobile}
            </p>
            {customerInfo.address && (
              <p>
                <span className="font-medium">Address:</span> {customerInfo.address}
              </p>
            )}
            {customerInfo.gstNo && (
              <p>
                <span className="font-medium">GST No:</span> {customerInfo.gstNo}
              </p>
            )}
            <Button onClick={()=> router.push(`/billing/create?customerId=${customerInfo.id}`)} >Bill him/her</Button>
          </div>
          
        </CardContent>
      </Card>
    )}
          
      </div>
    </div>
  );
};

export default AddCustomer;
