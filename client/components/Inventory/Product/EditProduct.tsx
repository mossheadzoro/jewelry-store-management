'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useBranchStore } from '@/lib/store/useBranchStore';
import { Progress } from "@/components/ui/progress";
import { toast } from 'sonner';



export default function EditProductPage({id}:{id:number} ) {
 
  
    const {selectedBranch}=useBranchStore()

const router=useRouter()
const [progress, setProgress] = useState(0);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    barcode: '',
    productCode: '',
    huidNumber: '',
    weight: '',
    purity: '',
    price: '',
    quantity: '1',
    image: '',
    description: '',
    branchId: '',
    subCategoryId: '',
  });

  const simulateProgress = () => {
  let value = 0;
  const interval = setInterval(() => {
    value += Math.floor(Math.random() * 10) + 5;
    if (value >= 100) {
      setProgress(100);
      clearInterval(interval);
    } else {
      setProgress(value);
    }
  }, 200);
};

  // 🔁 Fetch product details by ID
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id || !selectedBranch?.id) return;

      try {
        setLoading(true);
        setProgress(10);
        simulateProgress();   
        const [productRes, subCategoryRes] = await Promise.all([
          axios.get(`/api/inventory/product/fetchById/${id}`),
          axios.get(`/api/inventory/subcategory/fetchAll?branchId=${selectedBranch.id}`),
        ]);
        setProgress(70);
        const product = productRes.data;
        const subCats = subCategoryRes.data;

        setSubCategories(subCats);

        setForm({
          name: product.name || '',
          barcode: product.barcode || '',
          productCode: product.productCode || '',
          huidNumber: product.huidNumber || '',
          weight: product.weight?.toString() || '',
          purity: product.purity || '',
          price: product.price?.toString() || '',
          quantity: product.quantity?.toString() || '1',
          image: product.image || '',
          description: product.description || '',
          branchId: selectedBranch.id.toString(),
          subCategoryId: product.subCategoryId || subCats[0]?.id || '',
        });
        setProgress(100);
      } catch (err) {
        console.error('Error fetching product:', err);
        toast("Aww Snap something went wrong")
        setProgress(0);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, selectedBranch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setProgress(10);
      simulateProgress();
      await axios.patch(`/api/inventory/product/updateByID/${id}`, {
        ...form,
        weight: parseFloat(form.weight),
        price: parseFloat(form.price),
        quantity: parseInt(form.quantity),
      });
      setProgress(100);
      toast('Product updated successfully!');
       
      router.push('/inventory');
    } catch (err) {
      console.error('Error updating product:', err);
      toast('Failed to update product');
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-semibold mb-4">Edit Product</h1>
    {loading && (
      <>
        <div className=" justify-center items-center gap-8 mt-40 z-50 relative flex flex-col">
        <span>Loading...</span>
          <Progress value={progress} />
        </div>

        {/* Faded overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-40 transition-opacity duration-300" />
      </>
    )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          ['name', 'Name'],
          ['barcode', 'Barcode'],
          ['productCode', 'Product Code'],
          ['huidNumber', 'HUID Number'],
          ['weight', 'Weight'],
          ['purity', 'Purity'],
          ['price', 'Price'],
          ['quantity', 'Quantity'],
          ['image', 'Image URL'],
        ].map(([field, label]) => (
          <div key={field}>
            <Label htmlFor={field}>{label}</Label>
            <Input
              id={field}
              name={field}
              value={form[field as keyof typeof form]}
              onChange={handleChange}
            />
          </div>
        ))}

        <div className="md:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
          />
        </div>

        <div>
          <Label htmlFor="subCategoryId">Subcategory</Label>
          <select
            id="subCategoryId"
            name="subCategoryId"
            value={form.subCategoryId}
            onChange={handleChange}
            className="w-full px-2 py-2 border rounded bg-black text-white"
          >
            {subCategories.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-4 mt-6">
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? 'Updating...' : 'Update Product'}
        </Button>
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
