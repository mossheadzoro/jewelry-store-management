"use client"

import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Calendar, Phone } from "lucide-react"

type CustomerState = {
  id?: number
  name: string
  mobile: string
  address: string
  city: string
  state: string
  pincode: string
  gender: "MALE" | "FEMALE" | "OTHER" | ""
  isExisting: boolean
}

export default function CustomerDetails({
  onCustomerChange,
}: {
  onCustomerChange: (customer: CustomerState | null) => void
}) {

  const [customer, setCustomer] = useState<CustomerState>({
    name: "",
    mobile: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    gender: "",
    isExisting: false,
  })

  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openCreateModal, setOpenCreateModal] = useState(false)

  /* ---------------- AUTO SEARCH WHEN MOBILE = 10 ---------------- */

  useEffect(() => {
    if (customer.mobile.length === 10) {
      searchCustomerByMobile()
    }
  }, [customer.mobile])

  const searchCustomerByMobile = async () => {
    setLoading(true)
    setError(null)
    setSearched(true)

    try {
      const res = await fetch(
        `/api/customer/search?mobile=${customer.mobile}`
      )
      const data = await res.json()

      if (!res.ok) throw new Error(data.error)

      if (data.customer) {
        setCustomer((prev) => ({
          ...prev,
          id: data.customer.id,
          name: data.customer.name,
          mobile: data.customer.mobile,
          address: data.customer.address || "",
          isExisting: true,
        }))
      } else {
        setCustomer((prev) => ({
          ...prev,
          name: "",
          isExisting: false,
        }))
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  /* ---------------- CREATE CUSTOMER ---------------- */

  const saveNewCustomer = async () => {
    const { name, mobile, address, city, state, pincode, gender } = customer

    if (!name || !mobile || !address || !city || !state || !pincode || !gender) {
      setError("Please fill all required fields")
      return
    }

    try {
      setLoading(true)
      setError(null)

      const res = await fetch("/api/customer/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          mobile,
          address,
          city,
          state,
          pincode,
          gender,
          
        }),
      })



      const data = await res.json()

if (!res.ok) {
  throw new Error(data.error || "Failed to create customer")
}

if (!data.id) {
  throw new Error("Invalid server response")
}

setCustomer((prev) => ({
  ...prev,
  id: data.id,
  name: data.name,
  mobile: data.mobile,
  address: data.address,
  city: data.city,
  state: data.state,
  pincode: data.pincode,
  gender: data.gender,
  isExisting: true,
}))


      setOpenCreateModal(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }


  useEffect(() => {
  if (customer.isExisting && customer.id) {
    onCustomerChange(customer)
  } else {
    onCustomerChange(null)
  }
}, [customer.id, customer.isExisting])


  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Customer Details</CardTitle>
        </CardHeader>

        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* CUSTOMER NAME */}
          <div className="space-y-1 md:col-span-2">
            <Label>Customer Name</Label>
            <Input
              value={customer.name}
              disabled={customer.isExisting}
              placeholder="Customer name"
              onChange={(e) =>
                setCustomer((prev) => ({ ...prev, name: e.target.value }))
              }
            />

            {searched && customer.isExisting && (
              <Badge variant="secondary" className="mt-1">
                Existing Customer
              </Badge>
            )}

            {searched && !customer.isExisting && (
              <div className="flex items-center gap-2 text-sm mt-1">
                <span className="text-muted-foreground">
                  Customer not found
                </span>
                <Button
                  variant="link"
                  className="p-0 h-auto"
                  onClick={() => setOpenCreateModal(true)}
                >
                  Create customer
                </Button>
              </div>
            )}
          </div>

          {/* MOBILE */}
          <div className="space-y-1">
            <Label>Mobile Number</Label>
            <div className="relative">
              <Phone className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="10 digit mobile"
                value={customer.mobile}
                onChange={(e) =>
                  setCustomer((prev) => ({
                    ...prev,
                    mobile: e.target.value.replace(/\D/g, ""),
                  }))
                }
              />
            </div>
            {loading && (
              <p className="text-xs text-muted-foreground">
                Searching customer…
              </p>
            )}
            {error && (
              <p className="text-xs text-red-500">
                {error}
              </p>
            )}
          </div>

          {/* DATE */}
          <IconField label="Date" icon={Calendar} type="date" />
        </CardContent>
      </Card>

      {/* ---------------- CREATE CUSTOMER MODAL ---------------- */}
      <Dialog open={openCreateModal} onOpenChange={setOpenCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Customer</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <InputBlock label="Name" value={customer.name}
              onChange={(v) => setCustomer((p) => ({ ...p, name: v }))} />

            <InputBlock label="Address" value={customer.address}
              onChange={(v) => setCustomer((p) => ({ ...p, address: v }))} />

            <div className="grid grid-cols-2 gap-3">
              <InputBlock label="City" value={customer.city}
                onChange={(v) => setCustomer((p) => ({ ...p, city: v }))} />

              <InputBlock label="State" value={customer.state}
                onChange={(v) => setCustomer((p) => ({ ...p, state: v }))} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <InputBlock label="Pincode" value={customer.pincode}
                onChange={(v) => setCustomer((p) => ({ ...p, pincode: v }))} />

              <div>
                <Label>Gender</Label>
                <select
                  className="w-full border rounded-md h-9 px-2"
                  value={customer.gender}
                  onChange={(e) =>
                    setCustomer((p) => ({
                      ...p,
                      gender: e.target.value as any,
                    }))
                  }
                >
                  <option value="">Select</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={saveNewCustomer} disabled={loading}>
              {loading ? "Saving..." : "Save Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/* ---------------- HELPERS ---------------- */

function IconField({ icon: Icon, label, ...props }: any) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <div className="relative">
        <Icon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input className="pl-8" {...props} />
      </div>
    </div>
  )
}

function InputBlock({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
