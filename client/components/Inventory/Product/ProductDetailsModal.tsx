import React, { useState, useEffect } from "react";
import { X, ZoomIn, RotateCcw, FileText, History, Gem, Printer, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface ProductDetailsModalProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
}

export function ProductDetailsModal({ product: initialProduct, isOpen, onClose, onEdit }: ProductDetailsModalProps) {
  const [product, setProduct] = useState<any>(initialProduct);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && initialProduct?.id) {
      setLoading(true);
      fetch(`/api/inventory/product/fetchById/${initialProduct.id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && !data.error) {
            setProduct(data);
          } else {
            setProduct(initialProduct);
          }
        })
        .catch((err) => {
          console.error(err);
          setProduct(initialProduct);
        })
        .finally(() => setLoading(false));
    } else {
      setProduct(initialProduct);
    }
  }, [isOpen, initialProduct]);

  if (!product) return null;

  const handlePrintCertificate = () => {
    // Print logic for certificate
    window.print();
  };

  const isSoldOff = (product.quantity ?? 0) <= 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] sm:max-w-6xl p-0 bg-onyx border-border text-foreground gap-0 overflow-hidden rounded-2xl h-[90vh] flex flex-col">
        <DialogTitle className="sr-only">Product Details - {product.name}</DialogTitle>
        <DialogDescription className="sr-only">Detailed view of the selected product including technical specs and stone composition.</DialogDescription>
        
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-border/50">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-3xl font-bold text-foreground/90">{product.name}</h2>
              {isSoldOff ? (
                <span className="px-3 py-1 rounded-md border-2 border-red-500 bg-red-950/20 text-red-500 font-extrabold uppercase text-xs tracking-wider">
                  SOLD OFF
                </span>
              ) : (
                <span className="px-3 py-1 rounded-md border-2 border-emerald-500 bg-emerald-950/20 text-emerald-500 font-extrabold uppercase text-xs tracking-wider">
                  IN STOCK
                </span>
              )}
            </div>
            <p className="text-muted-foreground text-sm">
              SKU: {product.productCode} • Created on Feb 12, 2024
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrintCertificate}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-border hover:bg-secondary transition-colors text-sm font-medium"
            >
              <Printer size={16} /> Print Certificate
            </button>
            <button
              onClick={onEdit}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#d4a843] hover:bg-[#c29a3a] text-foreground transition-colors text-sm font-medium"
            >
              <Edit size={16} /> Edit Product
            </button>
            <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors ml-2">
              <X size={20} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
          <div className="grid grid-cols-12 gap-6">
            
            {/* Main Image Section */}
            <div className="col-span-12 lg:col-span-8 space-y-6">
              <div className="relative rounded-2xl overflow-hidden bg-onyx-surface border border-border/50 aspect-video lg:aspect-auto lg:h-[500px] flex items-center justify-center">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-gray-600">No Image Available</span>
                )}
                
                <div className="absolute top-4 right-4 bg-background/60 border border-[#d4a843] text-[#d4a843] text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest backdrop-blur-sm">
                  Hallmarked
                </div>
                
                <div className="absolute bottom-4 left-4 flex gap-2">
                  <button className="w-10 h-10 rounded-full bg-background/60 backdrop-blur-sm flex items-center justify-center hover:bg-background/80 transition-colors border border-border/50">
                    <ZoomIn size={18} className="text-[#d4a843]" />
                  </button>
                  <button className="w-10 h-10 rounded-full bg-background/60 backdrop-blur-sm flex items-center justify-center hover:bg-background/80 transition-colors border border-border/50">
                    <RotateCcw size={18} className="text-[#d4a843]" />
                  </button>
                </div>
              </div>

              {/* Stone Composition */}
              <div className="bg-onyx-surface border border-border/50 rounded-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Gem className="text-[#d4a843]" size={20} /> Stone Composition
                  </h3>
                  <button className="text-[#d4a843] text-xs font-bold uppercase tracking-widest hover:text-[#f0c357] transition-colors">
                    + Add Stone
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  {product.stoneDetails && product.stoneDetails.length > 0 ? (
                    <table className="w-full text-left text-sm">
                      <thead className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border/50">
                        <tr>
                          <th className="pb-4 font-semibold">Stone Name</th>
                          <th className="pb-4 font-semibold">Carat</th>
                          <th className="pb-4 font-semibold">Clarity</th>
                          <th className="pb-4 font-semibold">Color</th>
                          <th className="pb-4 font-semibold">Cut</th>
                          <th className="pb-4 font-semibold text-right">Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800/30">
                        {product.stoneDetails.map((stone: any, idx: number) => (
                          <tr key={stone.id || idx} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-4 font-medium">{stone.name || "—"}</td>
                            <td className="py-4 text-muted-foreground">{stone.carat ? `${stone.carat} ct` : "—"}</td>
                            <td className="py-4 text-muted-foreground">{stone.clarity || "—"}</td>
                            <td className="py-4 text-muted-foreground">{stone.color || "—"}</td>
                            <td className="py-4 text-muted-foreground">{stone.cut || "—"}</td>
                            <td className="py-4 text-right font-semibold text-[#d4a843]">
                              {stone.price ? `$${stone.price}` : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="py-8 text-center text-muted-foreground text-sm italic">
                      No record found
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="col-span-12 lg:col-span-4 space-y-6 flex flex-col">
              
              {/* Technical Specs */}
              <div className="bg-onyx-surface border border-border/50 rounded-2xl p-6 flex-1">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-6">
                  <FileText className="text-[#d4a843]" size={20} /> Technical Specs
                </h3>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-border/30">
                    <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Metal Type</span>
                    <span className="font-semibold text-foreground/90">
                      {product.category?.name || product.subCategory?.category?.name || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/30">
                    <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Gross Weight</span>
                    <span className="font-semibold text-foreground/90">{product.gsWeight ? `${product.gsWeight}g` : "—"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/30">
                    <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Net Weight</span>
                    <span className="font-semibold text-foreground/90">{product.ntWeight ? `${product.ntWeight}g` : "—"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/30">
                    <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Purity</span>
                    <span className="font-semibold text-foreground/90">{product.purity || "—"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/30">
                    <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Size</span>
                    <span className="font-semibold text-foreground/90">{product.size || "—"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/30">
                    <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">HUID</span>
                    <span className="font-semibold text-foreground/90">{product.huidNumber || "—"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/30">
                    <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Quantity</span>
                    <span className="font-semibold text-foreground/90">{product.quantity ?? "—"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/30">
                    <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">Branch</span>
                    <span className="font-semibold text-foreground/90">{product.branch?.name || "—"}</span>
                  </div>
                </div>
              </div>

              {/* Audit Trail */}
              <div className="bg-onyx-surface border border-border/50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-6">
                  <History className="text-[#d4a843]" size={20} /> Audit Trail
                </h3>
                
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-800 before:to-transparent">
                  
                  {/* Timeline Item 1 */}
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-border bg-onyx-surface group-[.is-active]:border-[#d4a843] text-muted-foreground group-[.is-active]:text-[#d4a843] shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 absolute left-0 md:left-1/2 -ml-2.5 md:ml-0">
                      <div className="w-2 h-2 bg-[#d4a843] rounded-full"></div>
                    </div>
                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] ml-8 md:ml-0">
                      <div className="flex flex-col">
                        <time className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Today, 10:45 AM</time>
                        <h4 className="text-sm font-semibold text-foreground/90">Appraisal Renewed</h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5">By Senior Appraiser: Marcus V.</p>
                      </div>
                    </div>
                  </div>

                  {/* Timeline Item 2 */}
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-border bg-onyx-surface text-muted-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 absolute left-0 md:left-1/2 -ml-2.5 md:ml-0">
                    </div>
                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] ml-8 md:ml-0">
                      <div className="flex flex-col">
                        <time className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Feb 14, 2024</time>
                        <h4 className="text-sm font-semibold text-foreground/90">Location Change</h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Moved from Main Vault to Showroom B</p>
                      </div>
                    </div>
                  </div>

                  {/* Timeline Item 3 */}
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-border bg-onyx-surface text-muted-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 absolute left-0 md:left-1/2 -ml-2.5 md:ml-0">
                    </div>
                    <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] ml-8 md:ml-0">
                      <div className="flex flex-col">
                        <time className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Jan 02, 2024</time>
                        <h4 className="text-sm font-semibold text-foreground/90">New Inventory Entry</h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5">Initial registration via ERP Mobile</p>
                      </div>
                    </div>
                  </div>

                </div>
                
                <button className="w-full mt-6 py-2.5 rounded-xl bg-onyx-elevated hover:bg-secondary transition-colors text-xs font-semibold text-muted-foreground">
                  View Full Transaction History
                </button>
              </div>

            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
