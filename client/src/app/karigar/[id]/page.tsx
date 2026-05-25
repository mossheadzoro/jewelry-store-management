"use server"


import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import { Button } from "@/components/ui/button"
import { prisma } from "../../../../libs/prisma"
import AssignMetalForm from "../../../../components/Karigar/AssignMetalForm"
import ReceiveMetalDialog from "../../../../components/Karigar/ReceiveMetalDialog"
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

  return (
    <SidebarProvider>
         <AppSidebar/>
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
              ID: {karigar.id.slice(-6)}
            </span>
            <Badge className="bg-green-600 text-white">
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
                className="rounded-full border border-yellow-600"
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

        {/* 99.5 METAL */}
        {karigar.KarigarHeldMetal
          .filter((m) => m.purity === 0.995)
          .map((m) => (
            <Card
              key={m.id}
              className="bg-[#2a281c] border-none"
            >
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">
                  Held 99.5 Metal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-yellow-500">
                  {m.weight.toFixed(3)} g
                </div>
              </CardContent>
            </Card>
          ))}

        {/* 99.9 METAL */}
        {karigar.KarigarHeldMetal
          .filter((m) => m.purity === 0.999)
          .map((m) => (
            <Card
              key={m.id}
              className="bg-[#2a281c] border-none"
            >
              <CardHeader>
                <CardTitle className="text-sm text-muted-foreground">
                  Held 99.9 Metal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-yellow-400">
                  {m.weight.toFixed(3)} g
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* ================= ASSIGN METAL ================= */}
      <Card className="bg-[#2a281c] border-none">
        <CardHeader>
          <CardTitle>Assign Metal</CardTitle>
        </CardHeader>
        <CardContent>
          <AssignMetalForm karigarId={karigar.id} />
        </CardContent>
      </Card>

      {/* ================= JOBS LEDGER ================= */}
      <Card className="bg-[#2a281c] border-none">
        <CardHeader>
          <CardTitle>Job Ledger</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {karigar.jobs.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No jobs found
            </p>
          )}

          {karigar.jobs.map((job) => (
            <div
              key={job.id}
              className="flex justify-between items-center bg-[#1f1e15] rounded-lg p-4"
            >
              <div>
                <p className="font-medium">
                  {job.issuedWeight} g @{" "}
                  {job.issuedPurity === 0.995 ? "99.5%" : "99.9%"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {new Date(job.createdAt).toLocaleDateString()}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Badge
                  className={
                    job.status === "OPEN"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-600 text-white"
                  }
                >
                  {job.status}
                </Badge>

                {job.status === "OPEN" && (
                  <ReceiveMetalDialog
                    jobId={job.id}
                    issuedWeight={job.issuedWeight}
                  />
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
    </SidebarProvider>
    
  )
}
