"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function KarigarDirectory() {

  const router=useRouter()

const [karigars, setKarigars] = useState<any[]>([])
const [meta, setMeta] = useState<{ totalPages: number } | null>(null)

//   const [stats, setStats] = useState<any>(null)
  const [search, setSearch] = useState("")
  const [department, setDepartment] = useState<string | undefined>()
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)

    const qs = new URLSearchParams({
      search,
      page: page.toString(),
      ...(department ? { department } : {}),
    })

    const listRes = await fetch(
     `/api/karigar/fetchAll?${qs}`,
     )

    const listData = await listRes.json()
    // const statsData = await statRes.json()
   console.log(listRes,"REs")
    setKarigars(listData.data)   // ✅ array
setMeta(listData)      
    // setStats(statsData)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [search, department, page])

  if (loading) {
    return <div className="p-10 text-muted-foreground">Loading...</div>
  }

  return (
    <div className="p-8 space-y-8 w-full">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-semibold">Karigar Directory</h1>
        <p className="text-muted-foreground">
          Manage artisans, track metal balances, and assign orders.
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-6">
        <StatCard label="Total Karigars"  />
        <StatCard label="Gold Issued"  />
        <StatCard label="Pending Orders" />
      </div>

      {/* FILTERS */}
      <div className="flex gap-4">
        <Input
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Select onValueChange={setDepartment}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GOLD">Gold</SelectItem>
            <SelectItem value="SILVER">Silver</SelectItem>
            <SelectItem value="DIAMOND">Diamond</SelectItem>
          </SelectContent>
        </Select>

        <Link
  href="/karigar/add"
  className="ml-auto inline-flex  items-center gap-2 rounded-xl bg-yellow-500 px-4 py-2 text-black hover:bg-yellow-400 transition"
>
  Add Karigar
</Link>
      </div>

      {/* TABLE */}
      <div className="rounded-xl border overflow-hidden">
  <table className="w-full text-sm border-collapse">
    <thead className="bg-muted">
      <tr>
        <th className="px-4 py-3 text-left font-medium">Name</th>
        <th className="px-4 py-3 text-left font-medium">Department</th>
        <th className="px-4 py-3 text-left font-medium">Phone</th>
        <th className="px-4 py-3 text-left font-medium">Metal Balance</th>
        <th className="px-4 py-3 text-center font-medium">Active Orders</th>
        <th className="px-4 py-3 text-center font-medium">Status</th>
      </tr>
    </thead>

    <tbody>
      {karigars.map((k: any) => (
        <tr
          key={k.id}
          className="border-t hover:bg-muted/40 transition"
        >
          {/* NAME */}
          <td className="px-4 py-3 align-middle">
            <div className="flex items-center gap-3">
              <Image
                src={k.profilePhoto || "/avatar.png"}
                width={36}
                height={36}
                className="rounded-full"
                alt="profile"
              />
              <div>
                <button
  onClick={() => router.push(`/karigar/${k.id}`)}
  className="font-medium text-left text-yellow-600 hover:underline hover:text-yellow-500 transition"
>
  {k.name}
</button>

                <div className="text-xs text-muted-foreground">
                  #{k.id.slice(-6)}
                </div>
              </div>
            </div>
          </td>

          {/* DEPARTMENT */}
          <td className="px-4 py-3 align-middle">
            {k.department}
          </td>

          {/* PHONE */}
          <td className="px-4 py-3 align-middle">
            {k.phoneNumber}
          </td>

          {/* METAL */}
     
<td
  className={`px-4 py-3 align-middle font-medium ${
    k.currentBalanceMetal <= 0
      ? "text-red-500"
      : "text-green-600"
  }`}
>
  {k.currentBalanceMetal.toFixed(2)} g
</td>

{/* ACTIVE JOBS */}
<td className="px-4 py-3 align-middle text-center">
  {k.activeJobsCount}
</td>


          {/* ORDERS */}
          <td className="px-4 py-3 align-middle text-center">
           {k.activeJobsCount}

          </td>

          {/* STATUS */}
          <td className="px-4 py-3 align-middle text-center">
            <Badge
              className={
                k.isActive
                  ? "bg-green-600 text-white"
                  : "bg-red-600 text-white"
              }
            >
              {k.isActive ? "Active" : "Inactive"}
            </Badge>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>


      {/* PAGINATION */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          Prev
        </Button>
        <Button
          variant="outline"
          onClick={() => setPage(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

function StatCard({ label, value }: any) {
  return (
    <div className="rounded-xl border p-5">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  )
}


