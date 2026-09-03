import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"
import AssignMetalForm from "@/components/Karigar/AssignMetalForm"
import ReceiveMetalDialog from "@/components/Karigar/ReceiveMetalDialog"
import KarigarJobHistoryList from "@/components/Karigar/KarigarJobHistoryList"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

export default async function KarigarProfile({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const karigar = await prisma.karigar.findUnique({
    where: { id },
    include: {
      jobs: {
        orderBy: { createdAt: "desc" },
        include: { jewelleryItems: true },
      },
      KarigarHeldMetal: true,
    },
  })

  if (!karigar) {
    return <div className="p-10 text-muted-foreground">Karigar not found</div>
  }

  // Calculate Net Metal Balance & Net Cash Balance
  let totalMetalBalance = 0
  let totalCashBalance = 0

  karigar.jobs.forEach((job) => {
    // In India, 99.5% purity is standard 24K — fine weight = gross weight
    const effectivePurity = job.issuedPurity >= 0.995 ? 1.0 : job.issuedPurity
    if (job.status === "OPEN") {
      const openMetal = job.remainingRawMetal !== null ? job.remainingRawMetal : (job.issuedWeight * effectivePurity)
      totalMetalBalance += openMetal
    } else {
      const issuedFine = job.issuedWeight * effectivePurity
      // Dynamically compute returned fine using exact Mode A / Mode B formulas from Receiving Modal
      let returnedFine = 0
      if (job.jewelleryItems && job.jewelleryItems.length > 0) {
        const w = (job.wastagePercent || 0) / 100
        const mode = job.calculationMode || (job.remarks?.includes("MODE_B") ? "MODE_B" : "MODE_A")
        if (mode === "MODE_B") {
          returnedFine = job.jewelleryItems.reduce((sum: number, item: any) => sum + (Number(item.weight) * ((Number(item.tonch) || 0.92) + w)), 0)
        } else {
          returnedFine = job.jewelleryItems.reduce((sum: number, item: any) => sum + (Number(item.weight) * (1 + w) * (Number(item.tonch) || 0.92)), 0)
        }
      } else {
        returnedFine = (job.fineUsed || 0) + (job.fineWastage || 0)
      }
      
      const jobBalance = issuedFine - returnedFine
      // If jobBalance > 0, the karigar either returned it to store (RETURN) or it is held (HOLD) and thus already in KarigarHeldMetal.
      // If jobBalance < 0, the karigar gave us more metal, so we owe them (due).
      if (jobBalance < 0) {
        totalMetalBalance += jobBalance
      }
    }

    totalCashBalance += ((job.cashIssued || 0) - (job.cashPaid || 0))
  })

  karigar.KarigarHeldMetal.forEach((hm) => {
    totalMetalBalance += (hm.weight || 0)
  })

  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-8 bg-[#1b1a12] min-h-screen w-full text-[#f5f3e7]">

        {/* ================= HEADER ================= */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">
              Artisans / Profiles
            </p>
            <h1 className="text-3xl font-semibold">
              Karigar Profile: {karigar.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-muted-foreground">
                ID: #{karigar.id.slice(-6).toUpperCase()}
              </span>
              <Badge className={karigar.isActive ? "bg-green-600 text-foreground" : "bg-red-600 text-foreground"}>
                {karigar.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline">Print Report</Button>
            <Button>Edit Profile</Button>
          </div>
        </div>

        {/* ================= PROFILE + STATS ================= */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

          {/* PROFILE CARD */}
          <Card className="bg-[#2a281c] border-none">
            <CardContent className="pt-6 space-y-4">
              <div className="flex flex-col items-center text-center">
                <Image
                  src={karigar.profilePhoto || "/avatar.png"}
                  width={96}
                  height={96}
                  alt="profile"
                  className="rounded-full border border-yellow-600 object-cover"
                />
                <h2 className="text-lg font-semibold mt-3">
                  {karigar.name}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {karigar.department} Department
                </p>
                <Badge variant="outline" className="mt-2">
                  Since {new Date(karigar.joiningDate).getFullYear()}
                </Badge>
              </div>

              <div className="text-sm text-muted-foreground space-y-1">
                <p>📞 {karigar.phoneNumber}</p>
                <p>📍 {karigar.address || "-"}</p>
              </div>
            </CardContent>
          </Card>

          {/* NET METAL BALANCE / DUE CARD */}
          <Card className={`bg-[#2a281c] border ${totalMetalBalance < 0 ? "border-red-500/40" : "border-yellow-600/30"}`}>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">
                {totalMetalBalance < 0 ? "⚠️ Metal Due to Karigar" : "Held Fine Metal"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-extrabold font-mono ${totalMetalBalance < 0 ? "text-red-400" : "text-yellow-500"}`}>
                {totalMetalBalance < 0 ? `-${Math.abs(totalMetalBalance).toFixed(3)} g` : `${totalMetalBalance.toFixed(3)} g`}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {totalMetalBalance < 0 ? "Karigar returned more fine metal. We owe metal to karigar." : "Fine metal in karigar custody."}
              </p>
            </CardContent>
          </Card>

          {/* NET CASH BALANCE / DUE CARD */}
          <Card className={`bg-[#2a281c] border ${totalCashBalance < 0 ? "border-amber-500/40" : "border-green-600/30"}`}>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">
                {totalCashBalance < 0 ? "⚠️ Cash Due to Karigar" : "Cash Balance / Advance"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-extrabold font-mono ${totalCashBalance < 0 ? "text-amber-400" : "text-green-400"}`}>
                {totalCashBalance < 0 ? `₹${Math.abs(totalCashBalance).toLocaleString("en-IN")}` : `₹${totalCashBalance.toLocaleString("en-IN")}`}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {totalCashBalance < 0 ? "Labour / making charges due to karigar." : "Cash advance given to karigar."}
              </p>
            </CardContent>
          </Card>

          {/* HELD CUSTODY BALANCES */}
          <Card className="bg-[#2a281c] border-none">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground uppercase tracking-wider">
                Custody Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm font-mono">
              {karigar.KarigarHeldMetal.length === 0 ? (
                <p className="text-xs text-muted-foreground">No extra held metal in custody</p>
              ) : (
                karigar.KarigarHeldMetal.map((m) => (
                  <div key={m.id} className="flex justify-between border-b border-border pb-1">
                    <span className="text-muted-foreground">{(m.purity * 100).toFixed(1)}% Purity:</span>
                    <span className="font-bold text-yellow-400">{m.weight.toFixed(3)} g</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* ================= ASSIGN METAL ================= */}
        <Card className="bg-[#2a281c] border-none">
          <CardHeader>
            <CardTitle>Assign Metal to Karigar</CardTitle>
          </CardHeader>
          <CardContent>
            <AssignMetalForm karigarId={karigar.id} />
          </CardContent>
        </Card>

        {/* ================= JOBS LEDGER ================= */}
        <Card className="bg-[#2a281c] border-none">
          <CardHeader>
            <CardTitle>Job Ledger History</CardTitle>
          </CardHeader>

          <CardContent>
            <KarigarJobHistoryList jobs={karigar.jobs} />
          </CardContent>
        </Card>
      </div>
    </SidebarProvider>
  )
}
