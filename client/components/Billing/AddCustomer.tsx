"use client";

import React, { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Search,
  UserPlus,
  Info,
  ArrowRight,
  X,
  Loader2,
  Sparkles,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { useBranchStore } from "@/lib/store/useBranchStore";
import { useUserStore } from "@/lib/store/useUserStore";
import GSTDetails from "./GSTDetails";
import { toast } from "sonner";
import axios from "axios";
import { useRouter } from "next/navigation";

// ─── Zod Schema ────────────────────────────────────────────────
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
        if (!val) return true;
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
        if (!val) return true;
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

interface SearchResult {
  id: number;
  name: string;
  mobile: string;
  address?: string;
  city?: string;
  gstin?: string;
  tags?: Array<{
    id: string;
    name: string;
    label: string;
    color: string;
    type: "SYSTEM" | "MANUAL";
  }>;
}

// ─── Styles ────────────────────────────────────────────────────
const styles = {
  wrapper: {
    width: "100%",
    minHeight: "100vh",
    padding: "32px 40px",
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    color: "#e8e8e8",
    background: "#0a0a0a",
  } as React.CSSProperties,

  breadcrumb: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    letterSpacing: "1.5px",
    textTransform: "uppercase" as const,
    marginBottom: "8px",
    fontWeight: 500,
  } as React.CSSProperties,

  breadcrumbActive: {
    color: "#d4a843",
  } as React.CSSProperties,

  breadcrumbSep: {
    color: "#555",
    fontSize: "11px",
  } as React.CSSProperties,

  pageTitle: {
    fontSize: "22px",
    fontWeight: 700,
    color: "#ffffff",
    marginBottom: "4px",
    letterSpacing: "-0.3px",
  } as React.CSSProperties,

  pageSubtitle: {
    fontSize: "14px",
    color: "#888",
    marginBottom: "32px",
    fontWeight: 400,
  } as React.CSSProperties,

  splitContainer: {
    display: "grid",
    gridTemplateColumns: "1fr 1.6fr",
    gap: "24px",
    alignItems: "start",
  } as React.CSSProperties,

  // ─── Left Panel (Search) ───
  searchPanel: {
    background: "#111111",
    border: "1px solid #1e1e1e",
    borderRadius: "12px",
    padding: "28px 24px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "20px",
  } as React.CSSProperties,

  panelHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "15px",
    fontWeight: 600,
    color: "#e0e0e0",
    letterSpacing: "0.2px",
  } as React.CSSProperties,

  panelIcon: {
    color: "#d4a843",
    width: "18px",
    height: "18px",
  } as React.CSSProperties,

  searchInputWrapper: {
    position: "relative" as const,
  } as React.CSSProperties,

  searchInput: {
    width: "100%",
    padding: "12px 16px",
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: "8px",
    color: "#ccc",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
  } as React.CSSProperties,

  searchResultsList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
    maxHeight: "320px",
    overflowY: "auto" as const,
    paddingRight: "4px",
  } as React.CSSProperties,

  searchResultCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "#151515",
    border: "1px solid #252525",
    borderRadius: "10px",
    padding: "14px 16px",
    transition: "all 0.25s ease",
    cursor: "default",
  } as React.CSSProperties,

  searchResultInfo: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
  } as React.CSSProperties,

  searchResultName: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#f0f0f0",
  } as React.CSSProperties,

  searchResultMeta: {
    fontSize: "12px",
    color: "#777",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  } as React.CSSProperties,

  selectBtn: {
    padding: "8px 20px",
    background: "#2a2a2a",
    border: "1px solid #3a3a3a",
    borderRadius: "6px",
    color: "#f0f0f0",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "1.5px",
    textTransform: "uppercase" as const,
    cursor: "pointer",
    transition: "all 0.2s ease",
  } as React.CSSProperties,

  // ─── Bottom Card ───
  legacyCard: {
    marginTop: "20px",
    background:
      "linear-gradient(135deg, #1a1510 0%, #151210 50%, #111 100%)",
    border: "1px solid #2a2218",
    borderRadius: "12px",
    padding: "24px",
    position: "relative" as const,
    overflow: "hidden",
  } as React.CSSProperties,

  legacyLabel: {
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "2px",
    color: "#d4a843",
    textTransform: "uppercase" as const,
    marginBottom: "4px",
  } as React.CSSProperties,

  legacyText: {
    fontSize: "13px",
    color: "#888",
    fontStyle: "italic" as const,
  } as React.CSSProperties,

  // ─── Right Panel (Form) ───
  formPanel: {
    background: "#111111",
    border: "1px solid #1e1e1e",
    borderRadius: "12px",
    padding: "28px 28px 24px",
  } as React.CSSProperties,

  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "20px 24px",
    marginTop: "20px",
  } as React.CSSProperties,

  formGridFull: {
    gridColumn: "1 / -1",
  } as React.CSSProperties,

  fieldGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
  } as React.CSSProperties,

  fieldLabel: {
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "1.5px",
    textTransform: "uppercase" as const,
    color: "#999",
  } as React.CSSProperties,

  fieldRequired: {
    color: "#d4a843",
    marginLeft: "2px",
  } as React.CSSProperties,

  fieldInput: {
    width: "100%",
    padding: "11px 14px",
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: "8px",
    color: "#e0e0e0",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
  } as React.CSSProperties,

  fieldSelect: {
    width: "100%",
    padding: "11px 14px",
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: "8px",
    color: "#e0e0e0",
    fontSize: "14px",
    outline: "none",
    appearance: "none" as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 14px center",
    cursor: "pointer",
    transition: "border-color 0.2s, box-shadow 0.2s",
  } as React.CSSProperties,

  fieldDateInput: {
    width: "100%",
    padding: "11px 14px",
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: "8px",
    color: "#e0e0e0",
    fontSize: "14px",
    outline: "none",
    colorScheme: "dark",
    transition: "border-color 0.2s, box-shadow 0.2s",
  } as React.CSSProperties,

  fieldError: {
    fontSize: "11px",
    color: "#e55",
    marginTop: "2px",
  } as React.CSSProperties,

  gstRow: {
    display: "flex",
    gap: "8px",
    alignItems: "flex-start",
  } as React.CSSProperties,

  gstInfoBtn: {
    marginTop: "0px",
    padding: "11px 14px",
    background: "#1a1a1a",
    border: "1px solid #2a2a2a",
    borderRadius: "8px",
    color: "#d4a843",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
    flexShrink: 0,
  } as React.CSSProperties,

  // ─── Footer Actions ───
  formFooter: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "20px",
    marginTop: "32px",
    paddingTop: "24px",
    borderTop: "1px solid #1e1e1e",
  } as React.CSSProperties,

  clearBtn: {
    padding: "12px 28px",
    background: "transparent",
    border: "1px solid #333",
    borderRadius: "8px",
    color: "#ccc",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "1.5px",
    textTransform: "uppercase" as const,
    cursor: "pointer",
    transition: "all 0.2s ease",
  } as React.CSSProperties,

  submitBtn: {
    padding: "12px 32px",
    background:
      "linear-gradient(135deg, #d4a843 0%, #b8912e 100%)",
    border: "none",
    borderRadius: "8px",
    color: "#0a0a0a",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "1.5px",
    textTransform: "uppercase" as const,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    transition: "all 0.25s ease",
    boxShadow: "0 4px 20px rgba(212, 168, 67, 0.15)",
  } as React.CSSProperties,

  noResults: {
    textAlign: "center" as const,
    padding: "24px 16px",
    color: "#666",
    fontSize: "13px",
  } as React.CSSProperties,

  searchingIndicator: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "20px",
    color: "#d4a843",
    fontSize: "13px",
  } as React.CSSProperties,
};

