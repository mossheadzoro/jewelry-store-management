const fs = require('fs');
let code = fs.readFileSync('components/Inventory/Product/AddProductForm.tsx', 'utf8');

// 1. Component Props & Name
code = code.replace(
  'export default function AddProductModal({ open, setOpen, branches, onSuccess, categoryId }: Props) {',
  'export default function ReceiveStampingForm({ open, setOpen, branches, onSuccess, stampingProduct }: Props) {'
);
code = code.replace(
  'categoryId?: number;',
  'categoryId?: number;\n  stampingProduct: any;'
);

// 2. Default values
code = code.replace(
  `defaultValues: {
      branchId: selectedBranch?.id || 0,
      quantity: 1,
      stoneDetails: [],
      size: "",
    },`,
  `defaultValues: {
      branchId: selectedBranch?.id || 0,
      quantity: 1,
      stoneDetails: [],
      size: "",
      name: stampingProduct?.name || "",
      ntWeight: stampingProduct?.ntWeight?.toString() || "",
      gsWeight: stampingProduct?.gsWeight?.toString() || "",
      purity: stampingProduct?.purity?.toString() || "",
    },`
);

// 3. fetchSubCategories
code = code.replace(
  `        let fetchedData = res.data;
        if (categoryId) {
          fetchedData = fetchedData.filter((s: any) => s.category?.id === categoryId);
        }

        setSubCategories(fetchedData);
        setValue("branchId", selectedBranch?.id || 0);

        if (fetchedData?.length > 0) {
          setValue("subCategoryId", fetchedData[0].id);

          // Feature #4 — auto-generate codes immediately with fresh data
          const categoryName = fetchedData[0].category?.name;
          if (categoryName && selectedBranch?.id) {
            try {
              const codesRes = await axios.post("/api/inventory/product/codes", {
                branchId: selectedBranch.id,
                categoryName,
                offset: 0,
              });
              setValue("productCode", codesRes.data.productCode);
              setValue("barcode", codesRes.data.barcode);
            } catch (err) {
              console.error("Failed to auto-generate initial codes:", err);
            }
          }
        }`,
  `        let fetchedData = res.data.filter((s: any) => {
           const catName = s.category?.name?.toUpperCase() || "";
           return !["UNMARKED JEWELLERY", "STAMPING CENTER", "RAW FINE GOLD", "RAW FINE SILVER"].includes(catName);
        });
        
        setSubCategories(fetchedData);
        
        // Extract unique categories
        const uniqueCategories = Array.from(new Set(fetchedData.map((s: any) => s.category?.id))).map(id => {
          return fetchedData.find((s: any) => s.category?.id === id)?.category;
        }).filter(Boolean);
        
        setCategories(uniqueCategories);

        setValue("branchId", selectedBranch?.id || 0);

        if (uniqueCategories.length > 0) {
           setSelectedCategoryId(uniqueCategories[0].id);
           const firstSubCat = fetchedData.find((s: any) => s.category?.id === uniqueCategories[0].id);
           if (firstSubCat) {
             setValue("subCategoryId", firstSubCat.id);
             // auto-generate codes immediately with fresh data
             const categoryName = firstSubCat.category?.name;
             if (categoryName && selectedBranch?.id) {
               try {
                 const codesRes = await axios.post("/api/inventory/product/codes", {
                   branchId: selectedBranch.id,
                   categoryName,
                   offset: 0,
                 });
                 // Only set if not already pre-filled from stamping product
                 setValue("productCode", codesRes.data.productCode);
                 setValue("barcode", codesRes.data.barcode);
               } catch (err) {
                 console.error("Failed to auto-generate initial codes:", err);
               }
             }
           }
        }`
);

// 4. Missing states
code = code.replace(
  'const [queuedProducts, setQueuedProducts] = useState<any[]>([]);',
  'const [categories, setCategories] = useState<any[]>([]);\n  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(0);'
);

