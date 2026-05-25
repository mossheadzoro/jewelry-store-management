"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AssignMetalForm({ karigarId }: { karigarId: string }) {
  const [issuedWeight, setIssuedWeight] = useState("")
  const [issuedPurity, setIssuedPurity] = useState("0.995")
  const [wastagePercent, setWastagePercent] = useState("")
  const [metalSource, setMetalSource] = useState<"STOCK" | "HELD">("STOCK")
  const [heldBalances, setHeldBalances] = useState<any[]>([])

  useEffect(() => {
    axios
      .get(`/api/karigar/held-metal/${karigarId}`)
      .then((res) => setHeldBalances(res.data))
  }, [karigarId])

  const availableHeld =
    heldBalances.find((h) => h.purity === Number(issuedPurity))?.weight || 0

  const submit = async () => {
    await axios.post("/api/karigar/job/assign", {
      karigarId,
      issuedWeight: Number(issuedWeight),
      issuedPurity: Number(issuedPurity),
      wastagePercent: wastagePercent ? Number(wastagePercent) : null,
      metalSource,
    })

    alert("Metal assigned")
    window.location.reload()
  }

  const insufficient =
    metalSource === "HELD" && Number(issuedWeight) > availableHeld

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assign Metal</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Metal Source */}
        <Select value={metalSource} onValueChange={(v) => setMetalSource(v as any)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="STOCK">Fresh Stock</SelectItem>
            <SelectItem value="HELD">Karigar Held Metal</SelectItem>
          </SelectContent>
        </Select>

        {/* Purity */}
        <Select value={issuedPurity} onValueChange={setIssuedPurity}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0.995">99.5%</SelectItem>
            <SelectItem value="0.999">99.9%</SelectItem>
          </SelectContent>
        </Select>

        {metalSource === "HELD" && (
          <div className="text-sm text-muted-foreground">
            Available Held: <b>{availableHeld.toFixed(3)} g</b>
          </div>
        )}

        <Input
          placeholder="Issued Weight (g)"
          value={issuedWeight}
          onChange={(e) => setIssuedWeight(e.target.value)}
        />

        <Input
          placeholder="Wastage % (optional)"
          value={wastagePercent}
          onChange={(e) => setWastagePercent(e.target.value)}
        />

        <Button
          onClick={submit}
          disabled={insufficient}
          className="w-full"
        >
          Assign Metal
        </Button>

        {insufficient && (
          <p className="text-sm text-red-600">
            Not enough held metal available
          </p>
        )}
      </CardContent>
    </Card>
  )
}
