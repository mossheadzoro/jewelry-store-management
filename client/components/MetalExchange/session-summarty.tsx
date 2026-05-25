import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export default function SessionSummary({
  session,
  items,
}: {
  session: any
  items: any[]
}) {
  const totalFine = items.reduce(
    (sum, i) => sum + (i.fineGold || 0),
    0
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Session {session.sessionNumber}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-2 text-sm">
        <div>Date: {new Date(session.date).toDateString()}</div>
        <div>Total Items: {items.length}</div>
        <div>Total Fine Gold: {totalFine.toFixed(3)} g</div>
        <div>Status: {session.isClosed ? "Closed" : "Open"}</div>
      </CardContent>
    </Card>
  )
}
