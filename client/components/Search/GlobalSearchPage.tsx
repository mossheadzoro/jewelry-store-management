"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SidebarInset } from "@/components/ui/sidebar";
import { SiteHeader } from "@/components/site-header";
import axios from "axios";
import {
  SearchEntityType,
  SearchResultDTO,
  SearchGroup,
  SearchMeta,
  SearchStage,
  ENTITY_CONFIG,
} from "@/lib/types/search";
import { useUserStore } from "@/lib/store/useUserStore";
import { useBranchStore } from "@/lib/store/useBranchStore";
import {
  IconSearch,
  IconLoader2,
  IconUser,
  IconDiamond,
  IconFileInvoice,
  IconClipboardList,
  IconCalendarEvent,
  IconHammer,
  IconBuildingFactory2,
  IconPigMoney,
  IconTag,
  IconCash,
  IconArrowRight,
  IconX,
  IconClock,
  IconBolt,
  IconChevronDown,
  IconCommand,
} from "@tabler/icons-react";

// ============================================================================
// Entity Icon Map
// ============================================================================

const ENTITY_ICONS: Record<SearchEntityType, React.ReactNode> = {
  customer: <IconUser size={18} />,
  product: <IconDiamond size={18} />,
  invoice: <IconFileInvoice size={18} />,
  order: <IconClipboardList size={18} />,
  booking: <IconCalendarEvent size={18} />,
  karigar: <IconHammer size={18} />,
  wholesaler: <IconBuildingFactory2 size={18} />,
  scheme: <IconPigMoney size={18} />,
  huid: <IconTag size={18} />,
  advance: <IconCash size={18} />,
};

// ============================================================================
// Tab Definitions
// ============================================================================

const TABS: { id: string; label: string; entities: SearchEntityType[] | null }[] = [
  { id: "all", label: "All", entities: null },
  { id: "customers", label: "Customers", entities: ["customer"] },
  { id: "products", label: "Products", entities: ["product"] },
  { id: "invoices", label: "Invoices", entities: ["invoice"] },
  { id: "orders", label: "Orders", entities: ["order"] },
  { id: "bookings", label: "Bookings", entities: ["booking"] },
  { id: "more", label: "More", entities: ["karigar", "wholesaler", "scheme", "huid", "advance"] },
];

// ============================================================================
// Badge Component (Adaptive Light / Dark)
// ============================================================================

