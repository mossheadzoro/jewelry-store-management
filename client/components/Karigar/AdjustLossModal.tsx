"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BaseModal } from "../BaseModal"

export function AdjustLossModal({
  open,
  onClose,
  karigarId,
  jobId,
  lossOnHold,
}: {
  open: boolean
  onClose: () => void
  karigarId: string
  jobId: string
  lossOnHold: number
}) {
  const [action, setAction] = useState<"FINALIZE" | "SALARY">("FINALIZE")
  const [amount, setAmount] = useState(lossOnHold.toString())
  const [remarks, setRemarks] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleAdjust() {
    setLoading(true)

    const res = await fetch("/api/karigar/adjust-loss", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId,
        karigarId,
        action,
        amount: Number(amount),
        remarks,
      }),
    })

    if (!res.ok) {
      alert("Failed to adjust loss")
      setLoading(false)
      return
    }

    await fetch("/api/karigar/refresh-balance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ karigarId }),
    })

    setLoading(false)
    onClose()
    window.location.reload()
  }

  return (
    <BaseModal open={open} onClose={onClose} title="Adjust Loss">
      <div className="space-y-4">

        <div>
          <label className="text-sm text-muted-foreground">
            Loss on Hold (Fine Gold)
          </label>
          <Input value={`${lossOnHold} g`} disabled />
        </div>

        <div>
          <label className="text-sm text-muted-foreground">
            Adjustment Type
          </label>
          <select
            className="w-full bg-[#1f1f1f] rounded px-3 py-2"
            value={action}
            onChange={(e) =>
              setAction(e.target.value as any)
            }
          >
            <option value="FINALIZE">Finalize as Loss</option>
            <option value="SALARY">Convert to Salary Gold</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-muted-foreground">
            Amount (Fine Gold)
          </label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm text-muted-foreground">
            Remarks
          </label>
          <Input
            placeholder="Reason / approval note"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>

        <Button
          onClick={handleAdjust}
          disabled={loading}
          className="w-full bg-red-500 text-white"
        >
          {loading ? "Adjusting..." : "Confirm Adjustment"}
        </Button>
      </div>
    </BaseModal>
  )
}
