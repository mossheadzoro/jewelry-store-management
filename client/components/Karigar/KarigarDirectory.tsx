"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useBranchStore } from "@/lib/store/useBranchStore"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  Hammer,
  Building2,
  Sparkles,
  Phone,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ShieldCheck,
  AlertCircle,
} from "lucide-react"

export default function KarigarDirectory() {
  const router = useRouter()
  const { selectedBranch } = useBranchStore()

  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [department, setDepartment] = useState<string | undefined>()
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()

  // Debounce search — only update after 300ms pause
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  const { data: queryData, isLoading: loading, error: queryError, refetch: fetchData } = useQuery({
    queryKey: ["karigars", search, department, page],
    queryFn: async () => {
      const qs = new URLSearchParams({
        search,
        page: page.toString(),
        ...(department && department !== "ALL" ? { department } : {}),
      })
      const listRes = await fetch(`/api/karigar/fetchAll?${qs}`)
      if (!listRes.ok) throw new Error("Failed to load karigars list")
      return listRes.json()
    },
    placeholderData: (prev: any) => prev,
  })

  const karigars = queryData?.data || []
  const meta = queryData ? { totalPages: queryData.totalPages || 1, total: queryData.total || karigars.length } : null
  const error = queryError?.message || null

  // Derive stats from karigars array
  const totalCount = meta?.total || karigars.length
  const activeCount = karigars.filter((k) => k.isActive).length
  const totalMetalHeld = karigars.reduce((sum, k) => sum + (k.currentBalanceMetal || 0), 0)
  const totalCashHeld = karigars.reduce((sum, k) => sum + (k.currentBalanceCash || 0), 0)
  const totalActiveJobs = karigars.reduce((sum, k) => sum + (k.activeJobsCount || 0), 0)

  return (
    <div className="p-6 md:p-8 space-y-8 w-full max-w-[1600px] mx-auto min-h-screen text-foreground">
      {/* HEADER WITH BRANCH BRANDING */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5 font-serif">
              <Hammer className="w-8 h-8 text-[#C9943A]" />
              Master Artisans (Karigar Panel)
            </h1>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C9943A]/10 border border-[#C9943A]/30 text-[#C9943A] text-[11px] font-bold uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5" />
              {selectedBranch?.name || "Main Branch"}
            </span>
          </div>
          <p className="text-muted-foreground text-sm mt-1.5">
            Manage registered karigars, issue raw bullion, track held fine metal & cash balances & workshop jobs.
          </p>
        </div>

        <Link
          href="/karigar/add"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#C9943A] to-[#E8B84B] px-5 py-2.5 text-foreground font-bold text-sm shadow-lg hover:brightness-110 active:scale-95 transition-all cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4 text-foreground stroke-[3]" />
          Add New Karigar
        </Link>
      </div>

      {/* ERROR ALERT BANNER */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center justify-between text-red-400 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} className="border-red-500/40 text-red-300 hover:bg-red-500/20">
            Retry
          </Button>
        </div>
      )}

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Registered Karigars"
          value={`${totalCount} Artisans`}
          subtext={`${activeCount} Active in Workshop`}
          icon={<Hammer className="w-5 h-5 text-[#C9943A]" />}
          border="border-[#C9943A]/30 bg-[#1A160E]/50"
        />
        <StatCard
          label="Net Fine Metal Balance"
          value={totalMetalHeld < 0 ? `DUE: ${Math.abs(totalMetalHeld).toFixed(3)} g` : `${totalMetalHeld.toFixed(3)} g`}
          subtext={totalMetalHeld < 0 ? "Metal Due to Karigars" : "In Karigar custody"}
          icon={<Sparkles className={`w-5 h-5 ${totalMetalHeld < 0 ? "text-rose-400" : "text-cyan-400"}`} />}
          border={totalMetalHeld < 0 ? "border-rose-500/40 bg-rose-950/20" : "border-cyan-500/30 bg-cyan-950/20"}
        />
        <StatCard
          label="Net Cash Balance"
          value={totalCashHeld < 0 ? `DUE: ₹${Math.abs(totalCashHeld).toLocaleString("en-IN")}` : `₹${totalCashHeld.toLocaleString("en-IN")}`}
          subtext={totalCashHeld < 0 ? "Labour / Cash Due to Karigars" : "Cash advanced to Karigars"}
          icon={<ShieldCheck className={`w-5 h-5 ${totalCashHeld < 0 ? "text-amber-400" : "text-emerald-400"}`} />}
          border={totalCashHeld < 0 ? "border-amber-500/40 bg-amber-950/20" : "border-emerald-500/30 bg-emerald-950/20"}
        />
        <StatCard
          label="Active Workshop Jobs"
          value={`${totalActiveJobs} Open Jobs`}
          subtext="Crafting in progress"
          icon={<Building2 className="w-5 h-5 text-purple-400" />}
          border="border-purple-500/30 bg-purple-950/20"
        />
      </div>

      {/* FILTERS */}
      <div className="bg-[#121214] border border-border rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by artisan name or phone number..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
            }}
            className="pl-10 h-11 bg-card/80 border-border text-foreground placeholder:text-muted-foreground rounded-xl focus:border-[#C9943A]/60"
          />
        </div>

        <Select
          value={department || "ALL"}
          onValueChange={(val) => {
            setDepartment(val)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full md:w-60 h-11 bg-card border-border text-foreground/90 rounded-xl">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border text-foreground">
            <SelectItem value="ALL">All Departments</SelectItem>
            <SelectItem value="GOLD">Gold Department</SelectItem>
            <SelectItem value="SILVER">Silver Department</SelectItem>
            <SelectItem value="DIAMOND">Diamond Department</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* TABLE */}
      <div className="bg-[#121214] border border-border rounded-2xl overflow-hidden shadow-2xl">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 text-[#C9943A] animate-spin" />
            <p className="text-sm font-medium">Fetching karigars for {selectedBranch?.name || "branch"}…</p>
          </div>
        ) : karigars.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground space-y-2">
            <Hammer className="w-12 h-12 stroke-1 text-zinc-600 mb-1" />
            <p className="text-base font-semibold text-foreground/90">No Karigars Found</p>
            <p className="text-xs max-w-sm">No master artisans match your search filter for {selectedBranch?.name || "this branch"}.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-[#0A0A0C] border-b border-border text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Artisan Details</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Contact Phone</th>
                  <th className="px-6 py-4">Metal Balance / Due</th>
                  <th className="px-6 py-4">Cash Balance / Due</th>
                  <th className="px-6 py-4 text-center">Active Jobs</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-zinc-850">
                {karigars.map((k: any) => (
                  <tr key={k.id} className="hover:bg-card/50 transition-colors">
                    {/* NAME */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[#C9943A]/40 bg-secondary flex-shrink-0">
                          <Image
                            src={k.profilePhoto || "/avatar.png"}
                            alt={k.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <button
                            onClick={() => router.push(`/karigar/${k.id}`)}
                            className="font-bold text-foreground hover:text-[#C9943A] transition text-left block"
                          >
                            {k.name}
                          </button>
                          <span className="text-[11px] font-mono text-muted-foreground block">
                            ID: #{k.id.slice(-6).toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* DEPARTMENT */}
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-lg bg-card border border-border text-xs font-semibold text-foreground/90">
                        {k.department}
                      </span>
                    </td>

                    {/* PHONE */}
                    <td className="px-6 py-4 font-mono text-foreground/90">
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#C9943A]" />
                        {k.phoneNumber}
                      </span>
                    </td>

                    {/* METAL BALANCE / DUE */}
                    <td className="px-6 py-4 font-mono">
                      { (k.currentBalanceMetal || 0) < 0 ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/30 text-xs font-bold tracking-tight">
                          DUE: {Math.abs(k.currentBalanceMetal).toFixed(3)} g
                        </span>
                      ) : (k.currentBalanceMetal || 0) > 0 ? (
                        <span className="text-emerald-400 font-bold text-sm">
                          {(k.currentBalanceMetal).toFixed(3)} g
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">0.000 g</span>
                      )}
                    </td>

                    {/* CASH BALANCE / DUE */}
                    <td className="px-6 py-4 font-mono">
                      { (k.currentBalanceCash || 0) < 0 ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 text-xs font-bold tracking-tight">
                          DUE: ₹{Math.abs(k.currentBalanceCash).toLocaleString("en-IN")}
                        </span>
                      ) : (k.currentBalanceCash || 0) > 0 ? (
                        <span className="text-emerald-400 font-bold text-sm">
                          ₹{(k.currentBalanceCash).toLocaleString("en-IN")}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">₹0</span>
                      )}
                    </td>

                    {/* ACTIVE JOBS */}
                    <td className="px-6 py-4 text-center font-mono font-semibold text-cyan-400">
                      {k.activeJobsCount || 0}
                    </td>

                    {/* STATUS */}
                    <td className="px-6 py-4 text-center">
                      <Badge
                        className={
                          k.isActive
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold"
                            : "bg-rose-500/15 text-rose-400 border border-rose-500/30 font-semibold"
                        }
                      >
                        {k.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>

                    {/* ACTIONS */}
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/karigar/${k.id}`)}
                        className="border-border hover:border-[#C9943A] text-foreground/90 hover:text-foreground rounded-lg text-xs"
                      >
                        View Profile
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-[#0A0A0C] text-xs text-muted-foreground">
          <span>
            Page <strong className="text-foreground">{page}</strong> of <strong className="text-foreground">{meta?.totalPages || 1}</strong> ({meta?.total || 0} Karigars)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="border-border text-foreground/90 hover:bg-card"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= (meta?.totalPages || 1)}
              onClick={() => setPage(page + 1)}
              className="border-border text-foreground/90 hover:bg-card"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  subtext,
  icon,
  border,
}: {
  label: string
  value: string
  subtext: string
  icon: React.ReactNode
  border: string
}) {
  return (
    <div className={`rounded-2xl border ${border} p-5 flex flex-col justify-between shadow-xl transition-all duration-300`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className="p-2 rounded-xl bg-white/5 border border-white/10">{icon}</div>
      </div>
      <div>
        <h2 className="text-2xl font-extrabold text-foreground tracking-tight font-mono">{value}</h2>
        <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
      </div>
    </div>
  )
}
