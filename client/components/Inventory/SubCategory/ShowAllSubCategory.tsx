"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBranchStore } from "@/lib/store/useBranchStore";

type SubCategory = {
  id: number;
  name: string;
  totalWeight: number;
  category: {
    id: number;
    name: string;
  };
  branchId:number;
};


export default   function ShowAllSubCategory() {
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
const {selectedBranch} = useBranchStore()
const branchId=selectedBranch?.id;
  const fetchSubcategories = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/inventory/subcategory/fetchAll?branchId=${branchId}`);
      console.log(res.data)
      setSubcategories(res.data);
    } catch (error) {
      console.error("Failed to fetch subcategories", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubcategories();
  }, [selectedBranch]);

  return (
    <Card className=" p-6 bg-background rounded-lg shadow-md">
      <div className="flex justify-between items-center ">
        <h2 className="text-xl font-semibold">Add Sub-Category</h2>
        <Button onClick={fetchSubcategories} disabled={loading}>
           {loading ? "Refreshing..." : "Refresh"}
         
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Subcategory Name</TableHead>
            <TableHead>Parent Category</TableHead>
            <TableHead>Total Weight</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subcategories.length > 0 ? (
            subcategories.map((sub) => (
              <TableRow key={sub.id}>
                <TableCell>{sub.id}</TableCell>
                <TableCell>{sub.name}</TableCell>
                <TableCell>{sub.category?.name}</TableCell>
               <TableCell>{sub.totalWeight?.toFixed(2)} g</TableCell>

              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3} className="text-center">
                {loading ? "Loading..." : "No subcategories found"}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
