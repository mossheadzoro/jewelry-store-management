"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { useBranchStore } from "@/lib/store/useBranchStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles, AlertCircle, CheckCircle2, Loader2, Building2 } from "lucide-react"

export default function AssignMetalForm({ karigarId }: { karigarId: string }) {
  const { selectedBranch } = useBranchStore()
  const [issuedWeight, setIssuedWeight] = useState("")
  const [issuedPurity, setIssuedPurity] = useState("1.0")
  const [wastagePercent, setWastagePercent] = useState("")
  const [cashIssued, setCashIssued] = useState("")
  const [metalSource, setMetalSource] = useState<"STOCK" | "HELD">("STOCK")
  const [heldBalances, setHeldBalances] = useState<any[]>([])
  const [branchFreeFineWeight, setBranchFreeFineWeight] = useState<number>(0)

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Fetch Karigar Held Metal
  useEffect(() => {
    axios
      .get(`/api/karigar/held-metal/${karigarId}`)
      .then((res) => setHeldBalances(res.data || []))
      .catch(() => {})
  }, [karigarId])

  // Fetch Branch Free Fine Weight Available (24K Idle Stock)
  useEffect(() => {
    const branchQs = selectedBranch?.id ? `?branchId=${selectedBranch.id}` : ""
    axios
      .get(`/api/inventory/free-fine-metal${branchQs}`)
      .then((res) => {
        setBranchFreeFineWeight(res.data?.freeFineWeight || 0)
      })
      .catch(() => {
        setBranchFreeFineWeight(0)
      })
  }, [selectedBranch])

  const availableHeld =
    heldBalances.find((h) => h.purity === Number(issuedPurity))?.weight || 0

  const wtNum = Number(issuedWeight) || 0
  const insufficientHeld = metalSource === "HELD" && wtNum > availableHeld
  const insufficientStock = metalSource === "STOCK" && wtNum > branchFreeFineWeight

  const submit = async () => {
    setErrorMsg(null)
    setSuccessMsg(null)

    if (!issuedWeight || isNaN(wtNum) || wtNum <= 0) {
      setErrorMsg("Please enter a valid positive issued weight.")
      return
    }

    if (metalSource === "HELD" && insufficientHeld) {
      setErrorMsg(`Not enough held metal available in karigar custody (${availableHeld.toFixed(3)} g).`)
      return
    }

    if (metalSource === "STOCK" && insufficientStock) {
      setErrorMsg(`Issued weight (${wtNum.toFixed(3)} g) exceeds available Branch Free Fine Weight (${branchFreeFineWeight.toFixed(3)} g).`)
      return
    }

    setLoading(true)

    try {
      await axios.post("/api/karigar/job/assign", {
        karigarId,
        issuedWeight: wtNum,
        issuedPurity: Number(issuedPurity),
        wastagePercent: wastagePercent ? Number(wastagePercent) : null,
        cashIssued: cashIssued ? Number(cashIssued) : 0,
        metalSource,
        branchId: selectedBranch?.id,
      })

      setSuccessMsg("Fine metal assigned to artisan successfully!")
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || "Failed to assign metal. Please check inventory balance.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-[#121214] border-border shadow-xl text-foreground">
      <CardHeader className="border-b border-border/60 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[#C9943A] text-lg font-bold flex items-center gap-2 font-serif">
            <Sparkles className="w-5 h-5 text-[#C9943A]" /> Issue Metal Job
          </CardTitle>
          <span className="text-[11px] font-bold text-muted-foreground bg-card border border-border px-2.5 py-1 rounded-lg flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-[#C9943A]" />
            {selectedBranch?.name || "Main Branch"}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-5">
        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center gap-2 text-red-400 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center gap-2 text-emerald-400 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Metal Source */}
        <div>
          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Metal Source</Label>
          <Select value={metalSource} onValueChange={(v) => setMetalSource(v as any)}>
            <SelectTrigger className="h-10 bg-card border-border text-foreground rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground">
              <SelectItem value="STOCK">Fresh Branch Stock (Free 24K Metal)</SelectItem>
              <SelectItem value="HELD">Karigar Held Custody Balance</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Purity */}
        <div>
          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Metal Purity</Label>
          <Select value={issuedPurity} onValueChange={setIssuedPurity}>
            <SelectTrigger className="h-10 bg-card border-border text-foreground rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground">
              <SelectItem value="1.0">24K Fine Gold (99.5% Standard — 1:1 Direct)</SelectItem>
              <SelectItem value="0.925">92.5% Sterling Silver</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* AVAILABLE BRANCH FREE FINE WEIGHT BADGE */}
        {metalSource === "STOCK" && (
          <div className="text-xs bg-gradient-to-r from-secondary to-background border border-[#C9943A]/30 p-3 rounded-xl text-foreground/90 flex items-center justify-between shadow-inner">
            <div>
              <span className="block font-bold text-foreground">Branch Free Fine Weight (24K Idle):</span>
              <span className="text-[11px] text-muted-foreground">Unallocated 24K metal ready in {selectedBranch?.name || "branch"}</span>
            </div>
            <div className="flex items-center gap-2">
              <b className="text-[#E8B84B] font-mono text-base font-extrabold">{branchFreeFineWeight.toFixed(3)} g</b>
              {branchFreeFineWeight > 0 && (
                <button
                  type="button"
                  onClick={() => setIssuedWeight(String(branchFreeFineWeight))}
                  className="text-[10px] font-bold text-foreground bg-[#E8B84B] px-2 py-1 rounded-md hover:bg-yellow-400 transition cursor-pointer active:scale-95"
                >
                  Fill Max
                </button>
              )}
            </div>
          </div>
        )}

        {/* HELD CUSTODY BALANCES */}
        {metalSource === "HELD" && (
          <div className="text-xs bg-card/80 border border-border p-3 rounded-xl text-muted-foreground flex items-center justify-between">
            <span>Available Karigar Custody Balance:</span>
            <b className="text-emerald-400 font-mono text-sm">{availableHeld.toFixed(3)} g</b>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-1">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Issued Weight (Grams) *</Label>
            {metalSource === "STOCK" && branchFreeFineWeight > 0 && wtNum > branchFreeFineWeight && (
              <span className="text-[11px] font-semibold text-red-400">Exceeds available branch stock!</span>
            )}
          </div>
          <Input
            type="number"
            step="0.001"
            placeholder={`Max allowed: ${metalSource === "STOCK" ? branchFreeFineWeight.toFixed(3) : availableHeld.toFixed(3)} g`}
            value={issuedWeight}
            onChange={(e) => setIssuedWeight(e.target.value)}
            className={`h-11 bg-card border-border text-foreground placeholder:text-zinc-600 rounded-xl font-mono text-base ${
              (insufficientHeld || insufficientStock) ? "border-red-500 focus:border-red-500 text-red-300" : "focus:border-[#C9943A]"
            }`}
          />
        </div>

        <div>
          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Max Allowed Wastage % (Optional)</Label>
          <Input
            type="number"
            step="0.01"
            placeholder="e.g. 0.50 %"
            value={wastagePercent}
            onChange={(e) => setWastagePercent(e.target.value)}
            className="h-10 bg-card border-border text-foreground placeholder:text-zinc-600 rounded-xl font-mono"
          />
        </div>

        <div>
          <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Cash Advanced / Money Issued (₹ Optional)</Label>
          <Input
            type="number"
            step="1"
            placeholder="e.g. 5000 ₹"
            value={cashIssued}
            onChange={(e) => setCashIssued(e.target.value)}
            className="h-10 bg-card border-border text-foreground placeholder:text-zinc-600 rounded-xl font-mono"
          />
        </div>

        <Button
          onClick={submit}
          disabled={loading || insufficientHeld || insufficientStock}
          className="w-full h-11 bg-gradient-to-r from-[#C9943A] to-[#E8B84B] text-foreground font-bold hover:brightness-110 rounded-xl shadow-lg active:scale-95 transition-all mt-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Assigning Metal...
            </>
          ) : (
            "Assign Metal to Karigar"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
