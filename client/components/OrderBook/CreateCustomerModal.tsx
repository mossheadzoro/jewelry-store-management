"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useEffect, useState } from "react";
import { UserPlus, Loader2, User, Phone, MapPin, Map, Building, Hash } from "lucide-react";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  mobile: z.string().regex(/^[6-9]\d{9}$/, "Invalid mobile"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is Required"),
  state: z.string().min(1, "State is Required"),
  pincode: z.string().min(1, "Pincode is Required"),
  gender: z.enum(["Male", "Female", "Other"], {
    message: "Gender is required",
  }),
});

type FormData = z.infer<typeof schema>;

export default function CreateCustomerModal({
  open,
  mobile,
  onClose,
  onCreated,
}: {
  open: boolean;
  mobile: string;
  onClose: () => void;
  onCreated: (customer: any) => void;
}) {
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      mobile: "",
      gender: "Male",
    },
  });

  useEffect(() => {
    if (open) {
      // Initialize if passed a number, otherwise clear
      if (mobile && /^[6-9]\d{9}$/.test(mobile)) {
        setValue("mobile", mobile, { shouldValidate: true });
      } else {
        setValue("mobile", "");
        if (mobile && mobile.length > 2) {
          setValue("name", mobile); // If they searched a name, prefill name
        }
      }
    } else {
      reset(); // clear form on close
    }
  }, [open, mobile, setValue, reset]);

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      const res = await axios.post("/api/customer/create", data);
      onCreated(res.data);
      onClose();
    } catch (err) {
      alert("Failed to create customer ❌");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0f0f0f] border-[#222] text-white w-[95vw] max-w-2xl p-0 overflow-hidden shadow-2xl [&>button]:hidden">
        <DialogTitle className="sr-only">Create New Customer</DialogTitle>
        <div className="p-8">
          {/* HEADER */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#D4A843]/10 flex items-center justify-center border border-[#D4A843]/30">
                  <UserPlus className="w-5 h-5 text-[#D4A843]" />
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  New Customer
                </h2>
              </div>
              <p className="text-sm text-[#777] mt-1 ml-13">
                Register a new client profile into the ledger
              </p>
            </div>
            {/* Custom Close Button */}
            <button 
              onClick={onClose}
              className="text-[#555] hover:text-white transition-colors p-2"
              type="button"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            <div className="grid grid-cols-2 gap-5">
              {/* Name */}
              <div>
                <label className="text-[10px] font-bold text-[#666] uppercase tracking-[0.15em] mb-2 block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                  <Input 
                    {...register("name")} 
                    placeholder="E.g. Rahul Sharma"
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#141414] border border-[#2a2a2a] text-[13px] text-white placeholder:text-[#444] focus:outline-none focus:border-[#D4A843]/50 transition-colors" 
                  />
                </div>
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
              </div>

              {/* Mobile */}
              <div>
                <label className="text-[10px] font-bold text-[#666] uppercase tracking-[0.15em] mb-2 block">Contact Number</label>
                <div className="relative flex gap-2">
                  <span className="h-11 px-3 rounded-xl bg-[#141414] border border-[#2a2a2a] text-[13px] text-[#888] flex items-center">+91</span>
                  <div className="relative flex-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                    <Input 
                      {...register("mobile")} 
                      placeholder="98765 43210"
                      className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#141414] border border-[#2a2a2a] text-[13px] text-white placeholder:text-[#444] focus:outline-none focus:border-[#D4A843]/50 transition-colors" 
                    />
                  </div>
                </div>
                {errors.mobile && <p className="text-red-400 text-xs mt-1">{errors.mobile.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              {/* Gender */}
              <div>
                <label className="text-[10px] font-bold text-[#666] uppercase tracking-[0.15em] mb-2 block">Gender</label>
                <select
                  {...register("gender")}
                  className="w-full h-11 px-4 rounded-xl bg-[#141414] border border-[#2a2a2a] text-[13px] text-white focus:outline-none focus:border-[#D4A843]/50 transition-colors appearance-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && <p className="text-red-400 text-xs mt-1">{errors.gender.message}</p>}
              </div>

              {/* Address */}
              <div>
                <label className="text-[10px] font-bold text-[#666] uppercase tracking-[0.15em] mb-2 block">Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                  <Input 
                    {...register("address")} 
                    placeholder="Street, Locality"
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#141414] border border-[#2a2a2a] text-[13px] text-white placeholder:text-[#444] focus:outline-none focus:border-[#D4A843]/50 transition-colors" 
                  />
                </div>
                {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-5">
              {/* City */}
              <div>
                <label className="text-[10px] font-bold text-[#666] uppercase tracking-[0.15em] mb-2 block">City</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                  <Input 
                    {...register("city")} 
                    placeholder="City"
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#141414] border border-[#2a2a2a] text-[13px] text-white placeholder:text-[#444] focus:outline-none focus:border-[#D4A843]/50 transition-colors" 
                  />
                </div>
                {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city.message}</p>}
              </div>

              {/* State */}
              <div>
                <label className="text-[10px] font-bold text-[#666] uppercase tracking-[0.15em] mb-2 block">State</label>
                <div className="relative">
                  <Map className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                  <Input 
                    {...register("state")} 
                    placeholder="State"
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#141414] border border-[#2a2a2a] text-[13px] text-white placeholder:text-[#444] focus:outline-none focus:border-[#D4A843]/50 transition-colors" 
                  />
                </div>
                {errors.state && <p className="text-red-400 text-xs mt-1">{errors.state.message}</p>}
              </div>

              {/* Pincode */}
              <div>
                <label className="text-[10px] font-bold text-[#666] uppercase tracking-[0.15em] mb-2 block">Pincode</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" />
                  <Input 
                    {...register("pincode")} 
                    placeholder="XXXXXX"
                    className="w-full h-11 pl-10 pr-4 rounded-xl bg-[#141414] border border-[#2a2a2a] text-[13px] text-white placeholder:text-[#444] focus:outline-none focus:border-[#D4A843]/50 transition-colors" 
                  />
                </div>
                {errors.pincode && <p className="text-red-400 text-xs mt-1">{errors.pincode.message}</p>}
              </div>
            </div>

            {/* FOOTER ACTIONS */}
            <div className="pt-6 mt-4 border-t border-[#222] flex items-center justify-end gap-4">
              <button 
                type="button"
                onClick={onClose}
                className="text-xs font-bold text-[#aaa] uppercase tracking-wider hover:text-white transition-colors px-4 py-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3 bg-[#d4a843] text-black hover:bg-[#b58b2e] text-xs font-bold tracking-widest uppercase rounded-full transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {submitting ? "Saving..." : "Save Customer"}
              </button>
            </div>
          </form>

        </div>
      </DialogContent>
    </Dialog>
  );
}
