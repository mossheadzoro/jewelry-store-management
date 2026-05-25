import { Button } from "@/components/ui/button"

export default function PageHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold">Tonch / Metal Exchange</h1>
        <p className="text-sm text-muted-foreground">
          Manage metal purity testing, exchange processing, and reconciliation.
        </p>
      </div>

      <div className="flex gap-2">
        <Button variant="outline">History</Button>
        <Button>New Exchange</Button>
      </div>
    </div>
  )
}
