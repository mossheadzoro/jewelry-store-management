'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useBranchStore } from '@/lib/store/useBranchStore';
import UploadImage from './ProductImageUpload';
import { toast } from 'sonner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  branches: any[];
};

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  barcode: z.string().min(1, 'Barcode is required'),
  productCode: z.string().optional(),
  huidNumber: z.string().min(6, 'HUID is required'),
  weight: z.string().min(1,"Weight is required"),
  purity: z.string().min(1, 'Purity is required'),
  price: z.string().optional(),
  quantity: z.number().min(1, 'Quantity is required'),
  image: z.string().optional(),
  description: z.string().optional(),
  branchId: z.number().min(1, 'Branch is required'),
  subCategoryId: z.string().min(1, 'Subcategory is required'),
});

type RegisterForm = z.infer<typeof productSchema>;


export default function AddProductModal({ open, setOpen, branches }: Props) {
  const { selectedBranch } = useBranchStore();
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [queuedProducts, setQueuedProducts] = useState<RegisterForm[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      branchId: selectedBranch?.id || 0,
      quantity: 1,
    },
  });

  useEffect(() => {
    const fetchSubCategories = async () => {
      try {
        const res = await axios.get(`/api/inventory/subcategory/fetchAll?branchId=${selectedBranch?.id}`);
        setSubCategories(res.data);

        setValue('branchId', selectedBranch?.id || 0);
        if (res.data?.length > 0) {
          setValue('subCategoryId', res.data[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch subcategories:', error);
      }
    };

    if (open) {
      fetchSubCategories();
    }
  }, [open]);

  const onAddToQueue = (data: RegisterForm) => {
    setQueuedProducts((prev) => [...prev, data]);
    reset({
      branchId: selectedBranch?.id || 0,
      subCategoryId: subCategories?.[0]?.id || '',
      quantity: 1,
    });
  };

  const resetQueue = () => {
    setQueuedProducts([]);
  };

  const addToStock = async () => {
    try {
      setLoading(true);
      const res = await axios.post('/api/inventory/product/create', queuedProducts);
      if (!res) throw new Error('Failed to add stock');
      toast('Products Added Successfully!');
      setQueuedProducts([]);
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast('Error adding stocks!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl px-10">
        <DialogHeader>
          <DialogTitle>Add Product</DialogTitle>
          <DialogDescription>Fill the form to queue and save new products.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onAddToQueue)} className="space-y-4">
          <div className="flex flex-wrap md:grid-cols-2 gap-4">
            {[
              ['name', 'Name'],
              ['barcode', 'Barcode'],
              ['productCode', 'Product Code'],
              ['huidNumber', 'HUID Number'],
              ['weight', 'Weight'],
              ['purity', 'Purity'],
              ['price', 'Price'],
              ['quantity', 'Quantity'],
            ].map(([field, label]) => (
              <div key={field} className="w-full md:w-[48%]">
                <Label htmlFor={field}>{label}</Label>
                <Input id={field} {...register(field as keyof RegisterForm)} />
                {errors[field as keyof RegisterForm] && (
                  <p className="text-red-500 text-sm">{errors[field as keyof RegisterForm]?.message}</p>
                )}
              </div>
            ))}

            <div className="w-full">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...register('description')} />
              {errors.description && <p className="text-red-500 text-sm">{errors.description.message}</p>}
            </div>

            <div className="w-full">
              <UploadImage onUpload={(url) => setValue('image', url)} />
              {errors.image && <p className="text-red-500 text-sm">{errors.image.message}</p>}
            </div>

            <div className="w-full">
              <Label htmlFor="subCategoryId">Subcategory</Label>
              <select
                id="subCategoryId"
                {...register('subCategoryId')}
                className="w-full px-2 py-2 border rounded bg-black text-white"
              >
                {subCategories.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {errors.subCategoryId && <p className="text-red-500 text-sm">{errors.subCategoryId.message}</p>}
            </div>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => reset()}>
              Reset
            </Button>
            <Button type="submit">Add to Queue</Button>
            <Button onClick={addToStock} disabled={queuedProducts.length === 0 || loading}>
              {loading ? 'Adding...' : 'Add to Stock'}
            </Button>
            <Button variant="outline" onClick={resetQueue} disabled={queuedProducts.length === 0 || loading}>
              Reset Queue
            </Button>
          </div>
        </form>

        {queuedProducts.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-semibold">Queued Products ({queuedProducts.length})</h4>
            <ul className="list-disc list-inside text-sm">
              {queuedProducts.map((item, idx) => (
                <li key={idx}>
                  {item.name} – HUID: {item.huidNumber}
                </li>
              ))}
            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
