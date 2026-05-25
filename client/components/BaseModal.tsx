"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface BaseModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function BaseModal({
  open,
  onClose,
  title,
  children,
}: BaseModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0f0f0f] text-white border-none">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {children}
      </DialogContent>
    </Dialog>
  )
}
