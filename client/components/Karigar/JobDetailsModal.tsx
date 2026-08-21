"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Hammer,
  Sparkles,
  Calendar,
  Layers,
  Coins,
  Scale,
  Loader2,
  Phone,
  User,
  CheckCircle2,
  Clock,
  ArrowRight,
  FileText,
  Building2,
} from "lucide-react"

export interface JobDetailsModalProps {
  jobId?: string
  jobData?: any
  isOpen: boolean
  onClose: () => void
}

export default function JobDetailsModal({
  jobId,
  jobData,
  isOpen,
  onClose,
}: JobDetailsModalProps) {
  const [job, setJob] = useState<any>(jobData || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      if (jobData) {
        setJob(jobData)
      } else if (jobId) {
        setLoading(true)
        setError(null)
        fetch(`/api/karigar/job/${jobId}`)
          .then((res) => {
            if (!res.ok) throw new Error("Failed to load job details")
            return res.json()
          })
          .then((data) => {
            setJob(data.job || null)
          })
          .catch((err: any) => {
            setError(err.message || "Error fetching job details")
          })
          .finally(() => {
            setLoading(false)
          })
      }
    }
  }, [isOpen, jobId, jobData])

  if (!isOpen) return null

  // In India, 99.5% purity is standard 24K — fine weight = gross weight
  const effectiveIssuedPurity = job ? ((job.issuedPurity || 1.0) >= 0.995 ? 1.0 : (job.issuedPurity || 1.0)) : 1.0
  const issuedFineWeight = job ? (job.issuedWeight * effectiveIssuedPurity) : 0
  // Dynamically compute returned fine using exact Mode A / Mode B formulas from Receiving Modal
  let returnedFineWeight = 0
  if (job) {
    if (job.jewelleryItems && job.jewelleryItems.length > 0) {
      const w = (job.wastagePercent || 0) / 100
      const mode = job.calculationMode || (job.remarks?.includes("MODE_B") ? "MODE_B" : "MODE_A")
      if (mode === "MODE_B") {
        returnedFineWeight = job.jewelleryItems.reduce((sum: number, item: any) => sum + (Number(item.weight) * ((Number(item.tonch) || 0.92) + w)), 0)
      } else {
        returnedFineWeight = job.jewelleryItems.reduce((sum: number, item: any) => sum + (Number(item.weight) * (1 + w) * (Number(item.tonch) || 0.92)), 0)
      }
    } else {
      returnedFineWeight = (job.fineUsed || 0) + (job.fineWastage || 0)
    }
  }
  const totalReceivedWeight = job?.jewelleryItems ? job.jewelleryItems.reduce((sum: number, item: any) => sum + (Number(item.weight) || 0), 0) : 0

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-4xl w-[95vw] lg:max-w-5xl max-h-[92vh] overflow-y-auto bg-[#0F0F12] border-border text-foreground p-6 shadow-2xl rounded-2xl select-none">
        <DialogHeader className="border-b border-border pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-[#C9943A]/10 border border-[#C9943A]/30 text-[#C9943A]">
                <Hammer className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-xl font-bold font-mono tracking-tight text-foreground">
                    Job #{job?.id ? job.id.slice(-6).toUpperCase() : (jobId?.slice(-6).toUpperCase() || "")}
                  </DialogTitle>
                  <Badge
                    className={
                      job?.status === "OPEN"
                        ? "bg-blue-500/15 text-blue-400 border border-blue-500/30 font-semibold"
                        : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold"
                    }
                  >
                    {job?.status || "LOADING..."}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-[#C9943A]" />
                  Created: {job?.createdAt ? new Date(job.createdAt).toLocaleString() : "-"}
                  {job?.closedAt && (
                    <>
                      <span className="text-zinc-600">•</span>
                      <span>Closed: {new Date(job.closedAt).toLocaleString()}</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* ARTISAN BADGE */}
            {job?.karigar && (
              <div className="flex items-center gap-2 bg-card border border-border px-3.5 py-2 rounded-xl">
                <User className="w-4 h-4 text-[#C9943A]" />
                <div className="text-right text-xs">
                  <span className="font-bold text-foreground block">{job.karigar.name}</span>
                  <span className="text-[10px] text-muted-foreground block">{job.karigar.department} Dept {job.karigar.phoneNumber ? `• 📞 ${job.karigar.phoneNumber}` : ""}</span>
                </div>
              </div>
            )}
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
            <Loader2 className="w-8 h-8 text-[#C9943A] animate-spin" />
            <p className="text-xs">Loading complete job ledger details...</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
            {error}
          </div>
        ) : !job ? (
          <div className="text-center py-12 text-muted-foreground">Job information not available.</div>
        ) : (
          <div className="space-y-6 pt-2">

            {/* SECTION 1: ISSUED RAW METAL & CASH ADVANCE */}
            <div>
              <h4 className="text-xs font-bold text-[#C9943A] uppercase tracking-wider mb-3 flex items-center gap-1.5 font-serif">
                <Sparkles className="w-4 h-4 text-[#C9943A]" /> Issued Raw Metal & Cash Advance
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                <div className="bg-card/80 border border-border p-3.5 rounded-xl">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">Issued Gross Wt</span>
                  <span className="text-lg font-bold text-foreground">{job.issuedWeight.toFixed(3)} <span className="text-xs text-muted-foreground font-normal">g</span></span>
                </div>
                <div className="bg-card/80 border border-border p-3.5 rounded-xl">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">Issued Purity</span>
                  <span className="text-lg font-bold text-[#C9943A]">{(job.issuedPurity * 100).toFixed(1)} %</span>
                </div>
                <div className="bg-card/80 border border-border p-3.5 rounded-xl">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">Issued Fine Gold</span>
                  <span className="text-lg font-bold text-cyan-400">{issuedFineWeight.toFixed(3)} <span className="text-xs text-muted-foreground font-normal">g</span></span>
                </div>
                <div className="bg-card/80 border border-border p-3.5 rounded-xl">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase block">Cash Advanced</span>
                  <span className="text-lg font-bold text-emerald-400">₹{(job.cashIssued || 0).toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            {/* SECTION 2: WORKSHOP SETTLEMENT METRICS (IF CLOSED) */}
            {job.status === "CLOSED" && (
              <div className="bg-background border border-border rounded-2xl p-4 space-y-3 font-mono">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="font-bold flex items-center gap-2 text-zinc-200 text-xs uppercase tracking-wider font-sans">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Workshop Settlement Summary ({job.calculationMode || "MODE_A"})
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Wastage Allowed: <b className="text-foreground">{job.wastagePercent || 0}%</b>
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase block">Base Fine Content</span>
                    <span className="text-base font-bold text-foreground">{(job.fineUsed || 0).toFixed(3)} g</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase block">Fine Gold Wastage</span>
                    <span className="text-base font-bold text-[#C9943A]">{(job.fineWastage || 0).toFixed(3)} g</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase block">Total Fine Accounted</span>
                    <span className="text-base font-extrabold text-cyan-400">{returnedFineWeight.toFixed(3)} g</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase block">Labour / Cash Paid</span>
                    <span className="text-base font-bold text-amber-400">₹{(job.cashPaid || 0).toLocaleString("en-IN")}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border/80 pt-3 mt-2">
                  <span className="text-xs text-muted-foreground font-sans font-bold">Remaining Raw Balance:</span>
                  <span className={`text-xl font-bold ${ (job.remainingRawMetal || 0) < 0 ? "text-rose-400" : "text-emerald-400" }`}>
                    {(job.remainingRawMetal || 0).toFixed(3)} g {job.remainingAction ? `(${job.remainingAction})` : ""}
                  </span>
                </div>
              </div>
            )}

            {/* SECTION 3: CRAFTED JEWELLERY ITEMS TABLE */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-foreground/90 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#C9943A]" /> Produced Jewellery Items Output
                </h4>
                <span className="text-xs text-muted-foreground font-mono">
                  Total Received Wt: <b className="text-foreground font-bold">{totalReceivedWeight.toFixed(3)} g</b>
                </span>
              </div>

              {!job.jewelleryItems || job.jewelleryItems.length === 0 ? (
                <div className="bg-card/40 border border-border rounded-xl p-4 text-center text-muted-foreground text-xs">
                  No crafted jewellery items registered for this job yet.
                </div>
              ) : (
                <div className="bg-card border border-border rounded-xl overflow-hidden shadow-inner">
                  <table className="w-full text-xs text-left font-mono">
                    <thead className="bg-[#0A0A0C] border-b border-border text-[10px] font-bold text-muted-foreground uppercase">
                      <tr>
                        <th className="px-4 py-3">Item #</th>
                        <th className="px-4 py-3">Purity / Karat</th>
                        <th className="px-4 py-3 text-right">Gross Weight</th>
                        <th className="px-4 py-3 text-right">Purity Tonch</th>
                        <th className="px-4 py-3 text-right">Calculated Fine Gold</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {job.jewelleryItems.map((item: any, idx: number) => (
                        <tr key={item.id || idx} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 text-muted-foreground font-semibold">#{idx + 1}</td>
                          <td className="px-4 py-3 font-bold text-foreground">{item.purity || "K22"}</td>
                          <td className="px-4 py-3 text-right text-yellow-500 font-bold">{(item.weight || 0).toFixed(3)} g</td>
                          <td className="px-4 py-3 text-right text-foreground/90">{((item.tonch || 0.92) * 100).toFixed(1)}%</td>
                          <td className="px-4 py-3 text-right text-cyan-400 font-bold">{(item.fineGold || 0).toFixed(3)} g</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* REMARKS */}
            {job.remarks && (
              <div className="bg-card/60 border border-border rounded-xl p-3.5 text-xs text-foreground/90">
                <span className="font-bold text-[#C9943A] block mb-1 uppercase text-[10px]">Job Remarks & Audit Notes:</span>
                <p className="font-mono text-foreground/90">{job.remarks}</p>
              </div>
            )}

          </div>
        )}

        <div className="flex justify-end border-t border-border pt-4 mt-2">
          <Button variant="outline" onClick={onClose} className="border-border text-foreground/90 hover:bg-card text-xs">
            Close Job Details
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
