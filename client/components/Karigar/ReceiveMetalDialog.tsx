"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import ReceiveMetalModal from "./ReceiveMetalModal"

export default function ReceiveMetalDialog({
  jobId,
  issuedWeight,
}: {
  jobId: string
  issuedWeight: number
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        Receive Metal
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl w-[95vw] lg:max-w-5xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Receive Metal</DialogTitle>
          </DialogHeader>

          <ReceiveMetalModal
            jobId={jobId}
            issuedWeight={issuedWeight}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}
