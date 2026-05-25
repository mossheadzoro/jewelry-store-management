"use client"

import { useState, useMemo } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"

const TONCH_MAP: Record<string, number> = {
  K22: 0.92,
  K20: 0.833,
  K18: 0.75,
  K14: 0.585,
}

export default function ReceiveMetalModal({
  jobId,
  issuedWeight,
}: {
  jobId: string
  issuedWeight: number
}) {
  const [items, setItems] = useState<any[]>([])
  const [wastagePercent, setWastagePercent] = useState("0.5")
  const [finingTonch, setFiningTonch] = useState("0.916")
  const [remainingAction, setRemainingAction] = useState<"HOLD" | "RETURN">(
    "RETURN"
  )
  const [loading, setLoading] = useState(false)

  const addItem = () => {
    setItems([
      ...items,
      { purity: "K22", weight: "", tonch: TONCH_MAP.K22 },
    ])
  }

  /* ---------------- CALCULATIONS ---------------- */

  const totalJewelleryWeight = useMemo(() => {
    return items.reduce(
      (sum, i) => sum + (Number(i.weight) || 0),
      0
    )
  }, [items])

  const jewelleryConsumed = useMemo(() => {
    return items.reduce(
      (sum, i) =>
        sum + (Number(i.weight) || 0) * (TONCH_MAP[i.purity] || 0),
      0
    )
  }, [items])

  const wastageRaw = useMemo(() => {
    const wastage22k =
      totalJewelleryWeight * (Number(wastagePercent) / 100)
    return wastage22k * Number(finingTonch)
  }, [totalJewelleryWeight, wastagePercent, finingTonch])

  const remainingRaw = useMemo(() => {
    return issuedWeight - jewelleryConsumed - wastageRaw
  }, [issuedWeight, jewelleryConsumed, wastageRaw])

  /* ---------------- SUBMIT ---------------- */

  const submit = async () => {
    setLoading(true)

    await axios.post("/api/karigar/job/receive", {
      jobId,
      jewelleryItems: items.map((i) => ({
        purity: i.purity,
        weight: Number(i.weight),
        tonch: TONCH_MAP[i.purity],
      })),
      wastagePercent: Number(wastagePercent),
      finingTonch: Number(finingTonch),
      remainingRawMetal: remainingRaw,
      remainingAction,
    })

    setLoading(false)
    window.location.reload()
  }

  return (
    <Card className="p-4 space-y-4">
      <h3 className="font-semibold">Receive Metal</h3>

      {/* Jewellery Items */}
      {items.map((item, idx) => (
        <div key={idx} className="grid grid-cols-3 gap-2">
          <Select
            value={item.purity}
            onValueChange={(v) => {
              const updated = [...items]
              updated[idx].purity = v
              updated[idx].tonch = TONCH_MAP[v]
              setItems(updated)
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="K22">22K</SelectItem>
              <SelectItem value="K20">20K</SelectItem>
              <SelectItem value="K18">18K</SelectItem>
              <SelectItem value="K14">14K</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Weight (g)"
            value={item.weight}
            onChange={(e) => {
              const updated = [...items]
              updated[idx].weight = e.target.value
              setItems(updated)
            }}
          />

          <Input value={item.tonch} disabled />
        </div>
      ))}

      <Button variant="outline" onClick={addItem}>
        + Add Jewellery
      </Button>

      {/* Job Inputs */}
      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="Wastage %"
          value={wastagePercent}
          onChange={(e) => setWastagePercent(e.target.value)}
        />
        <Input
          placeholder="Fining Tonch"
          value={finingTonch}
          onChange={(e) => setFiningTonch(e.target.value)}
        />
      </div>

      {/* Live Summary */}
      <div className="text-sm border rounded p-3 space-y-1">
        <p>Jewellery Consumed: <b>{jewelleryConsumed.toFixed(4)} g</b></p>
        <p>Wastage: <b>{wastageRaw.toFixed(4)} g</b></p>
        <p>
          Remaining Raw Metal:{" "}
          <b className="text-green-600">
            {remainingRaw.toFixed(4)} g
          </b>
        </p>
      </div>

      {/* Hold / Return */}
      <Select
        value={remainingAction}
        onValueChange={(v) =>
          setRemainingAction(v as "HOLD" | "RETURN")
        }
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="RETURN">Return Metal</SelectItem>
          <SelectItem value="HOLD">Hold with Karigar</SelectItem>
        </SelectContent>
      </Select>

      <Button onClick={submit} disabled={loading} className="w-full">
        Receive & Close Job
      </Button>
    </Card>
  )
}