// 5. Replace onAddToQueue with handleReceiveSubmit
code = code.replace(/const onAddToQueue = \(data: RegisterForm\) => \{[\s\S]*?const resetQueue = \(\) => \{[\s\S]*?  \};/m,
  `const handleReceiveSubmit = async (data: RegisterForm) => {
    try {
      setLoading(true);

      const subCategoryIdAsNumber = parseInt(data.subCategoryId.toString(), 10);
      const finalSubCategoryId = isNaN(subCategoryIdAsNumber) ? 0 : subCategoryIdAsNumber;

      const foundSubCat = subCategories.find((sc: any) => sc.id === finalSubCategoryId);

      let finalStones: any[] = [];
      if (isDiamond) {
        finalStones = [
          {
            carat: data.carat,
            weight: (parseFloat(data.carat || "0") * 0.2).toFixed(3),
            color: data.color,
            clarity: data.clarity,
            shape: data.shape,
            cut: data.cut,
            price: data.diamondCostPerCent,
            quantity: 1,
          },
        ];
      } else {
        finalStones = stones.filter((s) => parseFloat(String(s.weight)) > 0);
      }

      let finalPrice = data.price;
      let finalDescription = data.description;
      let finalOtherCharges = data.otherCharges;
      let finalOtherChargesPrice = data.otherChargesPrice;

      if (!showBasePrice) {
        finalPrice = undefined;
        finalDescription = undefined;
        finalOtherCharges = undefined;
        finalOtherChargesPrice = undefined;
      } else {
        if (data.otherChargesPrice) {
          finalOtherChargesPrice = parseFloat(data.otherChargesPrice.toString());
        }
      }

      const productWithStones = {
        ...data,
        price: finalPrice,
        description: finalDescription,
        otherCharges: finalOtherCharges || undefined,
        otherChargesPrice: finalOtherChargesPrice,
        subCategoryId: finalSubCategoryId,
        stoneDetails: finalStones,
        subCategoryName: foundSubCat?.name || "Unknown",
        stampingId: stampingProduct.id,
      };

      await axios.post("/api/inventory/stamping/receive", {
        branchId: selectedBranch?.id,
        items: [productWithStones],
      });

      reset({
        branchId: selectedBranch?.id || 0,
        subCategoryId: subCategories?.[0]?.id || 0,
        quantity: 1,
        stoneDetails: [],
        size: "",
        certNumber: "",
        certCenter: "",
        carat: "",
        color: "",
        clarity: "",
        shape: "",
        cut: "",
        diamondCostPerCent: "",
        certCharge: "",
        makingCharge: "",
        makingChargeType: "FX",
        certImage: "",
      });
      setStones([]);
      setShowBasePrice(false);
      setShowMakingCharge(false);

      if (onSuccess) onSuccess();
      setOpen(false);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || "Error receiving product!");
    } finally {
      setLoading(false);
    }
  };`);

// 6. Fix JSX Titles & OnSubmit
code = code.replace('Add New Product', 'Receive Product');
code = code.replace('Inventory Entry', 'From Stamping Center');
code = code.replace('Create jewellery inventory item for the master ledger', 'Finalize the stamped product and move it to your main inventory.');
code = code.replace('onSubmit={handleSubmit(onAddToQueue)}', 'onSubmit={handleSubmit(handleReceiveSubmit)}');

// 7. Remove Queue Logic from JSX 
// We know that `QUEUE SUMMARY` section is at the end of the form.
// Let's replace everything from `{/* QUEUE SUMMARY */}` to `</form>` correctly keeping tags balanced.
// Looking at `AddProductForm.tsx`, the queue summary block starts inside the `space-y-8` left column and ends just before `</div> </div> </form>`
code = code.replace(/\{\/\* QUEUE SUMMARY \*\/\}[\s\S]*?<\/form>/m,
  `              </div>
            </div>
          </form>`);

// 8. Fix grid for the form
code = code.replace('grid grid-cols-1 md:grid-cols-[1fr_320px] gap-8', 'grid grid-cols-1 gap-8');

// 9. Add Target Category
code = code.replace(
  `<div>
                      <Label className="text-xs text-[#888] font-medium mb-1.5 block">SubCategory</Label>`,
  `<div className="col-span-2 grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-[#888] font-medium mb-1.5 block">Target Category</Label>
                        <select
                          value={selectedCategoryId}
                          onChange={(e) => {
                            const newCatId = Number(e.target.value);
                            setSelectedCategoryId(newCatId);
                            const firstSubCat = subCategories.find((sc) => sc.category?.id === newCatId);
                            if (firstSubCat) {
                              setValue("subCategoryId", firstSubCat.id);
                              // Auto regenerate codes for the new category
                              const categoryName = firstSubCat.category?.name;
                              if (categoryName && selectedBranch?.id) {
                                axios.post("/api/inventory/product/codes", {
                                  branchId: selectedBranch.id,
                                  categoryName,
                                  offset: 0,
                                }).then(res => {
                                  setValue("productCode", res.data.productCode);
                                  setValue("barcode", res.data.barcode);
                                }).catch(console.error);
                              }
                            }
                          }}
                          className="w-full bg-[#1a1a1a] border border-[#333] text-white rounded-md px-3 h-11 focus:border-[#d4a843] outline-none"
                        >
                          {categories.map((c: any) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs text-[#888] font-medium mb-1.5 block">SubCategory</Label>`
);
code = code.replace(
  '{errors.subCategoryId && <p className="text-red-500 text-xs mt-1">{errors.subCategoryId.message}</p>}\n                    </div>',
  '{errors.subCategoryId && <p className="text-red-500 text-xs mt-1">{errors.subCategoryId.message}</p>}\n                      </div>\n                    </div>'
);

// 10. Replace Save/Queue buttons with standard submit button
code = code.replace(
  /<div className="bg-\[#0a0a0a\] border-t border-\[#222\] p-6 flex items-center justify-between shrink-0">[\s\S]*?<\/div>/m,
  `<div className="bg-[#0a0a0a] border-t border-[#222] p-6 flex items-center justify-end shrink-0">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setOpen(false)} className="text-xs font-bold text-[#aaa] uppercase tracking-wider hover:text-white transition-colors px-4 py-3">
              Cancel
            </button>
            <button form="add-product-form" type="submit" disabled={loading} className="px-6 py-3 bg-[#d4a843] text-black hover:bg-[#b08b33] text-xs font-bold tracking-widest uppercase rounded-full transition-colors disabled:opacity-50">
              {loading ? "Receiving..." : "Receive to Inventory"}
            </button>
          </div>
        </div>`
);

fs.writeFileSync('components/Inventory/Product/ReceiveStampingForm.tsx', code);
