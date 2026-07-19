'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useBranchStore } from '@/lib/store/useBranchStore';
import { useUserStore } from '@/lib/store/useUserStore';
import { toast } from 'sonner';
import { Plus, X, ArrowLeft, Save, Gem, Trash } from 'lucide-react';
import Image from 'next/image';
import UploadImage from "./ProductImageUpload";

interface StoneDetail {
  id?: number;
  name?: string;
  weight: number | '';
  carat?: string;
  color?: string;
  colorGrade?: string;
  clarity?: string;
  cut?: string;
  shape?: string;
  origin?: string;
  treatment?: string;
  certification?: string;
  quality: string;
  quantity?: number | '';
  price?: number | '';
  stoneImageUrl?: string;
  certImageUrl?: string;
  productItemId?: number;
}

interface ProductForm {
  name: string;
  barcode: string;
  productCode: string;
  huidNumber: string;
  gsWeight: string;
  ntWeight: string;
  purity: string;
  price: string;
  quantity: string;
  image: string;
  description: string;
  size: string;
  branchId: string;
  subCategoryId: string;
  otherCharges: string;
  otherChargesPrice: string;
  stoneDetails: StoneDetail[];
}

interface EditProductPageProps {
  id: number;
}

export default function EditProductPage({ id }: EditProductPageProps) {
  const { selectedBranch } = useBranchStore();
  const { user } = useUserStore();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [reservedInfo, setReservedInfo] = useState<{
    reservedQty: number;
    activeBookingDetails: any;
  } | null>(null);

  const [form, setForm] = useState<ProductForm>({
    name: '',
    barcode: '',
    productCode: '',
    huidNumber: '',
    gsWeight: '',
    ntWeight: '',
    purity: '',
    price: '',
    quantity: '1',
    image: '',
    description: '',
    size: '',
    branchId: '',
    subCategoryId: '',
    otherCharges: '',
    otherChargesPrice: '',
    stoneDetails: [],
  });

  const selectedSubCategory = subCategories.find((sc) => sc.id === parseInt(form.subCategoryId || '0'));
  const categoryName = selectedSubCategory?.category?.name || "";
  const isSilver = categoryName.toLowerCase().includes("silver");
  const isDiamond = categoryName.toLowerCase().includes("diamond");

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id || !selectedBranch?.id) return;
      try {
        setLoading(true);
        const [productRes, subCategoryRes] = await Promise.all([
          axios.get(`/api/inventory/product/fetchById/${id}`),
          axios.get(`/api/inventory/subcategory/fetchAll?branchId=${selectedBranch.id}`),
        ]);

        const product = productRes.data;
        const subCats = subCategoryRes.data;

        setSubCategories(subCats);
        if (product.reservedQty > 0) {
          setReservedInfo({
            reservedQty: product.reservedQty,
            activeBookingDetails: product.activeBookingDetails
          });
        }

        setForm({
          name: product.name || '',
          barcode: product.barcode || '',
          productCode: product.productCode || '',
          huidNumber: product.huidNumber || '',
          gsWeight: product.gsWeight?.toString() || '',
          ntWeight: product.ntWeight?.toString() || '',
          purity: product.purity?.toString() || '',
          price: product.price?.toString() || '',
          quantity: product.quantity?.toString() || '1',
          image: product.image || '',
          description: product.description || '',
          size: product.size || '',
          otherCharges: product.otherCharges || '',
          otherChargesPrice: product.otherChargesPrice?.toString() || '',
          stoneDetails: product.stoneDetails || [],
          branchId: selectedBranch.id.toString(),
          subCategoryId: product.subCategoryId?.toString() || subCats[0]?.id?.toString() || '',
        });

      } catch (err) {
        console.error('Error fetching product:', err);
        toast.error("Failed to load product details.");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, selectedBranch]);

  // Auto-calculate Net Weight on weight change
  useEffect(() => {
    const gs = parseFloat(form.gsWeight) || 0;
    if (gs > 0) {
      let deduction = 0;
      form.stoneDetails.forEach((stone) => {
        deduction += parseFloat(String(stone.weight)) || 0;
      });
      const nt = Math.max(0, gs - deduction);
      setForm((prev) => ({ ...prev, ntWeight: nt.toFixed(3) }));
    }
  }, [form.gsWeight, form.stoneDetails]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleStoneChange = (
    index: number,
    field: keyof StoneDetail,
    value: string | number
  ) => {
    setForm((prev) => {
      const updatedStoneDetails = [...prev.stoneDetails];
      (updatedStoneDetails[index] as any)[field] = value;
      return { ...prev, stoneDetails: updatedStoneDetails };
    });
  };

  const handleAddStone = () => {
    setForm((prev) => ({
      ...prev,
      stoneDetails: [
        ...prev.stoneDetails,
        { name: '', weight: '', carat: '', color: '', clarity: '', cut: '', shape: '', quantity: 1, quality: 'Premium', price: '' }
      ]
    }));
  };

  const handleRemoveStone = (indexToRemove: number) => {
    setForm((prev) => ({
      ...prev,
      stoneDetails: prev.stoneDetails.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const payload = {
        ...form,
        gsWeight: parseFloat(form.gsWeight) || 0,
        ntWeight: parseFloat(form.ntWeight) || 0,
        price: form.price ? parseFloat(form.price) : null,
        quantity: parseInt(form.quantity) || 1,
        otherChargesPrice: form.otherChargesPrice ? parseFloat(form.otherChargesPrice) : null,
      };

      await axios.patch(`/api/inventory/product/updateByID/${id}`, payload);

      toast.success('Product updated successfully!');
      router.back();
    } catch (err) {
      console.error('Error updating product:', err);
      toast.error('Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  if (loading && form.name === "") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col justify-center items-center gap-4 text-white">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-[#d4a843] border-t-transparent rounded-full animate-spin"></div>
        </div>
        <span className="text-gray-400 text-sm tracking-widest uppercase font-semibold">Loading product details...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8 w-full">
      {/* Header and Breadcrumb */}
      <div className="max-w-6xl mx-auto mb-8 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> Back to subcategory
        </button>
        <h1 className="text-3xl font-light text-gray-300 tracking-tight flex items-center gap-3">
          Edit Product: <span className="text-[#d4a843] font-normal">{form.name || "Loading..."}</span>
        </h1>
      </div>

      <div className="max-w-6xl mx-auto bg-[#0f0f0f] border border-gray-800 rounded-2xl p-8 relative">
        {loading && (
          <div className="absolute inset-0 bg-[#0f0f0f]/80 backdrop-blur-sm z-50 rounded-2xl flex flex-col justify-center items-center gap-4">
            <div className="w-12 h-12 border-4 border-[#d4a843] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-400 text-xs tracking-wider uppercase">Saving Changes...</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          {/* LEFT COLUMN */}
          <div className="space-y-8">
            
            {reservedInfo && reservedInfo.reservedQty > 0 && (
              <div className="bg-[#d4a843]/10 border border-[#d4a843]/30 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h3 className="text-[#d4a843] font-semibold text-sm">Item Reserved</h3>
                  <p className="text-gray-400 text-xs mt-1">
                    {reservedInfo.reservedQty} unit(s) of this item are currently reserved.
                    {reservedInfo.activeBookingDetails && (
                      <span className="ml-1">
                        Booked by <strong>{reservedInfo.activeBookingDetails.customerName}</strong> 
                        (Booking #{reservedInfo.activeBookingDetails.bookingNumber}).
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* BASIC DETAILS */}
            <div>
              <div className="flex items-center gap-4 mb-6">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#d4a843]">Basic Details</span>
                <div className="h-[1px] flex-1 bg-gray-800/60"></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label className="text-xs text-gray-500 font-medium mb-1.5 block">Name</Label>
                  <Input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Product name..."
                    className="bg-[#1a1a1a] border-gray-800 text-white h-11 focus-visible:ring-[#d4a843]"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 font-medium mb-1.5 block">Product Code</Label>
                  <Input
                    name="productCode"
                    value={form.productCode}
                    onChange={handleChange}
                    disabled={!(user?.systemRole === "ADMIN" || user?.role === "ADMIN" || user?.systemRole === "MANAGER" || user?.role === "MANAGER")}
                    className="bg-[#1a1a1a] border-gray-800 text-white h-11 disabled:opacity-50"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 font-medium mb-1.5 block">Barcode</Label>
                  <Input
                    name="barcode"
                    value={form.barcode}
                    onChange={handleChange}
                    disabled={!(user?.systemRole === "ADMIN" || user?.role === "ADMIN" || user?.systemRole === "MANAGER" || user?.role === "MANAGER")}
                    className="bg-[#1a1a1a] border-gray-800 text-white h-11 disabled:opacity-50"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 font-medium mb-1.5 block">HUID Number</Label>
                  <Input
                    name="huidNumber"
                    value={form.huidNumber}
                    onChange={handleChange}
                    disabled={!(user?.systemRole === "ADMIN" || user?.role === "ADMIN" || user?.systemRole === "MANAGER" || user?.role === "MANAGER")}
                    placeholder="Hallmark ID..."
                    className="bg-[#1a1a1a] border-gray-800 text-white h-11 disabled:opacity-50"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 font-medium mb-1.5 block">Quantity</Label>
                  <Input
                    name="quantity"
                    type="number"
                    value={form.quantity}
                    onChange={handleChange}
                    className="bg-[#1a1a1a] border-gray-800 text-white h-11"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 font-medium mb-1.5 block">Purity</Label>
                  {isSilver ? (
                    <Input
                      name="purity"
                      value={form.purity}
                      onChange={handleChange}
                      placeholder="e.g. 925"
                      className="bg-[#1a1a1a] border-gray-800 text-white h-11"
                    />
                  ) : (
                    <select
                      name="purity"
                      value={form.purity}
                      onChange={handleChange}
                      className="w-full bg-[#1a1a1a] border border-gray-800 text-white rounded-md h-11 px-3 text-sm focus:outline-none focus:border-[#d4a843]"
                    >
                      <option value="">Select Purity</option>
                      <option value="24">24K</option>
                      <option value="22">22K</option>
                      <option value="18">18K</option>
                      <option value="14">14K</option>
                      <option value="9">9K</option>
                    </select>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-gray-500 font-medium mb-1.5 block">Size</Label>
                  <Input
                    name="size"
                    value={form.size}
                    onChange={handleChange}
                    placeholder="e.g. 12, 14, N"
                    className="bg-[#1a1a1a] border-gray-800 text-white h-11"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 font-medium mb-1.5 block">SubCategory</Label>
                  <select
                    name="subCategoryId"
                    value={form.subCategoryId}
                    onChange={handleChange}
                    className="w-full bg-[#1a1a1a] border border-gray-800 text-white rounded-md h-11 px-3 text-sm focus:outline-none focus:border-[#d4a843]"
                  >
                    {subCategories.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* WEIGHT METRICS */}
            <div>
              <div className="flex items-center gap-4 mb-6">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#d4a843]">Weight Metrics</span>
                <div className="h-[1px] flex-1 bg-gray-800/60"></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-5 relative overflow-hidden focus-within:border-[#d4a843] transition-colors">
                  <p className="text-xs text-gray-500 font-medium mb-2">Gross Weight</p>
                  <div className="flex items-baseline gap-2">
                    <Input
                      name="gsWeight"
                      value={form.gsWeight}
                      onChange={handleChange}
                      placeholder="00.000"
                      className="border-none bg-transparent text-3xl font-light text-white p-0 h-auto focus-visible:ring-0 w-32"
                    />
                    <span className="text-sm text-gray-500">gms</span>
                  </div>
                </div>

                <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-5 relative overflow-hidden focus-within:border-[#d4a843] transition-colors">
                  <p className="text-xs text-gray-500 font-medium mb-2">Net Weight <span className="text-[10px] text-gray-600">(auto-calculated)</span></p>
                  <div className="flex items-baseline gap-2">
                    <Input
                      name="ntWeight"
                      value={form.ntWeight}
                      onChange={handleChange}
                      placeholder="00.000"
                      className="border-none bg-transparent text-3xl font-light text-white p-0 h-auto focus-visible:ring-0 w-32"
                    />
                    <span className="text-sm text-gray-500">gms</span>
                  </div>
                </div>
              </div>
            </div>

            {/* OTHER CHARGES */}
            <div>
              <div className="flex items-center gap-4 mb-6">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#d4a843]">Other Charges</span>
                <div className="h-[1px] flex-1 bg-gray-800/60"></div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500 font-medium mb-1.5 block">Description</Label>
                  <Input
                    name="otherCharges"
                    value={form.otherCharges}
                    onChange={handleChange}
                    placeholder="e.g. Labour"
                    className="bg-[#1a1a1a] border-gray-800 text-white h-11"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500 font-medium mb-1.5 block">Price</Label>
                  <div className="flex items-center gap-2 bg-[#1a1a1a] border border-gray-800 rounded-md px-3 h-11">
                    <span className="text-[#d4a843] text-sm">₹</span>
                    <Input
                      name="otherChargesPrice"
                      value={form.otherChargesPrice}
                      onChange={handleChange}
                      placeholder="0"
                      className="border-none bg-transparent text-white p-0 h-full focus-visible:ring-0 text-sm w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* BASE PRICE */}
            <div>
              <div className="flex items-center gap-4 mb-6">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#d4a843]">Base Price</span>
                <div className="h-[1px] flex-1 bg-gray-800/60"></div>
              </div>

              <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-5">
                <div className="flex items-center gap-2">
                  <span className="text-[#d4a843] font-medium text-xl">₹</span>
                  <Input
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="border-none bg-transparent text-2xl text-white p-0 h-auto focus-visible:ring-0"
                  />
                </div>
              </div>
            </div>

            {/* STONE DETAILS */}
            {!isDiamond && (
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#d4a843]">Stone Details</span>
                  <div className="h-[1px] flex-1 bg-gray-800/60"></div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={handleAddStone}
                      className="bg-[#1a1a1a] hover:bg-[#222] text-[#d4a843] border border-gray-800 h-9 text-xs flex items-center gap-1.5 rounded-xl"
                    >
                      <Plus size={14} /> Add Stone
                    </Button>
                  </div>

                  {form.stoneDetails.map((stone, index) => (
                    <div key={index} className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-5 relative">
                      <button
                        type="button"
                        onClick={() => handleRemoveStone(index)}
                        className="absolute top-4 right-4 text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <Trash size={16} />
                      </button>
                      <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-1.5">
                        <Gem size={16} className="text-[#d4a843]" /> Stone #{index + 1}
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-[10px] text-gray-500 uppercase">Name</Label>
                          <Input
                            value={stone.name || ''}
                            onChange={(e) => handleStoneChange(index, "name", e.target.value)}
                            className="bg-[#222] border-gray-800 text-white h-9 text-xs mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-gray-500 uppercase">Carat</Label>
                          <Input
                            value={stone.carat || ''}
                            onChange={(e) => handleStoneChange(index, "carat", e.target.value)}
                            className="bg-[#222] border-gray-800 text-white h-9 text-xs mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-gray-500 uppercase">Weight (g)</Label>
                          <Input
                            type="number"
                            value={stone.weight || ''}
                            onChange={(e) => handleStoneChange(index, "weight", e.target.value)}
                            className="bg-[#222] border-gray-800 text-white h-9 text-xs mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-gray-500 uppercase">Price</Label>
                          <Input
                            value={stone.price || ''}
                            onChange={(e) => handleStoneChange(index, "price", e.target.value)}
                            className="bg-[#222] border-gray-800 text-white h-9 text-xs mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-gray-500 uppercase">Quantity</Label>
                          <Input
                            type="number"
                            value={stone.quantity || ''}
                            onChange={(e) => handleStoneChange(index, "quantity", e.target.value)}
                            className="bg-[#222] border-gray-800 text-white h-9 text-xs mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-6">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#d4a843]">Product Image</span>
                <div className="h-[1px] flex-1 bg-gray-800/60"></div>
              </div>
              
              <div className="bg-[#1a1a1a] border border-dashed border-gray-800 rounded-xl p-4 flex flex-col items-center justify-center gap-4">
                {form.image && (
                  <div className="relative w-full aspect-square max-h-48 rounded-xl overflow-hidden bg-black/40 border border-gray-800/50 flex items-center justify-center">
                    <img
                      src={form.image}
                      alt={form.name || 'Product Image'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <UploadImage onUpload={(url) => setForm((prev) => ({ ...prev, image: url }))} />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-4 mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#d4a843]">Description</span>
                <div className="h-[1px] flex-1 bg-gray-800/60"></div>
              </div>
              <Textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Optional notes about the piece..."
                className="bg-[#1a1a1a] border-gray-800 text-white resize-none h-44"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-[#0a0a0a] border-t border-gray-800/60 p-6 flex items-center justify-end gap-3 mt-8 -mx-8 -mb-8 rounded-b-2xl">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            className="text-xs font-bold text-gray-400 uppercase tracking-wider hover:text-white transition-colors h-11 px-6 rounded-full"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 h-11 bg-[#d4a843] text-black hover:bg-[#b58b2e] text-xs font-bold tracking-widest uppercase rounded-full transition-colors flex items-center gap-2"
          >
            <Save size={14} /> {loading ? 'Saving...' : 'Save Product'}
          </Button>
        </div>
      </div>
    </div>
  );
}
