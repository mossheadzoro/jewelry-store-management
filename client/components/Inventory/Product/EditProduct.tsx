// 'use client';

// import { useEffect, useState } from 'react';
// import { useParams, useRouter } from 'next/navigation';
// import axios from 'axios';
// import { Input } from '@/components/ui/input';
// import { Textarea } from '@/components/ui/textarea';
// import { Button } from '@/components/ui/button';
// import { Label } from '@/components/ui/label';
// import { useBranchStore } from '@/lib/store/useBranchStore';
// import { Progress } from "@/components/ui/progress";
// import { toast } from 'sonner';
// import { useUserStore } from '@/lib/store/useUserStore';
// import Image from 'next/image';





// export default function EditProductPage({id}:{id:number} ) {
 
  
//     const {selectedBranch}=useBranchStore()
//     const {user}=useUserStore();

//     console.log(user?.role)

// const router=useRouter()
// const [progress, setProgress] = useState(0);
//   const [subCategories, setSubCategories] = useState<any[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [form, setForm] = useState({
//     name: '',
//     barcode: '',
//     productCode: '',
//     huidNumber: '',
//     gsWeight: '',
//     ntWeight:'',
//     purity: '',
//     price: '',
//     quantity: '1',
//     image: '',
//     description: '',
//     branchId: '',
//     subCategoryId: '',
//     otherCharges:'',
//     otherChargesPrice:'',
//     stoneDetails:[],
//   });
//   // Predefine the stone fields and labels
// const stoneFields: [keyof StoneDetail, string][] = [
//   ['name', 'Name'],
//   ['weight', 'Weight'],
//   ['carat', 'Carat'],
//   ['color', 'Color'],
//   ['colorGrade', 'Color Grade'],
//   ['clarity', 'Clarity'],
//   ['cut', 'Cut'],
//   ['shape', 'Shape'],
//   ['origin', 'Origin'],
//   ['treatment', 'Treatment'],
//   ['certification', 'Certification'],
//   ['quality', 'Quality'],
//   ['quantity', 'Quantity'],
//   ['price', 'Price'],
//   ['stoneImageUrl', 'Stone Image URL'],
//   ['certImageUrl', 'Certificate Image URL'],
// ];


//   const simulateProgress = () => {
//   let value = 0;
//   const interval = setInterval(() => {
//     value += Math.floor(Math.random() * 10) + 5;
//     if (value >= 100) {
//       setProgress(100);
//       clearInterval(interval);
//     } else {
//       setProgress(value);
//     }
//   }, 200);
// };

//   // 🔁 Fetch product details by ID
//   useEffect(() => {
//     const fetchProduct = async () => {
//       if (!id || !selectedBranch?.id) return;

//       try {
//         setLoading(true);
//         setProgress(10);
//         simulateProgress();   
//         const [productRes, subCategoryRes] = await Promise.all([
//           axios.get(`/api/inventory/product/fetchById/${id}`),
//           axios.get(`/api/inventory/subcategory/fetchAll?branchId=${selectedBranch.id}`),
//         ]);
//         setProgress(70);
//         const product = productRes.data;
//         const subCats = subCategoryRes.data;

//         setSubCategories(subCats);

//         setForm({
//           name: product.name || '',
//           barcode: product.barcode || '',
//           productCode: product.productCode || '',
//           huidNumber: product.huidNumber || '',
//           gsWeight: product.gsWeight?.toString() || '',
//           ntWeight: product.ntWeight?.toString() || '',
//           purity: product.purity || '',
//           price: product.price?.toString() || '',
//           quantity: product.quantity?.toString() || '1',
//           image: product.image || '',
//           description: product.description || '',
//           otherCharges:product.otherCharges || '',
//           otherChargesPrice:product.otherChargesPrice || '',
//           stoneDetails:product.stoneDetails || [],
//           branchId: selectedBranch.id.toString(),
//           subCategoryId: product.subCategoryId || subCats[0]?.id || '',
//         });
//         setProgress(100);
//       } catch (err) {
//         console.error('Error fetching product:', err);
//         toast("Aww Snap something went wrong")
//         setProgress(0);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchProduct();
//   }, [id, selectedBranch]);

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
//     setForm((prev) => ({
//       ...prev,
//       [e.target.name]: e.target.value,
//     }));
//   };

