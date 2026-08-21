"use client";

import { useEffect, useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Search, Phone, User, MapPin, UserPlus, X, Clock, CheckCircle2 } from "lucide-react";

export type CustomerState = {
  id?: number;
  name: string;
  mobile: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gender: "MALE" | "FEMALE" | "OTHER" | "";
  isExisting: boolean;
};

const INDIAN_STATES = [
  "Maharashtra", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
];

export default function CustomerDetails({
  onCustomerChange,
}: {
  onCustomerChange: (customer: CustomerState | null) => void;
}) {
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerState | null>(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Create Customer Modal state
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  
  const [createForm, setCreateForm] = useState({
    name: "",
    mobile: "",
    email: "",
    gender: "MALE" as "MALE" | "FEMALE" | "OTHER",
    address: "",
    city: "",
    state: "Maharashtra",
    pincode: "",
    pan: "",
    gstin: "",
  });

  // Handle outside click to close search dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Customer search effect by Name OR Phone number
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSearchResults([]);
      setHasSearched(false);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/customer/search?query=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          const list = data.customers || (data.customer ? [data.customer] : []);
          setSearchResults(list);
          setShowDropdown(true);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error("Customer search error:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
        setHasSearched(true);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Select existing customer
  const handleSelectCustomer = (cust: any) => {
    const customerObj: CustomerState = {
      id: cust.id,
      name: cust.name || "",
      mobile: cust.mobile || "",
      address: cust.address || "",
      city: cust.city || "",
      state: cust.state || "Maharashtra",
      pincode: cust.pincode || "",
      gender: cust.gender || "MALE",
      isExisting: true,
    };
    setSelectedCustomer(customerObj);
    onCustomerChange(customerObj);
    setShowDropdown(false);
    setSearchQuery("");
  };

  // Clear customer selection
  const handleClearCustomer = () => {
    setSelectedCustomer(null);
    onCustomerChange(null);
    setSearchQuery("");
    setSearchResults([]);
    setHasSearched(false);
  };

  // Pre-fill create modal when opening
  const handleOpenCreateModal = () => {
    const isPhone = /^\d+$/.test(searchQuery.trim());
    setCreateForm({
      name: isPhone ? "" : searchQuery.trim(),
      mobile: isPhone ? searchQuery.trim() : "",
      email: "",
      gender: "MALE",
      address: "",
      city: "",
      state: "Maharashtra",
      pincode: "",
      pan: "",
      gstin: "",
    });
    setModalError(null);
    setOpenCreateModal(true);
    setShowDropdown(false);
  };

  // Submit Create Customer
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const { name, mobile, address, city, state, pincode } = createForm;
    if (!name.trim() || !mobile.trim() || !address.trim() || !city.trim() || !pincode.trim()) {
      setModalError("Please fill all required fields (Name, Mobile, Address, City, Pincode).");
      return;
    }

    if (mobile.replace(/\D/g, "").length < 10) {
      setModalError("Please enter a valid 10-digit mobile number.");
      return;
    }

    setModalLoading(true);
    try {
      const res = await fetch("/api/customer/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...createForm,
          mobile: createForm.mobile.replace(/\D/g, ""),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create customer");
      }

      const createdCustomer: CustomerState = {
        id: data.id,
        name: data.name,
        mobile: data.mobile,
        address: data.address || "",
        city: data.city || "",
        state: data.state || "Maharashtra",
        pincode: data.pincode || "",
        gender: data.gender || "MALE",
        isExisting: true,
      };

      setSelectedCustomer(createdCustomer);
      onCustomerChange(createdCustomer);
      setOpenCreateModal(false);
    } catch (err: any) {
      setModalError(err.message || "Something went wrong.");
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <>
      <Card className="border border-[#1F1F24] bg-[#111113] shadow-lg relative z-30 rounded-xl">
        <CardHeader className="pb-3 border-b border-[#1F1F24] bg-[#0A0A0B] flex flex-row items-center justify-between rounded-t-xl">
          <div className="flex items-center gap-2.5">
            <User className="w-5 h-5 text-[#C9943A]" />
            <CardTitle className="text-base font-bold text-[#F0EBE0] font-serif">
              Customer Details
            </CardTitle>
          </div>

          {/* Automatic Session Date & Time Badge (No Date Picker needed) */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#1A1A1E] border border-[#2A2A30] text-xs text-[#8E8A85]">
            <Clock className="w-3.5 h-3.5 text-[#C9943A]" />
            <span>Auto Date/Time (System Session)</span>
          </div>
        </CardHeader>

        <CardContent className="p-5 relative z-30">
          {selectedCustomer ? (
            /* Selected Customer Display Card */
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-[#1A1A1E] border border-[#C9943A]/30 relative overflow-hidden">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#C9943A]/10 border border-[#C9943A]/30 flex items-center justify-center text-[#C9943A] font-bold text-lg">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-foreground">{selectedCustomer.name}</h4>
                    <Badge className="bg-[#C9943A]/20 text-[#C9943A] border-[#C9943A]/30 text-[10px]">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Existing Customer
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-[#8E8A85] mt-1">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-[#C9943A]" />
                      {selectedCustomer.mobile}
                    </span>
                    {(selectedCustomer.city || selectedCustomer.address) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#C9943A]" />
                        {[selectedCustomer.city, selectedCustomer.address].filter(Boolean).join(", ")}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleClearCustomer}
                className="border-[#2A2A30] text-xs text-[#E0D8CC] hover:bg-[#25252A] hover:text-foreground"
              >
                Change Customer
              </Button>
            </div>
          ) : (
            /* Search Customer Input & Results Dropdown */
            <div className="relative" ref={dropdownRef}>
              <Label className="text-xs font-semibold text-[#8E8A85] mb-1.5 block">
                Search Customer by Name or Phone Number
              </Label>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#8E8A85]" />
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => {
                      if (searchResults.length > 0) setShowDropdown(true);
                    }}
                    placeholder="Enter customer name or 10-digit mobile number..."
                    className="pl-9 pr-8 bg-[#0A0A0B] border-[#1F1F24] text-sm text-[#F0EBE0] placeholder:text-[#555] focus:border-[#C9943A]/60"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setSearchResults([]);
                        setShowDropdown(false);
                      }}
                      className="absolute right-2.5 top-2.5 text-[#555] hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <Button
                  onClick={handleOpenCreateModal}
                  className="bg-[#C9943A] hover:bg-[#E8B84B] text-foreground font-bold text-xs gap-1.5 px-4 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  + Create New Customer
                </Button>
              </div>

              {isSearching && (
                <p className="text-xs text-[#8E8A85] mt-2 animate-pulse">
                  Searching database for "{searchQuery}"...
                </p>
              )}

              {/* Search Dropdown Results */}
              {showDropdown && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-[#141417] border border-[#2A2A30] rounded-xl shadow-2xl z-50 overflow-hidden max-h-72 overflow-y-auto">
                  {searchResults.length > 0 ? (
                    <div className="divide-y divide-[#1F1F24]">
                      <div className="px-3 py-1.5 text-[11px] font-semibold text-[#8E8A85] bg-[#0A0A0B] uppercase tracking-wider">
                        Found Matching Customers ({searchResults.length})
                      </div>
                      {searchResults.map((cust) => (
                        <div
                          key={cust.id}
                          onClick={() => handleSelectCustomer(cust)}
                          className="p-3 hover:bg-[#1F1F24] cursor-pointer transition-colors flex items-center justify-between"
                        >
                          <div>
                            <p className="text-sm font-semibold text-[#F0EBE0]">{cust.name}</p>
                            <p className="text-xs text-[#8E8A85] flex items-center gap-3 mt-0.5">
                              <span>📱 {cust.mobile}</span>
                              {cust.city && <span>📍 {cust.city}</span>}
                            </p>
                          </div>
                          <Badge variant="outline" className="border-[#C9943A]/40 text-[#C9943A] text-[10px]">
                            Select
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : hasSearched && !isSearching ? (
                    <div className="p-4 text-center">
                      <p className="text-sm text-[#8E8A85]">
                        No existing customer found for "<span className="text-foreground">{searchQuery}</span>"
                      </p>
                      <Button
                        variant="link"
                        onClick={handleOpenCreateModal}
                        className="text-[#C9943A] hover:underline text-xs mt-1 font-semibold"
                      >
                        + Click here to create new customer
                      </Button>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---------------- CREATE CUSTOMER MODAL ---------------- */}
      <Dialog open={openCreateModal} onOpenChange={setOpenCreateModal}>
        <DialogContent className="max-w-xl bg-[#111113] border-[#2A2A30] text-[#F0EBE0] p-6 rounded-2xl shadow-2xl">
          <DialogHeader className="pb-3 border-b border-[#1F1F24]">
            <DialogTitle className="text-lg font-bold text-[#F0EBE0] font-serif flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#C9943A]" />
              Create New Customer
            </DialogTitle>
          </DialogHeader>

          {modalError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {modalError}
            </div>
          )}

          <form onSubmit={handleSaveCustomer} className="space-y-4 my-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-[#8E8A85] mb-1 block">Full Name *</Label>
                <Input
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Rahul Sharma"
                  className="bg-[#0A0A0B] border-[#1F1F24] text-xs text-[#F0EBE0]"
                />
              </div>

              <div>
                <Label className="text-xs text-[#8E8A85] mb-1 block">Mobile Number *</Label>
                <Input
                  required
                  type="tel"
                  maxLength={10}
                  value={createForm.mobile}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, mobile: e.target.value.replace(/\D/g, "") }))}
                  placeholder="10-digit mobile"
                  className="bg-[#0A0A0B] border-[#1F1F24] text-xs text-[#F0EBE0]"
                />
              </div>

              <div>
                <Label className="text-xs text-[#8E8A85] mb-1 block">Email (Optional)</Label>
                <Input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="customer@example.com"
                  className="bg-[#0A0A0B] border-[#1F1F24] text-xs text-[#F0EBE0]"
                />
              </div>

              <div>
                <Label className="text-xs text-[#8E8A85] mb-1 block">Gender</Label>
                <select
                  value={createForm.gender}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, gender: e.target.value as any }))}
                  className="w-full h-9 rounded-md bg-[#0A0A0B] border border-[#1F1F24] text-xs text-[#F0EBE0] px-3 focus:outline-none focus:border-[#C9943A]/50"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            <div>
              <Label className="text-xs text-[#8E8A85] mb-1 block">Address *</Label>
              <Input
                required
                value={createForm.address}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, address: e.target.value }))}
                placeholder="Street address or locality"
                className="bg-[#0A0A0B] border-[#1F1F24] text-xs text-[#F0EBE0]"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-[#8E8A85] mb-1 block">City *</Label>
                <Input
                  required
                  value={createForm.city}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, city: e.target.value }))}
                  placeholder="City name"
                  className="bg-[#0A0A0B] border-[#1F1F24] text-xs text-[#F0EBE0]"
                />
              </div>

              <div>
                <Label className="text-xs text-[#8E8A85] mb-1 block">State</Label>
                <select
                  value={createForm.state}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, state: e.target.value }))}
                  className="w-full h-9 rounded-md bg-[#0A0A0B] border border-[#1F1F24] text-xs text-[#F0EBE0] px-2 focus:outline-none"
                >
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-xs text-[#8E8A85] mb-1 block">Pincode *</Label>
                <Input
                  required
                  maxLength={6}
                  value={createForm.pincode}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, pincode: e.target.value.replace(/\D/g, "") }))}
                  placeholder="6-digit PIN"
                  className="bg-[#0A0A0B] border-[#1F1F24] text-xs text-[#F0EBE0]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <Label className="text-xs text-[#8E8A85] mb-1 block">PAN (Optional)</Label>
                <Input
                  value={createForm.pan}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, pan: e.target.value.toUpperCase() }))}
                  placeholder="ABCDE1234F"
                  className="bg-[#0A0A0B] border-[#1F1F24] text-xs text-[#F0EBE0]"
                />
              </div>

              <div>
                <Label className="text-xs text-[#8E8A85] mb-1 block">GSTIN (Optional)</Label>
                <Input
                  value={createForm.gstin}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, gstin: e.target.value.toUpperCase() }))}
                  placeholder="27ABCDE1234F1Z5"
                  className="bg-[#0A0A0B] border-[#1F1F24] text-xs text-[#F0EBE0]"
                />
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-[#1F1F24] flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenCreateModal(false)}
                className="border-[#2A2A30] text-xs text-[#E0D8CC]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={modalLoading}
                className="bg-[#C9943A] hover:bg-[#E8B84B] text-foreground font-bold text-xs"
              >
                {modalLoading ? "Saving..." : "Save & Select Customer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
