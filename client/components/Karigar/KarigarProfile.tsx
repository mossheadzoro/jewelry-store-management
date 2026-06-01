import Image from "next/image"
import { notFound } from "next/navigation"
import { prisma } from "../../libs/prisma"

export default async function KarigarProfile({
  params,
}: {
  params: { id: string }
}) {
  const karigar = await prisma.karigar.findUnique({
    where: { id: params.id },
    include: {
      jobs: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      KarigarHeldMetal: true,
    },
  })

  if (!karigar) return notFound()

  // Calculate wastage percent from latest job and metal balance from KarigarHeldMetal
  const wastagePercent = karigar.jobs[0]?.wastagePercent !== null && karigar.jobs[0]?.wastagePercent !== undefined
    ? `${karigar.jobs[0].wastagePercent}%`
    : "N/A";
  
  const currentFineGoldBalance = karigar.KarigarHeldMetal.reduce(
    (sum, m) => sum + m.weight,
    0
  );

  return (
    <div className="p-8 space-y-6">

      {/* HEADER */}
      <div className="flex items-center gap-4">
        <Image
          src={karigar.profilePhoto || "/avatar.png"}
          width={64}
          height={64}
          className="rounded-full"
          alt="profile"
        />

        <div>
          <h1 className="text-2xl font-semibold">
            {karigar.name}
          </h1>
          <p className="text-muted-foreground">
            {karigar.phoneNumber}
          </p>
        </div>
      </div>

      {/* INFO GRID */}
      <div className="grid grid-cols-2 gap-6">
        <Info label="Department" value={karigar.department} />
        <Info label="Wastage %" value={wastagePercent} />
        <Info label="Metal Balance" value={`${currentFineGoldBalance.toFixed(3)} g`} />
        <Info label="Status" value={karigar.isActive ? "Active" : "Inactive"} />
      </div>

    </div>
  )
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div className="border rounded-lg p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="font-medium mt-1">{value}</div>
    </div>
  )
}