//   const handleSubmit = async () => {
//     try {
//       setLoading(true);
//       setProgress(10);
//       simulateProgress();
//       await axios.patch(`/api/inventory/product/updateByID/${id}`, {
//         ...form,
//         gsWeight: parseFloat(form.gsWeight),
//         ntWeight: parseFloat(form.ntWeight),
//         price: parseFloat(form.price),
//         quantity: parseInt(form.quantity),
//       });
//       setProgress(100);
//       toast('Product updated successfully!');
       
//       router.push('/inventory');
//     } catch (err) {
//       console.error('Error updating product:', err);
//       toast('Failed to update product');
//       setProgress(0);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="max-w-4xl mx-auto px-4 py-6">
//       <h1 className="text-2xl font-semibold mb-4">Edit Product</h1>
//     {loading && (
//       <>
//         <div className=" justify-center items-center gap-8 mt-40 z-50 relative flex flex-col">
//         <span>Loading...</span>
//           <Progress value={progress} />
//         </div>

//         {/* Faded overlay */}
//         <div className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-40 transition-opacity duration-300" />
//       </>
//     )}
//      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//   {/* Sensitive fields: permission-based */}
//   {[
//     ['productCode', 'Product Code'],
//     ['barcode', 'Barcode'],
//     ['huidNumber', 'HUID Number'],
//   ].map(([field, label]) => (
//     <div key={field}>
//       <Label htmlFor={field}>{label}</Label>
//       <Input
//         id={field}
//         name={field}
//         value={form[field as keyof typeof form]}
//         onChange={handleChange}
//         disabled={!(user?.role==="ADMIN"||user?.role==="MANAGER")} // permission check
//       />
//     </div>
//   ))}

//   {/* Other editable fields */}
//   {[
//     ['name', 'Name'],
//     ['gsWeight', 'GS.Weight'],
//     ['ntWeight', 'NT.Weight'],
//     ['purity', 'Purity'],
//     ['price', 'Price'],
//     ['quantity', 'Quantity'],
//     ['description','Description'],
//     ['otherCharges','OtherCharges'],
//     ['otherChargesPrice','Other Charges Price'],
    
//   ].map(([field, label]) => (
//     <div key={field}>
//       <Label htmlFor={field}>{label}</Label>
//       <Input
//         id={field}
//         name={field}
//         value={form[field as keyof typeof form]}
//         onChange={handleChange}
//       />
//     </div>
//   ))}

//   {/* Display product image if available */}
//   {form.image && (
//     <div className="col-span-1 md:col-span-2 flex justify-center items-center">
//       <Image
//         src={form.image}
//         alt={form.name || 'Product Image'}
//         className="max-h-48 rounded shadow"
//       />
//     </div>
//   )}
// </div>
// {form.stoneDetails && form.stoneDetails.length > 0 && (
//   <div className="col-span-1 md:col-span-2 border p-4 rounded space-y-4">
//     <h3 className="font-semibold text-lg mb-2">Stone Details</h3>
//     {form.stoneDetails.map((stone, index) => (
//       <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2">
//         {stone.map(([field, label]) => (
//           <div key={field}>
//             <Label htmlFor={`stoneDetails[${index}].${field}`}>
//               {label}
//             </Label>
//             <Input
//               id={`stoneDetails[${index}].${field}`}
//               name={`stoneDetails[${index}].${field}`}
//               value={(stone as any)[field] || ''}
//               onChange={handleChange}
//             />
//           </div>
//         ))}
//       </div>
//     ))}
//   </div>
// )}