function SearchBadge({ label, variant }: { label: string; variant: string }) {
  const colorMap: Record<string, string> = {
    success:
      "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
    warning:
      "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25",
    destructive:
      "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/25",
    gold:
      "bg-[#C9A84C]/15 text-[#9C7A2E] dark:text-[#C9A84C] border-[#C9A84C]/30",
    default:
      "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25",
    outline:
      "bg-muted/50 dark:bg-white/5 text-muted-foreground dark:text-zinc-400 border-border dark:border-zinc-700",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full border tracking-wider ${
        colorMap[variant] || colorMap.outline
      }`}
    >
      {label}
    </span>
  );
}

// ============================================================================
// Search Result Card (Adaptive Light / Dark)
// ============================================================================

function SearchResultCard({
  result,
  isSelected,
  onSelect,
}: {
  result: SearchResultDTO;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const config = ENTITY_CONFIG[result.entityType];
  const router = useRouter();

  return (
    <button
      onClick={() => {
        onSelect();
        router.push(result.navigationUrl);
      }}
      className={`
        w-full text-left p-4 rounded-xl border transition-all duration-200
        group cursor-pointer
        ${
          isSelected
            ? "bg-[#C9A84C]/10 border-[#C9A84C]/40 shadow-md shadow-[#C9A84C]/10"
            : "bg-card dark:bg-white/[0.02] border-border dark:border-white/[0.06] hover:bg-accent/50 dark:hover:bg-white/[0.05] hover:border-border/80 dark:hover:border-white/[0.12] shadow-xs dark:shadow-none"
        }
      `}
    >
      <div className="flex items-start gap-3">
        {/* Entity Icon */}
        <div
          className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-lg shadow-xs"
          style={{
            backgroundColor: `${config.color}18`,
            color: config.color,
          }}
        >
          {ENTITY_ICONS[result.entityType] || config.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <h3 className="text-sm font-semibold text-foreground dark:text-white truncate">
              {result.title}
            </h3>
            {result.badges.map((badge, i) => (
              <SearchBadge key={i} label={badge.label} variant={badge.variant} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground dark:text-zinc-500 font-mono">
            {result.subtitle}
          </p>
          <p className="text-xs text-muted-foreground dark:text-zinc-400 mt-1">
            {result.description}
          </p>

          {/* Metrics */}
          {result.metrics.length > 0 && (
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {result.metrics.map((metric, i) => (
                <span key={i} className="text-[11px] text-muted-foreground">
                  <span className="text-muted-foreground/70 dark:text-zinc-500">
                    {metric.label}:
                  </span>{" "}
                  <span className="text-foreground dark:text-zinc-200 font-medium">
                    {metric.value}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Branch & Arrow */}
        <div className="flex-shrink-0 flex flex-col items-end gap-2">
          {result.branchName && (
            <span className="text-[10px] text-muted-foreground dark:text-zinc-400 bg-muted/60 dark:bg-white/[0.03] px-2 py-0.5 rounded-full border border-border dark:border-white/[0.05]">
              {result.branchName}
            </span>
          )}
          <IconArrowRight
            size={14}
            className="text-muted-foreground dark:text-zinc-600 group-hover:text-[#C9A84C] group-hover:translate-x-0.5 transition-all"
          />
        </div>
      </div>
    </button>
  );
}

// ============================================================================
// Result Group Section
// ============================================================================

function ResultGroupSection({
  group,
  results,
  selectedIndex,
  onSelectResult,
  onViewAll,
}: {
  group: SearchGroup;
  results: SearchResultDTO[];
  selectedIndex: number;
  onSelectResult: (index: number) => void;
  onViewAll: () => void;
}) {
  const config = ENTITY_CONFIG[group.entityType];

  return (
    <div className="mb-6">
      {/* Group Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span
            className="w-5 h-5 rounded flex items-center justify-center text-xs"
            style={{ backgroundColor: `${config.color}20`, color: config.color }}
          >
            {ENTITY_ICONS[group.entityType]}
          </span>
          <h2 className="text-xs font-semibold text-muted-foreground dark:text-zinc-400 uppercase tracking-wider">
            {group.label}
          </h2>
          <span className="text-[10px] text-muted-foreground dark:text-zinc-400 bg-muted/60 dark:bg-white/[0.03] px-1.5 py-0.5 rounded-full border border-border/50 dark:border-white/[0.05]">
            {group.count}
          </span>
        </div>
        {group.count > 3 && (
          <button
            onClick={onViewAll}
            className="text-[11px] text-[#C9A84C] hover:text-[#E8C96A] font-medium transition-colors flex items-center gap-1 cursor-pointer"
          >
            View all
            <IconArrowRight size={12} />
          </button>
        )}
      </div>

      {/* Branch Breakdown (Admin) */}
      {group.branchBreakdown && Object.keys(group.branchBreakdown).length > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-3 px-1">
          {Object.entries(group.branchBreakdown).map(([branch, count]) => (
            <span
              key={branch}
              className="text-[10px] text-muted-foreground dark:text-zinc-400 bg-muted/40 dark:bg-white/[0.03] px-2 py-0.5 rounded-full border border-border dark:border-white/[0.05]"
            >
              {branch}: {count}
            </span>
          ))}
        </div>
      )}

      {/* Results */}
      <div className="space-y-2">
        {results.map((result, i) => (
          <SearchResultCard
            key={`${result.entityType}-${result.id}`}
            result={result}
            isSelected={selectedIndex === i}
            onSelect={() => onSelectResult(i)}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Scope Selector (Admin/Manager)
// ============================================================================

function ScopeSelector({
  currentScope,
  onScopeChange,
  userRole,
}: {
  currentScope: string;
  onScopeChange: (scope: string) => void;
  userRole: string;
}) {
  const { branches } = useBranchStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (userRole !== "ADMIN" && userRole !== "MANAGER") return null;

  const currentLabel =
    currentScope === "all"
      ? "All Branches"
      : branches.find((b) => b.id === parseInt(currentScope))?.name || "All Branches";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs
          bg-card dark:bg-white/[0.03] border border-border dark:border-white/[0.08]
          text-muted-foreground hover:text-foreground
          hover:bg-accent dark:hover:bg-white/[0.06] transition-all cursor-pointer shadow-xs"
      >
        <span className="text-muted-foreground/70">Scope:</span>
        <span className="text-foreground dark:text-zinc-200 font-medium">
          {currentLabel}
        </span>
        <IconChevronDown
          size={12}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 sm:left-0 mt-1 w-52 bg-popover dark:bg-zinc-900 border border-border dark:border-white/[0.08] rounded-lg shadow-xl z-50 py-1 backdrop-blur-md">
          <button
            onClick={() => {
              onScopeChange("all");
              setIsOpen(false);
            }}
            className={`w-full text-left px-3 py-2 text-xs hover:bg-accent dark:hover:bg-white/[0.05] transition-colors cursor-pointer ${
              currentScope === "all"
                ? "text-[#C9A84C] font-semibold"
                : "text-popover-foreground dark:text-zinc-300"
            }`}
          >
            All Branches
          </button>
          {branches.map((branch) => (
            <button
              key={branch.id}
              onClick={() => {
                onScopeChange(String(branch.id));
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs hover:bg-accent dark:hover:bg-white/[0.05] transition-colors cursor-pointer ${
                currentScope === String(branch.id)
                  ? "text-[#C9A84C] font-semibold"
                  : "text-popover-foreground dark:text-zinc-300"
              }`}
            >
              {branch.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Recent Searches
// ============================================================================

function getRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("search_recent");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addRecentSearch(query: string) {
  if (typeof window === "undefined") return;
  try {
    const recent = getRecentSearches().filter((q) => q !== query);
    recent.unshift(query);
    localStorage.setItem("search_recent", JSON.stringify(recent.slice(0, 10)));
  } catch {}
}

// ============================================================================
// Empty State (Adaptive Light / Dark)
// ============================================================================

function EmptyState({
  query,
  recentSearches,
  onRecentClick,
}: {
  query: string;
  recentSearches: string[];
  onRecentClick: (q: string) => void;
}) {
  if (query) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-muted/50 dark:bg-white/[0.03] border border-border dark:border-white/[0.06] flex items-center justify-center mb-4">
          <IconSearch size={24} className="text-muted-foreground dark:text-zinc-600" />
        </div>
        <h3 className="text-sm font-medium text-foreground dark:text-zinc-300 mb-1">
          No results found
        </h3>
        <p className="text-xs text-muted-foreground dark:text-zinc-500 text-center max-w-xs">
          Try adjusting your search query or check a different category
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#C9A84C]/20 to-[#C9A84C]/5 border border-[#C9A84C]/20 flex items-center justify-center mb-6 shadow-sm">
        <IconSearch size={32} className="text-[#C9A84C]" />
      </div>
      <h3 className="text-base font-semibold text-foreground dark:text-zinc-200 mb-2">
        Search your entire ERP
      </h3>
      <p className="text-xs text-muted-foreground dark:text-zinc-400 text-center max-w-sm mb-6">
        Search across customers, products, invoices, orders, bookings, and more.
        Try typing a name, invoice number, mobile, HUID, or barcode.
      </p>

      {/* Search Suggestions */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {[
          "Customer name",
          "INV-MAI-...",
          "Mobile number",
          "HUID",
          "Product code",
          "Order number",
        ].map((hint) => (
          <span
            key={hint}
            className="text-[10px] text-muted-foreground dark:text-zinc-400 bg-muted/50 dark:bg-white/[0.02] px-3 py-1 rounded-full border border-border dark:border-white/[0.05]"
          >
            {hint}
          </span>
        ))}
      </div>

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <div className="w-full max-w-md">
          <h4 className="text-[11px] text-muted-foreground dark:text-zinc-500 uppercase tracking-wider font-medium mb-2 flex items-center gap-1.5">
            <IconClock size={12} />
            Recent Searches
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {recentSearches.map((q) => (
              <button
                key={q}
                onClick={() => onRecentClick(q)}
                className="text-xs text-foreground dark:text-zinc-300 bg-card dark:bg-white/[0.03] hover:bg-accent dark:hover:bg-white/[0.06] px-3 py-1.5 rounded-lg border border-border dark:border-white/[0.05] hover:border-border/80 dark:hover:border-white/[0.1] transition-all cursor-pointer shadow-xs"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Search Page (Adaptive Light / Dark)
// ============================================================================

export default function GlobalSearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUserStore();

  // State
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState<SearchResultDTO[]>([]);
  const [groups, setGroups] = useState<SearchGroup[]>([]);
  const [meta, setMeta] = useState<SearchMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [scope, setScope] = useState("all");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [stage, setStage] = useState<SearchStage>("instant");

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Load recent searches
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Search function
  const performSearch = useCallback(
    async (
      searchQuery: string,
      searchStage: SearchStage = "instant",
      entityFilter?: string
    ) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setGroups([]);
        setMeta(null);
        return;
      }

      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          q: searchQuery.trim(),
          stage: searchStage,
          scope,
          limit: searchStage === "instant" ? "5" : "20",
        });

        if (entityFilter && entityFilter !== "all") {
          const tabEntities = TABS.find((t) => t.id === entityFilter)?.entities;
          if (tabEntities && tabEntities.length === 1) {
            params.set("entity", tabEntities[0]);
          }
        }

        const res = await axios.get(`/api/search/global?${params.toString()}`);
        setResults(res.data.results || []);
        setGroups(res.data.groups || []);
        setMeta(res.data.meta || null);

        if (searchQuery.trim().length >= 2) {
          addRecentSearch(searchQuery.trim());
          setRecentSearches(getRecentSearches());
        }
      } catch (error) {
        console.error("Search failed:", error);
        setResults([]);
        setGroups([]);
      } finally {
        setIsLoading(false);
      }
    },
    [scope]
  );

  // Debounced search on query change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      setGroups([]);
      setMeta(null);
      return;
    }

    debounceRef.current = setTimeout(() => {
      performSearch(query, "instant", activeTab);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, performSearch, activeTab]);

  // Re-search when scope changes
  useEffect(() => {
    if (query.trim()) {
      performSearch(query, stage, activeTab);
    }
  }, [scope]);

  // Handle tab change
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (query.trim()) {
      const newStage: SearchStage = tabId === "all" ? "instant" : "expanded";
      setStage(newStage);
      performSearch(query, newStage, tabId);
    }
  };

  // Handle "View all" for a group
  const handleViewAll = (entityType: SearchEntityType) => {
    const tab = TABS.find((t) => t.entities?.includes(entityType));
    if (tab) {
      handleTabChange(tab.id);
    }
  };

  // Handle expanding to full search
  const handleExpandSearch = () => {
    setStage("expanded");
    performSearch(query, "expanded", activeTab);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredResults.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, -1));
      } else if (e.key === "Enter" && selectedIndex >= 0) {
        const result = filteredResults[selectedIndex];
        if (result) {
          router.push(result.navigationUrl);
        }
      } else if (e.key === "Escape") {
        inputRef.current?.blur();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, results, router]);

  // Filter results by active tab
  const filteredResults =
    activeTab === "all"
      ? results
      : results.filter((r) => {
          const tabDef = TABS.find((t) => t.id === activeTab);
          return tabDef?.entities?.includes(r.entityType);
        });

  // Group results for "All" tab
  const groupedResults =
    activeTab === "all"
      ? groups
          .filter((g) => g.count > 0)
          .map((g) => ({
            group: g,
            results: results.filter((r) => r.entityType === g.entityType),
          }))
      : [];

  return (
    <SidebarInset>
      <SiteHeader />
      <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
        {/* Search Header Bar */}
        <div className="sticky top-0 z-30 bg-background/95 dark:bg-zinc-950/95 backdrop-blur-xl border-b border-border dark:border-white/[0.06] transition-colors">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-4">
            {/* Search Input Box */}
            <div className="relative group">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#C9A84C]/15 via-transparent to-[#C9A84C]/15 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-xl pointer-events-none" />
              <div className="relative flex items-center bg-card dark:bg-white/[0.03] border border-border dark:border-white/[0.08] rounded-2xl group-focus-within:border-[#C9A84C]/50 transition-all duration-300 shadow-sm dark:shadow-none">
                <IconSearch
                  size={20}
                  className="ml-4 text-muted-foreground dark:text-zinc-500 group-focus-within:text-[#C9A84C] transition-colors"
                />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search customers, products, invoices, orders, bookings, HUIDs..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIndex(-1);
                  }}
                  className="flex-1 bg-transparent px-3 py-4 text-sm text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-zinc-500 focus:outline-none"
                />
                {query && (
                  <button
                    onClick={() => {
                      setQuery("");
                      inputRef.current?.focus();
                    }}
                    className="mr-2 p-1.5 rounded-lg hover:bg-muted dark:hover:bg-white/[0.05] text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                    aria-label="Clear search"
                  >
                    <IconX size={14} />
                  </button>
                )}
                {isLoading && (
                  <IconLoader2 size={16} className="mr-4 text-[#C9A84C] animate-spin" />
                )}
                <div className="mr-4 hidden sm:flex items-center gap-1 px-2 py-1 rounded-md bg-muted/60 dark:bg-white/[0.03] border border-border dark:border-white/[0.06]">
                  <IconCommand size={10} className="text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground font-mono">K</span>
                </div>
              </div>
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between mt-4 gap-2 flex-wrap">
              {/* Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer
                      ${
                        activeTab === tab.id
                          ? "bg-[#C9A84C]/15 text-[#9C7A2E] dark:text-[#C9A84C] border border-[#C9A84C]/30 shadow-xs font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/60 dark:hover:bg-white/[0.03] border border-transparent"
                      }
                    `}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Scope Selector */}
              <div className="flex items-center gap-2">
                <ScopeSelector
                  currentScope={scope}
                  onScopeChange={setScope}
                  userRole={user?.systemRole || "SALESMAN"}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Results Area */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          {/* Meta Bar */}
          {meta && meta.totalResults > 0 && (
            <div className="flex items-center justify-between mb-4 px-1 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-medium">
                  {meta.totalResults} result{meta.totalResults !== 1 ? "s" : ""}
                </span>
                <span className="text-[10px] text-muted-foreground/50">·</span>
                <span className="text-[10px] text-muted-foreground">{meta.searchTimeMs}ms</span>
                {meta.scope === "global" && (
                  <>
                    <span className="text-[10px] text-muted-foreground/50">·</span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <IconBolt size={10} className="text-[#C9A84C]" />
                      Global
                    </span>
                  </>
                )}
              </div>

              {stage === "instant" && query.trim() && (
                <button
                  onClick={handleExpandSearch}
                  className="text-[11px] text-[#C9A84C] hover:text-[#E8C96A] font-medium transition-colors flex items-center gap-1 cursor-pointer"
                >
                  Search all categories
                  <IconArrowRight size={12} />
                </button>
              )}
            </div>
          )}

          {/* Loading Skeletons */}
          {isLoading && results.length === 0 && (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border border-border dark:border-white/[0.04] bg-card dark:bg-white/[0.01] animate-pulse"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted dark:bg-white/[0.03]" />
                    <div className="flex-1">
                      <div className="h-3.5 bg-muted dark:bg-white/[0.04] rounded w-40 mb-2" />
                      <div className="h-2.5 bg-muted/70 dark:bg-white/[0.03] rounded w-24 mb-2" />
                      <div className="h-2.5 bg-muted/50 dark:bg-white/[0.02] rounded w-64" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Grouped Results ("All" tab) */}
          {!isLoading && activeTab === "all" && groupedResults.length > 0 && (
            <div>
              {groupedResults.map(({ group, results: groupResults }) => (
                <ResultGroupSection
                  key={group.entityType}
                  group={group}
                  results={groupResults}
                  selectedIndex={-1}
                  onSelectResult={() => {}}
                  onViewAll={() => handleViewAll(group.entityType)}
                />
              ))}
            </div>
          )}

          {/* Flat Results (filtered tab) */}
          {!isLoading && activeTab !== "all" && filteredResults.length > 0 && (
            <div className="space-y-2">
              {filteredResults.map((result, i) => (
                <SearchResultCard
                  key={`${result.entityType}-${result.id}`}
                  result={result}
                  isSelected={selectedIndex === i}
                  onSelect={() => setSelectedIndex(i)}
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading &&
            filteredResults.length === 0 &&
            (activeTab === "all" ? groupedResults.length === 0 : true) && (
              <EmptyState
                query={query}
                recentSearches={recentSearches}
                onRecentClick={(q) => {
                  setQuery(q);
                  inputRef.current?.focus();
                }}
              />
            )}

          {/* Stage Indicator */}
          {stage === "instant" && meta && meta.totalResults > 0 && !isLoading && (
            <div className="mt-8 flex justify-center">
              <button
                onClick={handleExpandSearch}
                className="group flex items-center gap-2 px-5 py-2.5 rounded-xl
                  bg-card dark:bg-white/[0.02] border border-border dark:border-white/[0.06]
                  hover:bg-[#C9A84C]/10 dark:hover:bg-[#C9A84C]/5 hover:border-[#C9A84C]/30 dark:hover:border-[#C9A84C]/15
                  transition-all duration-300 cursor-pointer shadow-xs"
              >
                <IconSearch
                  size={14}
                  className="text-muted-foreground group-hover:text-[#C9A84C] transition-colors"
                />
                <span className="text-xs text-muted-foreground group-hover:text-foreground dark:group-hover:text-zinc-200 transition-colors">
                  Search Karigars, Wholesalers, Schemes, HUIDs, and more
                </span>
                <IconArrowRight
                  size={12}
                  className="text-muted-foreground group-hover:text-[#C9A84C] group-hover:translate-x-0.5 transition-all"
                />
              </button>
            </div>
          )}
        </div>
      </div>
    </SidebarInset>
  );
}
