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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useBranchStore } from "@/lib/store/useBranchStore";
import { useRouter } from "next/navigation";



type Product = {
  id: number;
  name: string;
  gsWeight: number;
  ntWeight:number;
  barcode: string;
  purity: string;
};

export default function ShowAllProducts() {
  const router=useRouter()
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const { selectedBranch } = useBranchStore();
  const fetchProducts = async () => {
    try {
      setLoading(true);
      // 👇 Example (frontend side)

      const res = await axios.get(
        `/api/inventory/product/fetchAll?branchId=${selectedBranch?.id}`
      );

      setProducts(res.data);
      setFilteredProducts(res.data);
    } catch (error) {
      console.error("Failed to fetch products", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearch(query);

    const lowerQuery = query.toLowerCase();

    const filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(lowerQuery) ||
        product.barcode.toLowerCase().includes(lowerQuery) ||
        product.purity.toLowerCase().includes(lowerQuery) ||
        product.id.toString().includes(lowerQuery) ||
        product.gsWeight.toString().includes(lowerQuery)||
        product.ntWeight.toString().includes(lowerQuery)
    );

    setFilteredProducts(filtered);
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedBranch]);

  return (
    <Card className="p-6 bg-background rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          All Products ({selectedBranch?.name})
        </h2>
        <Button onClick={fetchProducts} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>
      <Input
        placeholder="Search by Name, Barcode ID, Weight, Product ID..."
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
        className="mb-4"
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product ID</TableHead>
            <TableHead>Product Name</TableHead>
            <TableHead>GS.Weight</TableHead>
            <TableHead>NT.Weight</TableHead>
            <TableHead>Barcode ID</TableHead>
            <TableHead>Purity</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredProducts.length > 0 ? (
            filteredProducts.map((p) => (
              <TableRow onClick={()=>router.push(`/inventory/product/${p.id}`)} key={p.id}>
                <TableCell>{p.id}</TableCell>
                <TableCell>{p.name}</TableCell>
                <TableCell>{p.gsWeight.toFixed(2)} g</TableCell>
                <TableCell>{p.ntWeight.toFixed(2)} g</TableCell>
                <TableCell>{p.barcode}</TableCell>
                <TableCell>{p.purity}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center">
                {loading ? "Loading..." : "No products found"}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
