"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";
import { useEffect, useState } from "react";
import { useBranchStore } from "@/lib/store/useBranchStore";


type Props = {
  open: boolean
  setOpen: (open: boolean) => void
  onSuccess?: () => void
  parentCategoryId?: number
}
const SubCategoryModal=({ open, setOpen, onSuccess, parentCategoryId }: Props)=> {
  
    const {selectedBranch}=useBranchStore()
  const branchId=selectedBranch?.id
  console.log("BranchID:",branchId)
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState([]);
  const [loading,setLoading]=useState(false);
  const handleSubmit = async () => {
    setLoading(true)
    try {
    
      const res = await axios.post("/api/inventory/subcategory/create", {
        name,
        categoryId,
        branchId:branchId,
      });
      if (res.status === 200 || res.status === 201) {
        alert("Sub-category created");
        setName("");
        if (!parentCategoryId) setCategoryId("");
        setOpen(false);
        setLoading(false);
        onSuccess?.();
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (parentCategoryId) {
      setCategoryId(parentCategoryId.toString());
    } else {
      if (!branchId) return;
      axios.get(`/api/inventory/category/fetchAll?branchId=${branchId}`)
        .then((res) => setCategories(res.data))
        .catch((err) => console.error("Failed to fetch categories:", err));
    }
  }, [open, parentCategoryId, branchId]);


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Sub Category</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter sub-category name"
            />
          </div>
          {!parentCategoryId && (
            <div>
              <Label>Parent Category</Label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2 bg-background text-foreground"
              >
                <option value="">Select category</option>
                {categories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <Button onClick={handleSubmit} disabled={loading}>
            {loading?"Creating...":"Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SubCategoryModal;