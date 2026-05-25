import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SessionSummary({
  items,
  session,
}: {
  items: any[]
  session: any
}) {
  /* --------------------------------
     LIVE QUEUE TOTALS (DRAFT)
  -------------------------------- */

  const totalBefore = items.reduce(
    (sum, i) => sum + (i.before || 0),
    0
  )

  const totalAfter = items.reduce(
    (sum, i) => sum + (i.after || 0),
    0
  )

  const liveFineGold = items.reduce(
    (sum, i) =>
      i.metalType === "GOLD" ? sum + (i.fine || 0) : sum,
    0
  )

  const liveFineSilver = items.reduce(
    (sum, i) =>
      i.metalType === "SILVER" ? sum + (i.fine || 0) : sum,
    0
  )

  /* --------------------------------
     SESSION INFO
  -------------------------------- */

  const startTime = new Date(session.date)
  const endTime = session.closedAt
    ? new Date(session.closedAt)
    : null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Session Summary</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3 text-sm">
        {/* SESSION META */}
        <div>
          <span className="font-medium">Session Start:</span>{" "}
          {startTime.toLocaleDateString()}{" "}
          {startTime.toLocaleTimeString()}
        </div>

        <div>
          <span className="font-medium">Session End:</span>{" "}
          {endTime
            ? `${endTime.toLocaleDateString()} ${endTime.toLocaleTimeString()}`
            : "In Progress"}
        </div>

        <div>
          <span className="font-medium">Status:</span>{" "}
          {session.isClosed ? "Closed" : "Active"}
        </div>

        <hr />

        {/* LIVE QUEUE (NOT FINAL) */}
        <div className="font-medium">
          Live Queue (Draft)
        </div>

        <div>Total Items in Queue: {items.length}</div>

        <div>
          Total Before (All Metals):{" "}
          {totalBefore.toFixed(3)} g
        </div>

        <div>
          Total After (All Metals):{" "}
          {totalAfter.toFixed(3)} g
        </div>

        <div>
          Fine Gold (Live):{" "}
          {liveFineGold.toFixed(3)} g
        </div>

        <div>
          Fine Silver (Live):{" "}
          {liveFineSilver.toFixed(3)} g
        </div>

        <hr />

        {/* SESSION LEDGER (FINAL & AUTHORITATIVE) */}
        <div className="font-medium">
          Final Tonched (Ledger)
        </div>

        <div>
          Fine Gold Accumulated:{" "}
          {session.fineGold.toFixed(3)} g
        </div>

        <div>
          Fine Silver Accumulated:{" "}
          {session.fineSilver.toFixed(3)} g
        </div>
      </CardContent>
    </Card>
  )
}
