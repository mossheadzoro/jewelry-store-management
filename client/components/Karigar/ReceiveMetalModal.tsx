"use client"

import { useState, useMemo } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Sparkles, Plus, Trash2, AlertCircle, CheckCircle2, Loader2, Info, Layers, ArrowRight } from "lucide-react"

const TONCH_MAP: Record<string, number> = {
  K22: 0.92,   // 22 Carat gold is taken as 92% (0.92)
  K20: 0.833,  // 20 Carat gold = 83.3%
  K18: 0.75,   // 18 Carat gold = 75.0%
  K14: 0.585,  // 14 Carat gold = 58.5%
}

export default function ReceiveMetalModal({
  jobId,
  issuedWeight,
}: {
  jobId: string
  issuedWeight: number
}) {
  const [calculationMode, setCalculationMode] = useState<"MODE_A" | "MODE_B">("MODE_A")
  const [items, setItems] = useState<any[]>([
    { purity: "K22", weight: "", tonch: TONCH_MAP.K22 },
  ])
  const [wastagePercent, setWastagePercent] = useState("2.0")
  const [cashPaid, setCashPaid] = useState("")
  const [remainingAction, setRemainingAction] = useState<"HOLD" | "RETURN">("RETURN")
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const addItem = () => {
    setItems([...items, { purity: "K22", weight: "", tonch: TONCH_MAP.K22 }])
  }

  const removeItem = (idx: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== idx))
    }
  }

  /* ---------------- CALCULATIONS FOR MODE A AND MODE B ---------------- */

  const totalJewelleryWeight = useMemo(() => {
    return items.reduce((sum, i) => sum + (Number(i.weight) || 0), 0)
  }, [items])

  const baseFineGold = useMemo(() => {
    return items.reduce(
      (sum, i) => sum + (Number(i.weight) || 0) * (TONCH_MAP[i.purity] || 0),
      0
    )
  }, [items])

  // Mode A: Fine Gold = Gross Weight * (1 + Wastage%) * Purity
  const modeAFineGold = useMemo(() => {
    const w = (Number(wastagePercent) || 0) / 100
    return items.reduce((sum, i) => {
      const wt = Number(i.weight) || 0
      const p = TONCH_MAP[i.purity] || 0
      return sum + wt * (1 + w) * p
    }, 0)
  }, [items, wastagePercent])

  // Mode B: Fine Gold = Gross Weight * (Purity + Wastage%)
  const modeBFineGold = useMemo(() => {
    const w = (Number(wastagePercent) || 0) / 100
    return items.reduce((sum, i) => {
      const wt = Number(i.weight) || 0
      const p = TONCH_MAP[i.purity] || 0
      return sum + wt * (p + w)
    }, 0)
  }, [items, wastagePercent])

  const diffModeBMinusA = useMemo(() => {
    return modeBFineGold - modeAFineGold
  }, [modeAFineGold, modeBFineGold])

  // Selected Fine Gold based on calculation mode
  const selectedFineGold = calculationMode === "MODE_A" ? modeAFineGold : modeBFineGold

  // Wastage component in Fine Gold
  const fineWastage = selectedFineGold - baseFineGold

  // Remaining Raw Metal Balance
  const remainingRaw = useMemo(() => {
    return issuedWeight - selectedFineGold
  }, [issuedWeight, selectedFineGold])

  /* ---------------- SUBMIT ---------------- */

  const submit = async () => {
    setErrorMsg(null)
    setSuccessMsg(null)

    const validItems = items.filter((i) => Number(i.weight) > 0)
    if (validItems.length === 0) {
      setErrorMsg("Please enter a valid weight for at least one jewellery item.")
      return
    }

    setLoading(true)

    try {
      await axios.post("/api/karigar/job/receive", {
        jobId,
        calculationMode,
        jewelleryItems: validItems.map((i) => ({
          purity: i.purity,
          weight: Number(i.weight),
          tonch: TONCH_MAP[i.purity],
        })),
        wastagePercent: Number(wastagePercent) || 0,
        fineUsed: baseFineGold,
        fineWastage,
        totalFineGoldAccounted: selectedFineGold,
        remainingRawMetal: remainingRaw,
        remainingAction,
        cashPaid: cashPaid ? Number(cashPaid) : 0,
      })

      setSuccessMsg("Job received and closed successfully!")
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.response?.data?.error || "Failed to receive metal job. Please check entries.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6 bg-[#121214] border-border shadow-2xl text-foreground space-y-6">
      {/* Header Banner */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h3 className="font-bold text-xl text-[#C9943A] flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#C9943A]" /> Receive Crafted Metal & Settle Job
          </h3>
          <p className="text-xs text-muted-foreground mt-1">Select calculation mode and enter returned jewellery details.</p>
        </div>
        <div className="bg-card border border-border/60 px-4 py-2 rounded-xl text-right">
          <div className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Issued Raw Metal</div>
          <div className="text-xl font-bold font-mono text-[#C9943A]">{issuedWeight.toFixed(4)} <span className="text-sm text-muted-foreground font-normal">g</span></div>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3.5 flex items-center gap-3 text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5 flex items-center gap-3 text-emerald-400 text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Mode Selection */}
      <div className="space-y-2">
        <Label className="text-xs font-bold text-foreground/90 uppercase tracking-wider block flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#C9943A]" /> Return Calculation Mode
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-1.5 bg-background rounded-2xl border border-border">
          <button
            type="button"
            onClick={() => setCalculationMode("MODE_A")}
            className={`p-4 rounded-xl text-left transition-all flex flex-col justify-between border ${
              calculationMode === "MODE_A"
                ? "bg-[#C9943A]/20 border-[#C9943A] text-foreground shadow-lg ring-1 ring-[#C9943A]/40"
                : "border-border bg-card/40 text-muted-foreground hover:text-foreground hover:bg-card"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-base text-foreground">Mode A: Gross Wt Base</span>
                {calculationMode === "MODE_A" && (
                  <span className="text-xs bg-[#C9943A] text-foreground px-2 py-0.5 rounded-full font-bold">Selected</span>
                )}
              </div>
              <p className="text-xs text-foreground/90">Wastage applied to Gross Weight first, then converted to Fine Gold.</p>
            </div>
            <div className="mt-3 pt-2 border-t border-border/60 flex items-center justify-between font-mono text-xs text-muted-foreground">
              <span>Formula:</span>
              <code className="text-[#C9943A] font-bold">(Gross × (1 + W%)) × Purity</code>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setCalculationMode("MODE_B")}
            className={`p-4 rounded-xl text-left transition-all flex flex-col justify-between border ${
              calculationMode === "MODE_B"
                ? "bg-[#C9943A]/20 border-[#C9943A] text-foreground shadow-lg ring-1 ring-[#C9943A]/40"
                : "border-border bg-card/40 text-muted-foreground hover:text-foreground hover:bg-card"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-base text-foreground">Mode B: Additive Purity</span>
                {calculationMode === "MODE_B" && (
                  <span className="text-xs bg-[#C9943A] text-foreground px-2 py-0.5 rounded-full font-bold">Selected</span>
                )}
              </div>
              <p className="text-xs text-foreground/90">Wastage % added directly to Purity % (e.g., 92% + 2% = 94%).</p>
            </div>
            <div className="mt-3 pt-2 border-t border-border/60 flex items-center justify-between font-mono text-xs text-muted-foreground">
              <span>Formula:</span>
              <code className="text-[#C9943A] font-bold">Gross × (Purity% + Wastage%)</code>
            </div>
          </button>
        </div>
      </div>

      {/* Finished Jewellery Items & Wastage Input Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left Column: Items (Spans 2 cols) */}
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-foreground/90 uppercase tracking-wider block">Finished Jewellery Items</Label>
            <span className="text-xs text-muted-foreground font-mono">Total Gross: <b className="text-foreground font-bold">{totalJewelleryWeight.toFixed(3)} g</b></span>
          </div>

          <div className="space-y-2.5">
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-card/80 p-3 rounded-xl border border-border shadow-sm">
                <div className="w-40">
                  <Label className="text-[10px] text-muted-foreground uppercase font-semibold mb-1 block">Purity / Karat</Label>
                  <Select
                    value={item.purity}
                    onValueChange={(v) => {
                      const updated = [...items]
                      updated[idx].purity = v
                      updated[idx].tonch = TONCH_MAP[v]
                      setItems(updated)
                    }}
                  >
                    <SelectTrigger className="h-10 bg-background border-border text-foreground text-xs font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border text-foreground text-xs">
                      <SelectItem value="K22">22K Gold (92.0%)</SelectItem>
                      <SelectItem value="K20">20K Gold (83.3%)</SelectItem>
                      <SelectItem value="K18">18K Gold (75.0%)</SelectItem>
                      <SelectItem value="K14">14K Gold (58.5%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <Label className="text-[10px] text-muted-foreground uppercase font-semibold mb-1 block">Gross Weight (g)</Label>
                  <Input
                    type="number"
                    step="0.001"
                    placeholder="4.000"
                    value={item.weight}
                    onChange={(e) => {
                      const updated = [...items]
                      updated[idx].weight = e.target.value
                      setItems(updated)
                    }}
                    className="h-10 bg-background border-border text-foreground text-sm font-mono font-bold"
                  />
                </div>

                <div className="w-28">
                  <Label className="text-[10px] text-muted-foreground uppercase font-semibold mb-1 block">Purity Tonch</Label>
                  <Input
                    value={`${(item.tonch * 100).toFixed(1)}%`}
                    disabled
                    className="h-10 bg-background border-border text-foreground/90 text-xs font-mono font-bold text-center"
                  />
                </div>

                {items.length > 1 && (
                  <div className="pt-4">
                    <Button variant="ghost" size="icon" onClick={() => removeItem(idx)} className="h-10 w-10 text-muted-foreground hover:text-red-400 hover:bg-secondary">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}

            <Button variant="outline" size="sm" onClick={addItem} className="border-border text-foreground/90 hover:bg-card text-xs rounded-xl h-9">
              <Plus className="w-4 h-4 mr-1 text-[#C9943A]" /> Add Another Item
            </Button>
          </div>
        </div>

        {/* Right Column: Wastage % & Remaining Action */}
        <div className="space-y-3 bg-card/40 p-3.5 rounded-2xl border border-border flex flex-col justify-between">
          <div>
            <Label className="text-xs font-bold text-foreground/90 uppercase tracking-wider block mb-1">Wastage %</Label>
            <div className="relative">
              <Input
                type="number"
                step="0.01"
                placeholder="2.0"
                value={wastagePercent}
                onChange={(e) => setWastagePercent(e.target.value)}
                className="h-11 bg-background border-border text-foreground font-mono text-base font-bold rounded-xl pr-8"
              />
              <span className="absolute right-3 top-3 text-xs text-muted-foreground font-bold">%</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Allowed loss percentage on finished weight.</p>
          </div>

          <div>
            <Label className="text-xs font-bold text-foreground/90 uppercase tracking-wider block mb-1">Labour Charges / Cash Due (₹)</Label>
            <Input
              type="number"
              step="1"
              placeholder="e.g. 1500 ₹"
              value={cashPaid}
              onChange={(e) => setCashPaid(e.target.value)}
              className="h-11 bg-background border-border text-foreground font-mono text-base font-bold rounded-xl"
            />
            <p className="text-[11px] text-muted-foreground mt-1">Labour or making charges due / paid to Karigar.</p>
          </div>

          <div>
            <Label className="text-xs font-bold text-foreground/90 uppercase tracking-wider block mb-1">Remaining Raw Action</Label>
            <Select value={remainingAction} onValueChange={(v) => setRemainingAction(v as "HOLD" | "RETURN")}>
              <SelectTrigger className="h-11 bg-background border-border text-foreground rounded-xl text-xs font-semibold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-foreground text-xs">
                <SelectItem value="RETURN">Return Metal to Store Inventory</SelectItem>
                <SelectItem value="HOLD">Hold Custody with Karigar</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Live Prominent Side-by-Side Comparison Box */}
      <div className="bg-background border border-border rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <span className="font-bold flex items-center gap-2 text-zinc-200 text-sm">
            <Info className="w-4 h-4 text-[#C9943A]" /> Side-by-Side Mode Comparison
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            Finished Wt: <b className="text-foreground">{totalJewelleryWeight.toFixed(3)}g</b> | Wastage: <b className="text-foreground">{wastagePercent}%</b>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Mode A Box */}
          <div className={`p-4 rounded-xl border transition-all ${calculationMode === "MODE_A" ? "border-[#C9943A] bg-[#C9943A]/10 ring-1 ring-[#C9943A]/30" : "border-border/80 bg-card/30 opacity-70"}`}>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span className="font-bold uppercase tracking-wider">Mode A (Gross Wt Base)</span>
              {calculationMode === "MODE_A" && <span className="text-[10px] bg-[#C9943A] text-foreground font-bold px-1.5 py-0.5 rounded">Active Mode</span>}
            </div>
            <div className="text-2xl font-bold font-mono text-foreground tracking-tight">{modeAFineGold.toFixed(4)} <span className="text-sm font-normal text-muted-foreground">g</span></div>
            <div className="flex justify-between text-xs font-mono text-muted-foreground mt-2 pt-2 border-t border-border/60">
              <span>Wastage Fine:</span>
              <span className="text-[#C9943A] font-bold">{(modeAFineGold - baseFineGold).toFixed(4)} g</span>
            </div>
          </div>

          {/* Mode B Box */}
          <div className={`p-4 rounded-xl border transition-all ${calculationMode === "MODE_B" ? "border-[#C9943A] bg-[#C9943A]/10 ring-1 ring-[#C9943A]/30" : "border-border/80 bg-card/30 opacity-70"}`}>
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span className="font-bold uppercase tracking-wider">Mode B (Additive Purity)</span>
              {calculationMode === "MODE_B" && <span className="text-[10px] bg-[#C9943A] text-foreground font-bold px-1.5 py-0.5 rounded">Active Mode</span>}
            </div>
            <div className="text-2xl font-bold font-mono text-foreground tracking-tight">{modeBFineGold.toFixed(4)} <span className="text-sm font-normal text-muted-foreground">g</span></div>
            <div className="flex justify-between text-xs font-mono text-muted-foreground mt-2 pt-2 border-t border-border/60">
              <span>Wastage Fine:</span>
              <span className="text-[#C9943A] font-bold">{(modeBFineGold - baseFineGold).toFixed(4)} g</span>
            </div>
          </div>
        </div>

        {/* Difference Row */}
        <div className="bg-card/90 border border-border rounded-xl p-3 flex items-center justify-between text-xs font-mono">
          <span className="text-foreground/90 font-medium">Difference (Mode B − Mode A):</span>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-[#C9943A]">
              {diffModeBMinusA >= 0 ? `+${diffModeBMinusA.toFixed(4)} g` : `${diffModeBMinusA.toFixed(4)} g`}
            </span>
            <span className="text-xs bg-[#C9943A]/20 text-[#C9943A] border border-[#C9943A]/40 px-2 py-0.5 rounded-full font-bold">
              {diffModeBMinusA >= 0 ? `+${(diffModeBMinusA * 1000).toFixed(1)} mg` : `${(diffModeBMinusA * 1000).toFixed(1)} mg`}
            </span>
          </div>
        </div>
      </div>

      {/* Prominent Settlement Summary Card */}
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-border rounded-2xl p-4 space-y-3 font-mono">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pb-3 border-b border-border">
          <div>
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider">Base Fine Gold Content</div>
            <div className="text-lg font-bold text-foreground mt-0.5">{baseFineGold.toFixed(4)} g</div>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider">Fine Gold Wastage ({calculationMode})</div>
            <div className="text-lg font-bold text-[#C9943A] mt-0.5">{fineWastage.toFixed(4)} g</div>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground uppercase tracking-wider">Total Fine Gold Accounted</div>
            <div className="text-xl font-extrabold text-[#C9943A] mt-0.5">{selectedFineGold.toFixed(4)} g</div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="text-sm font-sans font-bold text-zinc-200">Remaining Raw Metal Balance:</div>
          <div className={`text-2xl font-extrabold font-mono ${remainingRaw >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
            {remainingRaw.toFixed(4)} <span className="text-sm font-normal">g</span>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        onClick={submit}
        disabled={loading}
        className="w-full h-12 bg-gradient-to-r from-[#C9943A] to-[#E8B84B] text-foreground font-extrabold text-base hover:brightness-110 rounded-xl shadow-xl active:scale-[0.99] transition-all flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" /> Processing & Closing Job...
          </>
        ) : (
          <>
            Receive & Close Workshop Job ({calculationMode === "MODE_A" ? "Mode A" : "Mode B"})
            <ArrowRight className="w-5 h-5 ml-1" />
          </>
        )}
      </Button>
    </Card>
  )
}