//       <div className="flex gap-4 mt-6">
//         <Button onClick={handleSubmit} disabled={loading}>
//           {loading ? 'Updating...' : 'Update Product'}
//         </Button>
//         <Button variant="outline" onClick={() => router.back()}>
//           Cancel
//         </Button>
//       </div>
//     </div>
//   );
// }
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
import { Progress } from "@/components/ui/progress";
import { toast } from 'sonner';
import Image from 'next/image';

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
  const [progress, setProgress] = useState(0);
  const [subCategories, setSubCategories] = useState<any[]>([]);

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
    branchId: '',
    subCategoryId: '',
    otherCharges: '',
    otherChargesPrice: '',
    stoneDetails: [],
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

  const stoneFields: [keyof StoneDetail, string][] = [
    ['name', 'Name'],
    ['weight', 'Weight'],
    ['carat', 'Carat'],
    ['color', 'Color'],
    ['colorGrade', 'Color Grade'],
    ['clarity', 'Clarity'],
    ['cut', 'Cut'],
    ['shape', 'Shape'],
    ['origin', 'Origin'],
    ['treatment', 'Treatment'],
    ['certification', 'Certification'],
    ['quality', 'Quality'],
    ['quantity', 'Quantity'],
    ['price', 'Price'],
    ['stoneImageUrl', 'Stone Image URL'],
    ['certImageUrl', 'Certificate Image URL'],
  ];

  // Fetch product details
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

        const product = productRes.data;
        const subCats = subCategoryRes.data;

        setSubCategories(subCats);

        setForm({
          name: product.name || '',
          barcode: product.barcode || '',
          productCode: product.productCode || '',
          huidNumber: product.huidNumber || '',
          gsWeight: product.gsWeight?.toString() || '',
          ntWeight: product.ntWeight?.toString() || '',
          purity: product.purity || '',
          price: product.price?.toString() || '',
          quantity: product.quantity?.toString() || '1',
          image: product.image || '',
          description: product.description || '',
          otherCharges: product.otherCharges || '',
          otherChargesPrice: product.otherChargesPrice || '',
          stoneDetails: product.stoneDetails || [],
          branchId: selectedBranch.id.toString(),
          subCategoryId: product.subCategoryId || subCats[0]?.id || '',
        });

        setProgress(100);
      } catch (err) {
        console.error('Error fetching product:', err);
        toast("Aww Snap something went wrong");
        setProgress(0);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, selectedBranch]);

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

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setProgress(10);
      simulateProgress();

      await axios.patch(`/api/inventory/product/updateByID/${id}`, {
        ...form,
        gsWeight: parseFloat(form.gsWeight),
        ntWeight: parseFloat(form.ntWeight),
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
          <div className="flex flex-col items-center gap-4 mt-40 z-50 relative">
            <span>Loading...</span>
            <Progress value={progress} />
          </div>
          <div className="absolute inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-40 transition-opacity duration-300" />
        </>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Sensitive fields with permission */}
        {['productCode', 'barcode', 'huidNumber'].map((field) => (
          <div key={field}>
            <Label htmlFor={field}>{field}</Label>
            <Input
              id={field}
              name={field}
             value={String(form[field as keyof ProductForm] ?? '')}

              onChange={handleChange}
              disabled={!(user?.role === "ADMIN" || user?.role === "MANAGER")}
            />
          </div>
        ))}

        {/* Other fields */}
        {[
          'name', 'gsWeight', 'ntWeight', 'purity', 'price', 'quantity', 'description',
          'otherCharges', 'otherChargesPrice'
        ].map((field) => (
          <div key={field}>
            <Label htmlFor={field}>{field}</Label>
            <Input
              id={field}
              name={field}
             value={String(form[field as keyof ProductForm] ?? '')}

              onChange={handleChange}
            />
          </div>
        ))}

        {/* Product Image */}
        {form.image && (
          <div className="col-span-1 md:col-span-2 flex justify-center items-center">
            <Image
              src={form.image}
              alt={form.name || 'Product Image'}
              className="max-h-48 rounded shadow"
              width={200}
              height={200}
            />
          </div>
        )}
      </div>

      {/* Stone Details */}
      {form.stoneDetails && form.stoneDetails.length > 0 && (
        <div className="col-span-1 md:col-span-2 border p-4 rounded space-y-4 mt-4">
          <h3 className="font-semibold text-lg mb-2">Stone Details</h3>
          {form.stoneDetails.map((stone, index) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {stoneFields.map(([field, label]) => (
                <div key={field}>
                  <Label htmlFor={`stoneDetails[${index}].${field}`}>
                    {label}
                  </Label>
                  <Input
                    id={`stoneDetails[${index}].${field}`}
                    name={`stoneDetails[${index}].${field}`}
                    value={(stone as any)[field] ?? ''}
                    onChange={(e) =>
                      handleStoneChange(index, field, e.target.value)
                    }
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

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
