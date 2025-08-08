"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Info } from "lucide-react";
import React, { useState } from "react";

const BillingPage = () => {
  const [products, setProducts] = useState([
    {
      id: "P001",
      name: "Gold Ring",
      weight: 10,
      metalRate: 6500,
      makingChargePercent: 10,
    },
    {
      id: "P002",
      name: "Gold Chain",
      weight: 20,
      metalRate: 6500,
      makingChargePercent: 12,
    },
  ]);

  // Checkbox state
  const [taxOnTotal, setTaxOnTotal] = useState(false);
  const [hallmarkCharge, setHallmarkCharge] = useState(false);
  const [taxOnMetal, setTaxOnMetal] = useState(false);
  const [taxOnMaking, setTaxOnMaking] = useState(false);
  const [discountOnMaking, setDiscountOnMaking] = useState(0);

  const weight = (product: { weight: number }) => product.weight;

  const calculateMetalValue = (product: {
    weight: number;
    metalRate: number;
  }) => product.weight * product.metalRate;


   const originalMaking=(product:{weight:number,metalRate:number,makingChargePercent:number}) =>
      calculateMetalValue(product) * (product.makingChargePercent / 100);

  const calculateMakingCharge = (product: {
    weight: number;
    metalRate: number;
    makingChargePercent: number;
  }) => {
    const original =
      calculateMetalValue(product) * (product.makingChargePercent / 100);
    const discounted = original - original * (discountOnMaking / 100);
    return discounted;
  };

  const calculateTotal = (product: {
    weight: number;
    metalRate: number;
    makingChargePercent: number;
  }) => calculateMetalValue(product) + calculateMakingCharge(product);

  const totalMetalAmount = products.reduce(
    (acc, item) => acc + calculateMetalValue(item),
    0
  );
  const totalOriginalMaking=products.reduce((acc,item)=>acc+originalMaking(item),0);

  const totalMakingAmount = products.reduce(
    (acc, item) => acc + calculateMakingCharge(item),
    0
  );
  const totalWeight = products.reduce((acc, item) => acc + weight(item), 0);

  const totalAmount = products.reduce(
    (acc, item) => acc + calculateTotal(item),
    0
  );

  // Dynamic tax calculations
  const hallmarkingCharge = hallmarkCharge ? 500 : 0;
  const hallmarkingCGST = hallmarkCharge ? hallmarkingCharge * 0.09 : 0;
  const hallmarkingSGST = hallmarkCharge ? hallmarkingCharge * 0.09 : 0;

  const metalTaxCGST = taxOnMetal ? totalMetalAmount * 0.015 : 0;
  const metalTaxSGST = taxOnMetal ? totalMetalAmount * 0.015 : 0;

  const makingTaxCGST = taxOnMaking ? totalMakingAmount * 0.025 : 0;
  const makingTaxSGST = taxOnMaking ? totalMakingAmount * 0.025 : 0;

  const totalCGST = taxOnTotal ? totalAmount * 0.015 : 0;
  const totalSGST = taxOnTotal ? totalAmount * 0.015 : 0;

  const grandTotal =
    totalAmount +
    hallmarkingCharge +
    hallmarkingCGST +
    hallmarkingSGST +
    metalTaxCGST +
    metalTaxSGST +
    makingTaxCGST +
    makingTaxSGST +
    totalCGST +
    totalSGST;

  return (
    <div className="flex flex-row gap-[200px]">
      {/* Left Section */}
      <div className="py-2 mt-5 flex flex-col gap-10 ml-[80px]">
        <h1 className="text-4xl">New Order</h1>

        {/* Inputs */}
        <div className="py-2">
          <Label>Product ID</Label>
          <Input
            className="border-gray-500 rounded-lg w-full h-10 bg-gray-800 mt-4"
            placeholder="Enter Barcode ID or Product ID"
          />
        </div>

        <div className="flex flex-row gap-4">
          <div className="flex-row text-center">
            <Label className="px-8 py-2">Gold Rate:</Label>
            <Input className="border-gray-500 rounded-lg w-full h-10 bg-gray-800" />
          </div>
          <div className="flex-row text-center">
            <Label className="px-8 py-2">Making Charge Rate:</Label>
            <Input className="border-gray-500 rounded-lg w-full h-10 bg-gray-800" />
          </div>
          <div className="flex-row text-center">
            <Label className="px-8 py-2">Additional Charge:</Label>
            <Input className="border-gray-500 rounded-lg w-full h-10 bg-gray-800" />
          </div>
          <div className="flex-row text-center">
            <Label className="px-8 py-2">Discount :</Label>
            <Input
              className="border-gray-500 rounded-lg w-full h-10 bg-gray-800"
              
              value={discountOnMaking}
              onChange={(e) => setDiscountOnMaking(Number(e.target.value))}
            />
          </div>
        </div>

        {/* Checkboxes */}
        <div className="flex flex-row gap-5 items-center">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="tax-total"
              checked={taxOnTotal}
              onCheckedChange={(checked) => setTaxOnTotal(checked === true)}
            />
            <label htmlFor="tax-total" className="text-white text-lg">
              Tax on Total Amount
            </label>
            <Popover>
              <PopoverTrigger>
                <Info className="w-5" />
              </PopoverTrigger>
              <PopoverContent>
                GST will be applied only on Total Amount (Metal value + Making
                Charge)
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="hallmark-charge"
              checked={hallmarkCharge}
              onCheckedChange={(checked) => setHallmarkCharge(checked === true)}
            />
            <label htmlFor="hallmark-charge" className="text-white text-lg">
              Hallmarking Charges
            </label>
            <Popover>
              <PopoverTrigger>
                <Info className="w-5" />
              </PopoverTrigger>
              <PopoverContent>
                Hallmark Charges will be applied on the invoice
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="tax-gold"
              checked={taxOnMetal}
              onCheckedChange={(checked) => setTaxOnMetal(checked === true)}
            />
            <label htmlFor="tax-gold" className="text-white text-lg">
              Tax on Metal
            </label>
            <Popover>
              <PopoverTrigger>
                <Info className="w-5" />
              </PopoverTrigger>
              <PopoverContent>
                GST will be applied only on Metal (Gold value + 3%)
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="tax-making"
              checked={taxOnMaking}
              onCheckedChange={(checked) => setTaxOnMaking(checked === true)}
            />
            <label htmlFor="tax-making" className="text-white text-lg">
              Tax on Making Charge
            </label>
            <Popover>
              <PopoverTrigger>
                <Info className="w-5" />
              </PopoverTrigger>
              <PopoverContent>
                GST will be applied only on Making Charges (Making Charge + 5%)
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Product Table */}
        <div className="mt-2">
          <Table className="border-separate border-spacing-y-2 w-full">
            <TableHeader>
              <TableRow className="bg-gray-800 text-white border border-gray-700">
                <TableHead className="border border-gray-700 px-4 py-2">
                  Product ID
                </TableHead>
                <TableHead className="border border-gray-700 px-4 py-2">
                  Name
                </TableHead>
                <TableHead className="border border-gray-700 px-4 py-2">
                  Weight (g)
                </TableHead>
                <TableHead className="border border-gray-700 px-4 py-2">
                  Rate (₹/g)
                </TableHead>
                <TableHead className="border border-gray-700 px-4 py-2">
                  Metal Value (₹)
                </TableHead>
                <TableHead className="border border-gray-700 px-4 py-2">
                  Making Charge (₹)
                </TableHead>
                <TableHead className="border border-gray-700 px-4 py-2">
                  Making Charge Discount({discountOnMaking}%)
                </TableHead>
                <TableHead className="border border-gray-700 px-4 py-2">
                  Total (₹)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product, idx) => (
                <TableRow
                  key={idx}
                  className="odd:bg-gray-900 border border-gray-700"
                >
                  <TableCell className="border border-gray-700 px-4 py-2">
                    {product.id}
                  </TableCell>
                  <TableCell className="border border-gray-700 px-4 py-2">
                    {product.name}
                  </TableCell>
                  <TableCell className="border border-gray-700 px-4 py-2">
                    {product.weight}
                  </TableCell>
                  <TableCell className="border border-gray-700 px-4 py-2">
                    {product.metalRate}
                  </TableCell>
                  <TableCell className="border border-gray-700 px-4 py-2">
                    {calculateMetalValue(product).toFixed(2)}
                  </TableCell>
                  <TableCell className="border border-gray-700 px-4 py-2">
                    {originalMaking(product).toFixed(2)}
                  </TableCell>
                  <TableCell className="border border-gray-700 px-4 py-2">
                    {calculateMakingCharge(product).toFixed(2)}{" "}
                    {/* This is already discounted now */}
                  </TableCell>

                  <TableCell className="border border-gray-700 px-4 py-2">
                    {calculateTotal(product).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}

              {/* Total Row */}
              <TableRow className="bg-gray-800 text-white font-bold border border-gray-700">
                <TableCell
                  className="border border-gray-700 px-4 py-2"
                  colSpan={2}
                >
                  Total
                </TableCell>
                <TableCell className="border border-gray-700 px-4 py-2">
                  {totalWeight.toFixed(2)}
                </TableCell>
                <TableCell className="border border-gray-700 px-4 py-2">
                  -
                </TableCell>
                <TableCell className="border border-gray-700 px-4 py-2">
                  ₹{totalMetalAmount.toFixed(2)}
                </TableCell>
                <TableCell className="border border-gray-700 px-4 py-2">
                  ₹{totalOriginalMaking.toFixed(2)}
                </TableCell>
                <TableCell className="border border-gray-700 px-4 py-2">
                  ₹{totalMakingAmount.toFixed(2)}
                </TableCell>
                <TableCell className="border border-gray-700 px-4 py-2">
                  ₹{totalAmount.toFixed(2)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Right Section - Billing Details */}
      <div className="flex flex-col py-2 px-4 justify-start items-start mt-4">
        <h2 className="py-2 text-3xl font-semibold">Billing Details:</h2>
        <Label className="py-4 text-xl">Customer Name</Label>
        <Input className="border-gray-500 rounded-lg w-full h-10 bg-gray-800" />
        <Label className="py-4 text-xl">Address</Label>
        <Input className="border-gray-500 rounded-lg w-full h-10 bg-gray-800" />
        <Label className="py-4 text-xl">Mobile Number</Label>
        <Input className="border-gray-500 rounded-lg w-full h-10 bg-gray-800" />

        <div className="mt-6">
  <table className="w-full border-collapse border border-gray-700 text-white text-sm">
    <thead>
      <tr className="bg-gray-800 text-white">
        <th className="border border-gray-700 px-3 py-2 text-left">Label</th>
        <th className="border border-gray-700 px-3 py-2 text-left">Amount (₹)</th>
      </tr>
    </thead>
    <tbody>
      <tr className="odd:bg-gray-900">
        <td className="border border-gray-700 px-3 py-2">All Total</td>
        <td className="border border-gray-700 px-3 py-2">{totalAmount.toFixed(2)}</td>
      </tr>

      {taxOnMaking && (
        <>
          <tr className="odd:bg-gray-900">
            <td className="border border-gray-700 px-3 py-2">Making Charge Tax CGST (2.5%)</td>
            <td className="border border-gray-700 px-3 py-2">{makingTaxCGST.toFixed(2)}</td>
          </tr>
          <tr className="odd:bg-gray-900">
            <td className="border border-gray-700 px-3 py-2">Making Charge Tax SGST (2.5%)</td>
            <td className="border border-gray-700 px-3 py-2">{makingTaxSGST.toFixed(2)}</td>
          </tr>
        </>
      )}

      {hallmarkCharge && (
        <>
          <tr className="odd:bg-gray-900">
            <td className="border border-gray-700 px-3 py-2">Hallmarking Charge</td>
            <td className="border border-gray-700 px-3 py-2">{hallmarkingCharge.toFixed(2)}</td>
          </tr>
          <tr className="odd:bg-gray-900">
            <td className="border border-gray-700 px-3 py-2">Hallmarking CGST (9%)</td>
            <td className="border border-gray-700 px-3 py-2">{hallmarkingCGST.toFixed(2)}</td>
          </tr>
          <tr className="odd:bg-gray-900">
            <td className="border border-gray-700 px-3 py-2">Hallmarking SGST (9%)</td>
            <td className="border border-gray-700 px-3 py-2">{hallmarkingSGST.toFixed(2)}</td>
          </tr>
        </>
      )}

      {taxOnMetal && (
        <>
          <tr className="odd:bg-gray-900">
            <td className="border border-gray-700 px-3 py-2">CGST (1.5%) on Metal</td>
            <td className="border border-gray-700 px-3 py-2">{metalTaxCGST.toFixed(2)}</td>
          </tr>
          <tr className="odd:bg-gray-900">
            <td className="border border-gray-700 px-3 py-2">SGST (1.5%) on Metal</td>
            <td className="border border-gray-700 px-3 py-2">{metalTaxSGST.toFixed(2)}</td>
          </tr>
        </>
      )}

      {taxOnTotal && (
        <>
          <tr className="odd:bg-gray-900">
            <td className="border border-gray-700 px-3 py-2">CGST (1.5%) on Total</td>
            <td className="border border-gray-700 px-3 py-2">{totalCGST.toFixed(2)}</td>
          </tr>
          <tr className="odd:bg-gray-900">
            <td className="border border-gray-700 px-3 py-2">SGST (1.5%) on Total</td>
            <td className="border border-gray-700 px-3 py-2">{totalSGST.toFixed(2)}</td>
          </tr>
        </>
      )}

      <tr className="bg-gray-800 font-bold text-lg">
        <td className="border border-gray-700 px-3 py-2">Grand Total</td>
        <td className="border border-gray-700 px-3 py-2">₹{grandTotal.toFixed(2)}</td>
      </tr>
    </tbody>
  </table>
</div>

      </div>
    </div>
  );
};

export default BillingPage;