// ─── Component ─────────────────────────────────────────────────
const AddCustomer = () => {
  const router = useRouter();
  const { selectedBranch } = useBranchStore();
  const { user } = useUserStore();
  const [gstDialogOpen, setGstDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
    watch,
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
  });

  const [cusID, setCusID] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<SearchResult | null>(null);

  const gstinValue = watch("gstin");

  // ─── Search Handler ───
  const handleSearch = useCallback(
    async (query: string) => {
      if (query.trim().length < 3) {
        setSearchResults([]);
        setHasSearched(false);
        return;
      }

      setIsSearching(true);
      setHasSearched(true);

      try {
        const res = await axios.get(
          `/api/customer/search?query=${encodeURIComponent(query.trim())}`
        );
        if (res.data.customers) {
          setSearchResults(res.data.customers);
        } else if (res.data.customer) {
          // backward compat: single result
          setSearchResults(res.data.customer ? [res.data.customer] : []);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error("Error searching:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    []
  );

  // Debounced search on input change
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => handleSearch(val), 400);
  };

  // ─── Select Existing Customer ───
  const handleSelectCustomer = (customer: SearchResult) => {
    setSelectedCustomer(customer);
    setCusID(String(customer.id));
    toast.success(`Selected: ${customer.name}`);
  };

  // ─── Form Submit ───
  const onSubmit = async (data: CustomerFormData) => {
    try {
      if (!cusID) {
        const response = await axios.post("/api/customer/create", data);
        const customer = response.data;
        toast.success("Customer created successfully!");
        router.push(`/billing/create?customerId=${customer.id}`);
      } else {
        router.push(`/billing/create?customerId=${cusID}`);
      }
    } catch (error: any) {
      console.error("Error creating customer:", error);
      toast.error(error?.response?.data?.error || "Failed to create customer");
    }
  };

  // ─── Proceed with selected customer ───
  const handleProceedWithSelected = () => {
    if (cusID) {
      router.push(`/billing/create?customerId=${cusID}`);
    }
  };

  // ─── Clear Form ───
  const handleClearForm = () => {
    reset();
    setCusID("");
    setSelectedCustomer(null);
  };

  // ─── Focus styling helper ───
  const inputFocusHandler = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = "#d4a843";
    e.target.style.boxShadow = "0 0 0 3px rgba(212,168,67,0.1)";
  };
  const inputBlurHandler = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.target.style.borderColor = "#2a2a2a";
    e.target.style.boxShadow = "none";
  };

  return (
    <div style={styles.wrapper}>
      {/* Breadcrumb */}
      <div style={styles.breadcrumb}>
        <span style={{ color: "#888" }}>HOME</span>
        <span style={styles.breadcrumbSep}>›</span>
        <span style={styles.breadcrumbActive}>CUSTOMER SELECTION</span>
      </div>

      {/* Page Header */}
      <h1 style={styles.pageTitle}>Initiate Billing</h1>
      <p style={styles.pageSubtitle}>
        Select an existing client or register a new patron to proceed.
      </p>

      {/* Split Layout */}
      <div style={styles.splitContainer}>
        {/* ════════ LEFT PANEL: Search ════════ */}
        <div>
          <div style={styles.searchPanel}>
            <div style={styles.panelHeader}>
              <Search style={styles.panelIcon} />
              <span>Search Existing Patron</span>
            </div>

            {/* Search Input */}
            <div style={styles.searchInputWrapper}>
              <input
                type="text"
                placeholder="Name, Mobile, or GSTIN"
                value={searchQuery}
                onChange={onSearchChange}
                onFocus={inputFocusHandler}
                onBlur={inputBlurHandler}
                style={styles.searchInput}
                id="patron-search-input"
              />
            </div>

            {/* Search Results */}
            {isSearching && (
              <div style={styles.searchingIndicator}>
                <Loader2
                  size={16}
                  style={{ animation: "spin 1s linear infinite" }}
                />
                <span>Searching...</span>
              </div>
            )}

            {!isSearching && searchResults.length > 0 && (
              <div style={styles.searchResultsList}>
                {searchResults.map((customer) => (
                  <div
                    key={customer.id}
                    style={{
                      ...styles.searchResultCard,
                      ...(selectedCustomer?.id === customer.id
                        ? {
                            borderColor: "#d4a843",
                            background: "#1a1710",
                          }
                        : {}),
                    }}
                    onMouseEnter={(e) => {
                      if (selectedCustomer?.id !== customer.id) {
                        e.currentTarget.style.borderColor = "#3a3a3a";
                        e.currentTarget.style.background = "#1a1a1a";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedCustomer?.id !== customer.id) {
                        e.currentTarget.style.borderColor = "#252525";
                        e.currentTarget.style.background = "#151515";
                      }
                    }}
                  >
                    <div style={styles.searchResultInfo}>
                      <div className="flex items-center gap-2">
                        <span style={styles.searchResultName}>
                          {customer.name}
                        </span>
                        {customer.tags && customer.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {customer.tags.map((tag) => {
                              const colorMap: Record<string, string> = {
                                gold: "bg-[#D4A843]/15 text-[#D4A843] border-[#D4A843]/30",
                                red: "bg-red-500/10 text-red-400 border-red-500/25",
                                blue: "bg-blue-500/10 text-blue-400 border-blue-500/25",
                                gray: "bg-gray-500/10 text-gray-400 border-gray-500/25",
                                green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
                                orange: "bg-orange-500/10 text-orange-400 border-orange-500/25",
                                purple: "bg-purple-500/10 text-purple-400 border-purple-500/25",
                              };
                              const colorClass = colorMap[tag.color.toLowerCase()] || "bg-gray-500/10 text-gray-400 border-gray-500/25";
                              return (
                                <span
                                  key={tag.id}
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-medium border ${colorClass}`}
                                  title={tag.label}
                                >
                                  {tag.label}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <span style={styles.searchResultMeta}>
                        +91 {customer.mobile.replace(/(\d{5})(\d{5})/, "$1 $2")}
                        {customer.city && (
                          <>
                            <span style={{ color: "#555" }}>•</span>
                            <span style={{ textTransform: "uppercase" }}>
                              {customer.city}
                            </span>
                          </>
                        )}
                      </span>
                    </div>
                    <button
                      type="button"
                      style={{
                        ...styles.selectBtn,
                        ...(selectedCustomer?.id === customer.id
                          ? {
                              background: "#d4a843",
                              borderColor: "#d4a843",
                              color: "#0a0a0a",
                            }
                          : {}),
                      }}
                      onClick={() => handleSelectCustomer(customer)}
                      onMouseEnter={(e) => {
                        if (selectedCustomer?.id !== customer.id) {
                          e.currentTarget.style.background = "#3a3a3a";
                          e.currentTarget.style.borderColor = "#4a4a4a";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedCustomer?.id !== customer.id) {
                          e.currentTarget.style.background = "#2a2a2a";
                          e.currentTarget.style.borderColor = "#3a3a3a";
                        }
                      }}
                    >
                      {selectedCustomer?.id === customer.id
                        ? "SELECTED"
                        : "SELECT"}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!isSearching &&
              hasSearched &&
              searchResults.length === 0 && (
                <div style={styles.noResults}>
                  <p style={{ marginBottom: "4px" }}>No patrons found.</p>
                  <p style={{ fontSize: "12px", color: "#555" }}>
                    Register a new patron using the form →
                  </p>
                </div>
              )}

            {/* Proceed button when customer is selected */}
            {selectedCustomer && (
              <button
                type="button"
                style={styles.submitBtn}
                onClick={handleProceedWithSelected}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 28px rgba(212,168,67,0.25)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 20px rgba(212,168,67,0.15)";
                }}
              >
                PROCEED WITH {selectedCustomer.name.split(" ")[0].toUpperCase()}
                <ArrowRight size={14} />
              </button>
            )}
          </div>

          {/* Legacy Card */}
          <div style={styles.legacyCard}>
            <Sparkles
              size={40}
              style={{
                position: "absolute",
                top: "16px",
                right: "20px",
                color: "#d4a843",
                opacity: 0.15,
              }}
            />
            <div style={styles.legacyLabel}>CLIENTELE</div>
            <div style={styles.legacyText}>
              The foundation of our legacy.
            </div>
          </div>
        </div>

        {/* ════════ RIGHT PANEL: Register Form ════════ */}
        <div style={styles.formPanel}>
          <div style={styles.panelHeader}>
            <UserPlus style={styles.panelIcon} />
            <span>Register New Patron</span>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div style={styles.formGrid}>
              {/* Full Name */}
              <div style={{ ...styles.fieldGroup, ...styles.formGridFull }}>
                <label style={styles.fieldLabel}>
                  FULL NAME <span style={styles.fieldRequired}>*</span>
                </label>
                <input
                  {...register("name")}
                  style={styles.fieldInput}
                  onFocus={inputFocusHandler}
                  onBlur={inputBlurHandler}
                  id="customer-name"
                />
                {errors.name && (
                  <span style={styles.fieldError}>{errors.name.message}</span>
                )}
              </div>

              {/* Mobile */}
              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>
                  MOBILE NUMBER <span style={styles.fieldRequired}>*</span>
                </label>
                <input
                  {...register("mobile")}
                  style={styles.fieldInput}
                  onFocus={inputFocusHandler}
                  onBlur={inputBlurHandler}
                  placeholder=""
                  id="customer-mobile"
                />
                {errors.mobile && (
                  <span style={styles.fieldError}>
                    {errors.mobile.message}
                  </span>
                )}
              </div>

              {/* Email */}
              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>EMAIL ADDRESS</label>
                <input
                  {...register("email")}
                  style={styles.fieldInput}
                  onFocus={inputFocusHandler}
                  onBlur={inputBlurHandler}
                  id="customer-email"
                />
                {errors.email && (
                  <span style={styles.fieldError}>
                    {errors.email.message}
                  </span>
                )}
              </div>

              {/* PAN */}
              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>PAN NUMBER</label>
                <input
                  {...register("pan")}
                  style={styles.fieldInput}
                  onFocus={inputFocusHandler}
                  onBlur={inputBlurHandler}
                  id="customer-pan"
                />
                {errors.pan && (
                  <span style={styles.fieldError}>{errors.pan.message}</span>
                )}
              </div>

              {/* GSTIN */}
              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>GSTIN</label>
                <div style={styles.gstRow}>
                  <input
                    {...register("gstin")}
                    style={{ ...styles.fieldInput, flex: 1 }}
                    onFocus={inputFocusHandler}
                    onBlur={inputBlurHandler}
                    id="customer-gstin"
                  />
                  <button
                    type="button"
                    style={styles.gstInfoBtn}
                    onClick={() => setGstDialogOpen(true)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#d4a843";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#2a2a2a";
                    }}
                  >
                    <Info size={16} />
                  </button>
                </div>
                <GSTDetails
                  open={gstDialogOpen}
                  setOpen={setGstDialogOpen}
                  GSTIN={gstinValue}
                />
                {errors.gstin && (
                  <span style={styles.fieldError}>
                    {errors.gstin.message}
                  </span>
                )}
              </div>

              {/* Address */}
              <div style={{ ...styles.fieldGroup, ...styles.formGridFull }}>
                <label style={styles.fieldLabel}>
                  PRIMARY ADDRESS <span style={styles.fieldRequired}>*</span>
                </label>
                <input
                  {...register("address")}
                  style={styles.fieldInput}
                  onFocus={inputFocusHandler}
                  onBlur={inputBlurHandler}
                  id="customer-address"
                />
                {errors.address && (
                  <span style={styles.fieldError}>
                    {errors.address.message}
                  </span>
                )}
              </div>

              {/* City */}
              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>
                  CITY <span style={styles.fieldRequired}>*</span>
                </label>
                <input
                  {...register("city")}
                  style={styles.fieldInput}
                  onFocus={inputFocusHandler}
                  onBlur={inputBlurHandler}
                  id="customer-city"
                />
                {errors.city && (
                  <span style={styles.fieldError}>{errors.city.message}</span>
                )}
              </div>

              {/* State */}
              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>
                  STATE <span style={styles.fieldRequired}>*</span>
                </label>
                <input
                  {...register("state")}
                  style={styles.fieldInput}
                  onFocus={inputFocusHandler}
                  onBlur={inputBlurHandler}
                  id="customer-state"
                />
                {errors.state && (
                  <span style={styles.fieldError}>
                    {errors.state.message}
                  </span>
                )}
              </div>

              {/* Pincode */}
              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>
                  PINCODE <span style={styles.fieldRequired}>*</span>
                </label>
                <input
                  {...register("pincode")}
                  style={styles.fieldInput}
                  onFocus={inputFocusHandler}
                  onBlur={inputBlurHandler}
                  id="customer-pincode"
                />
                {errors.pincode && (
                  <span style={styles.fieldError}>
                    {errors.pincode.message}
                  </span>
                )}
              </div>

              {/* Gender */}
              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>
                  GENDER <span style={styles.fieldRequired}>*</span>
                </label>
                <select
                  {...register("gender")}
                  style={styles.fieldSelect}
                  onFocus={inputFocusHandler as any}
                  onBlur={inputBlurHandler as any}
                  id="customer-gender"
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {errors.gender && (
                  <span style={styles.fieldError}>
                    {errors.gender.message}
                  </span>
                )}
              </div>

              {/* Date of Birth */}
              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>DATE OF BIRTH</label>
                <input
                  type="date"
                  {...register("dob")}
                  style={styles.fieldDateInput}
                  onFocus={inputFocusHandler}
                  onBlur={inputBlurHandler}
                  id="customer-dob"
                />
                {errors.dob && (
                  <span style={styles.fieldError}>{errors.dob.message}</span>
                )}
              </div>

              {/* Anniversary */}
              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>ANNIVERSARY</label>
                <input
                  type="date"
                  {...register("anniversary")}
                  style={styles.fieldDateInput}
                  onFocus={inputFocusHandler}
                  onBlur={inputBlurHandler}
                  id="customer-anniversary"
                />
                {errors.anniversary && (
                  <span style={styles.fieldError}>
                    {errors.anniversary.message}
                  </span>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div style={styles.formFooter}>
              <button
                type="button"
                style={styles.clearBtn}
                onClick={handleClearForm}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#555";
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#333";
                  e.currentTarget.style.color = "#ccc";
                }}
              >
                CLEAR FORM
              </button>
              <button
                type="submit"
                style={styles.submitBtn}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 28px rgba(212,168,67,0.25)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 20px rgba(212,168,67,0.15)";
                }}
              >
                REGISTER & PROCEED
                <ArrowRight size={14} />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Keyframe for spinner */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        /* Custom scrollbar for search results */
        div::-webkit-scrollbar {
          width: 4px;
        }
        div::-webkit-scrollbar-track {
          background: transparent;
        }
        div::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 4px;
        }
        div::-webkit-scrollbar-thumb:hover {
          background: #555;
        }

        /* Responsive */
        @media (max-width: 900px) {
          .ac-split {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AddCustomer;
