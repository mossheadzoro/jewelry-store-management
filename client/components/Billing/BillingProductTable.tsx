"use client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2 } from "lucide-react";

const BillingProductTable = ({ products, removeProduct, onEditProduct }: any) => {
  return (
    <div className="w-full overflow-x-auto">
      <Table className="w-full min-w-[1000px]">
        <TableHeader>
          <TableRow className="bg-onyx-elevated hover:bg-onyx-elevated border-b border-onyx-border">
            {/* Keeping it simple with # for ID */}
            <TableHead className="text-[#888] font-medium py-3 px-4 font-mono w-16">#</TableHead>
            <TableHead className="text-[#888] font-medium py-3 px-4 uppercase text-xs tracking-wider">Item Details</TableHead>
            <TableHead className="text-[#888] font-medium py-3 px-4 uppercase text-xs tracking-wider text-right">Gs Wt</TableHead>
            <TableHead className="text-[#888] font-medium py-3 px-4 uppercase text-xs tracking-wider text-right">Nt Wt</TableHead>
            <TableHead className="text-[#888] font-medium py-3 px-4 uppercase text-xs tracking-wider text-right">Rate</TableHead>
            <TableHead className="text-[#888] font-medium py-3 px-4 uppercase text-xs tracking-wider text-right">Metal Val</TableHead>
            <TableHead className="text-[#888] font-medium py-3 px-4 uppercase text-xs tracking-wider text-right">Making</TableHead>
            <TableHead className="text-[#888] font-medium py-3 px-4 uppercase text-xs tracking-wider text-right">Other Charge Discount</TableHead>
            <TableHead className="text-[#888] font-medium py-3 px-4 uppercase text-xs tracking-wider text-right">Other Charges</TableHead>
            <TableHead className="text-[#d4a843] font-semibold py-3 px-4 uppercase text-xs tracking-wider text-right">Total</TableHead>
            <TableHead className="text-center w-12"></TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {products.map((p: any, idx: number) => {
            const metalValue = p.ntWeight * p.metalRate;
            const makingValue = (metalValue * (p.makingChargePercent ?? 0)) / 100;
            const discountedMaking = makingValue - (makingValue * (p.discountOnMaking ?? 0)) / 100;
            const otherChargeVal = p.otherChargesPrice ?? p.additionalCharge ?? 0;
            const total = metalValue + discountedMaking + otherChargeVal;

            return (
              <TableRow 
                key={idx} 
                className="hover:bg-onyx-elevated transition-colors border-b border-[#1e1e1e] group"
              >
                <TableCell className="text-[#555] font-mono text-xs py-4 px-4 align-top">
                  {p.id}
                </TableCell>

                <TableCell className="py-4 px-4 align-top">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 h-12 w-12 bg-[#2a2a2a] rounded overflow-hidden flex items-center justify-center border border-border">
                      {p.image ? (
                        <img 
                          src={p.image} 
                          alt={p.name} 
                          className="h-full w-full object-cover" 
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            if (e.currentTarget.nextElementSibling) {
                              (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block';
                            }
                          }}
                        />
                      ) : null}
                      <span 
                        className="text-[10px] text-[#888] text-center leading-tight px-1"
                        style={{ display: p.image ? 'none' : 'block' }}
                      >
                        No img found
                      </span>
                    </div>
                    <div>
                      <button
                        onClick={() => onEditProduct?.(p, idx)}
                        className="text-[#e8e8e8] font-medium text-left hover:text-[#d4a843] transition-colors focus:outline-none block"
                        aria-label={`Edit ${p.name}`}
                        type="button"
                      >
                        {p.name}
                      </button>
                      <p className="text-[#666] text-xs mt-1">Barcode: {p.barcode}</p>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="text-[#aaa] text-right py-4 px-4 align-top tabular-nums">
                  {p.gsWeight.toFixed(3)}g
                </TableCell>
                
                <TableCell className="text-[#e8e8e8] text-right py-4 px-4 align-top tabular-nums font-medium">
                  {p.ntWeight.toFixed(3)}g
                </TableCell>

                <TableCell className="text-[#aaa] text-right py-4 px-4 align-top tabular-nums">
                  ₹{p.metalRate}
                </TableCell>

                <TableCell className="text-[#aaa] text-right py-4 px-4 align-top tabular-nums">
                  ₹{metalValue.toFixed(2)}
                </TableCell>

                <TableCell className="text-right py-4 px-4 align-top tabular-nums">
                  <span className="block text-[#e8e8e8]">₹{makingValue.toFixed(2)}</span>
                  <span className="block text-[#666] text-[10px] mt-0.5">@{p.makingChargePercent ?? 0}%</span>
                </TableCell>

                <TableCell className="text-right py-4 px-4 align-top tabular-nums">
                  <span className="block text-[#aaa]">₹{discountedMaking.toFixed(2)}</span>
                  <span className="block text-[#666] text-[10px] mt-0.5">-{p.discountOnMaking ?? 0}%</span>
                </TableCell>

                <TableCell className="text-[#aaa] text-right py-4 px-4 align-top tabular-nums">
                  ₹{otherChargeVal.toFixed(2)}
                </TableCell>

                <TableCell className="text-right py-4 px-4 align-top tabular-nums">
                  <span className="font-bold text-[#d4a843] text-base bg-[#1a1508] px-2 py-1 rounded border border-[#d4a843]/20">
                    ₹{total.toFixed(2)}
                  </span>
                </TableCell>

                <TableCell className="py-4 px-2 align-top text-center">
                  <button 
                    onClick={() => removeProduct(idx)}
                    className="p-2 text-[#555] hover:text-[#ff4a4a] hover:bg-[#ff4a4a]/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default BillingProductTable;
