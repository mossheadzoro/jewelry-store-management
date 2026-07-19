'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import axios from 'axios'
import { useBranchStore } from '@/lib/store/useBranchStore'
import { useUserStore } from '@/lib/store/useUserStore'

// Assume these hooks exist


type Props = {
  open: boolean
  setOpen: (open: boolean) => void
}

const AddCategoryDialog = ({ open, setOpen }: Props) => {
  const [form, setForm] = useState({ name: '', description: '' })
  const [loading, setLoading] = useState(false)

  const  user  = useUserStore((state)=>state.user)
  const selectedBranch = useBranchStore((state) => state.selectedBranch)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const branchId =
        (user?.systemRole === 'ADMIN' || user?.role === 'ADMIN')
          ? selectedBranch?.id
          : user?.branchId

      if (!branchId) {
        throw new Error('Branch ID is missing')
      }

      const payload = {
        ...form,
        branchId:selectedBranch?.id,
      }

      const res = await axios.post('/api/inventory/category/create', payload)

      if (res.status === 201) {
        alert('Category added successfully')
        setForm({ name: '', description: '' })
        setOpen(false)
      } else {
        throw new Error('Failed to add category')
      }
    } catch (err) {
      console.error(err)
      alert('Error adding category')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Add New Category</DialogTitle>
          <DialogDescription>
            Add a new top-level category like Gold, Silver, Diamond etc.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <div>
            <Label htmlFor="name">Category Name</Label>
            <Input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g., Gold"
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Optional"
            />
          </div>

          {/* Optional: show branch name if not admin */}
          {user?.systemRole !== 'ADMIN' && user?.role !== 'ADMIN' && (
            <p className="text-sm text-muted-foreground">
              Branch: <strong>{user?.branchId}</strong>
            </p>
          )}

          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Adding...' : 'Add Category'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default AddCategoryDialog
