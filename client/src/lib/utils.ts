import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCustomerName(customer: any): string {
  if (!customer || !customer.name) return "";
  const name = customer.name.trim();

  if (/^(Mr\.|Mrs\.|Ms\.|Miss|Dr\.|Shri|Smt\.)/i.test(name)) {
    return name;
  }

  if (customer.title) {
    const t = customer.title.trim();
    const formattedTitle = t.endsWith(".") ? t : `${t}.`;
    return `${formattedTitle} ${name}`;
  }

  const g = (customer.gender || "").toUpperCase();
  if (g === "MALE" || g === "M" || g === "MAN") {
    return `Mr. ${name}`;
  }
  if (g === "FEMALE" || g === "F" || g === "WOMAN") {
    return `Mrs. ${name}`;
  }

  return `Mr. / Mrs. ${name}`;
}

export function numberToWords(amount: number): string {
  const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  
  if (amount === 0) return "Zero";
  if (amount < 0) return "Minus " + numberToWords(Math.abs(amount));

  let words = "";

  if (Math.floor(amount / 10000000) > 0) {
    words += numberToWords(Math.floor(amount / 10000000)) + " Crore ";
    amount %= 10000000;
  }

  if (Math.floor(amount / 100000) > 0) {
    words += numberToWords(Math.floor(amount / 100000)) + " Lakh ";
    amount %= 100000;
  }

  if (Math.floor(amount / 1000) > 0) {
    words += numberToWords(Math.floor(amount / 1000)) + " Thousand ";
    amount %= 1000;
  }

  if (Math.floor(amount / 100) > 0) {
    words += numberToWords(Math.floor(amount / 100)) + " Hundred ";
    amount %= 100;
  }

  if (amount > 0) {
    if (words !== "") {
      words += "and ";
    }
    if (amount < 20) {
      words += units[Math.floor(amount)];
    } else {
      words += tens[Math.floor(amount / 10)];
      if ((amount % 10) > 0) {
        words += " " + units[Math.floor(amount % 10)];
      }
    }
  }

  return words.trim();
}

/**
 * Normalizes an invoice (whether created with old DB structure or new DB structure)
 * to ensure all item-level and invoice-level fields exist and are accurately calculated.
 */
export function normalizeInvoice(rawInvoice: any): any {
  if (!rawInvoice) return rawInvoice;

  const items = (rawInvoice.items || []).map((item: any) => {
    const ntWeight = Number(item.ntWeight || item.gsWeight || 0);
    const making = Number(item.makingAmount ?? item.makingCharge ?? 0);

    let metalRate = Number(item.metalRate || item.product?.rate || 0);
    let metalValue = Number(item.metalValue || 0);

    if (!metalValue) {
      if (metalRate > 0 && ntWeight > 0) {
        metalValue = metalRate * ntWeight;
      } else if (item.totalBeforeTax > 0) {
        metalValue = Math.max(0, item.totalBeforeTax - making);
      }
    }

    if (!metalRate && ntWeight > 0 && metalValue > 0) {
      metalRate = metalValue / ntWeight;
    }

    const subtotalWithoutDisc = metalValue + making;
    const discountPercent = Number(item.discountOnMaking || 0);
    const discountAmount = discountPercent > 0 ? (making * discountPercent) / 100 : 0;
    const netMaking = making - discountAmount;
    const discountTotalPrice = subtotalWithoutDisc - discountAmount;

    // Detect additional charge explicitly from item or product item
    let additionalCharge = Number(item.additionalCharge ?? item.stoneCharge ?? item.otherChargesPrice ?? item.product?.otherChargesPrice ?? 0);
    
    // Fallback for legacy DB records where stoneCharge was saved as 0:
    if (!additionalCharge) {
      if (item.totalBeforeTax > 0 && Math.round(item.totalBeforeTax) > Math.round(discountTotalPrice)) {
        additionalCharge = Math.round(item.totalBeforeTax) - Math.round(discountTotalPrice);
      } else if (item.totalAfterTax > 0) {
        const itemBeforeTax = Math.round(item.totalAfterTax / 1.03);
        if (itemBeforeTax > Math.round(discountTotalPrice)) {
          additionalCharge = itemBeforeTax - Math.round(discountTotalPrice);
        }
      }
    }

    const additionalChargeReason = item.additionalChargeReason || item.otherCharges || item.product?.otherCharges || item.stoneDetail || "";
    const lineTaxableTotal = discountTotalPrice + additionalCharge;

    const totalBeforeTax = lineTaxableTotal;
    const cgst = lineTaxableTotal * 0.015;
    const sgst = lineTaxableTotal * 0.015;
    const totalAfterTax = lineTaxableTotal + cgst + sgst;

    return {
      ...item,
      ntWeight,
      metalRate,
      metalValue,
      makingAmount: making,
      makingCharge: making,
      netMaking,
      additionalCharge,
      additionalChargeReason,
      stoneCharge: additionalCharge,
      discountPercent,
      discountAmount,
      subtotalWithoutDisc,
      discountTotalPrice,
      lineTaxableTotal,
      totalBeforeTax,
      cgst,
      sgst,
      totalAfterTax
    };
  });

  const computedMetalAmount = items.reduce((acc: number, it: any) => acc + (it.metalValue || 0), 0);
  const computedMakingAmount = items.reduce((acc: number, it: any) => acc + (it.makingAmount || 0), 0);
  const computedNetMakingAmount = items.reduce((acc: number, it: any) => acc + (it.netMaking || 0), 0);
  const computedAdditionalAmount = items.reduce((acc: number, it: any) => acc + (it.additionalCharge || 0), 0);
  const computedDiscountAmount = items.reduce((acc: number, it: any) => acc + (it.discountAmount || 0), 0);

  const reasonsList = items
    .map((it: any) => it.additionalChargeReason)
    .filter((r: string) => r && r.trim() !== "");
  const uniqueReasons = Array.from(new Set(reasonsList)).join(", ");

  const totalMetalAmount = (rawInvoice.totalMetalAmount !== undefined && rawInvoice.totalMetalAmount !== null) 
    ? rawInvoice.totalMetalAmount 
    : computedMetalAmount;
  const totalMakingAmount = (rawInvoice.totalMakingAmount !== undefined && rawInvoice.totalMakingAmount !== null) 
    ? rawInvoice.totalMakingAmount 
    : computedMakingAmount;
  
  const totalDiscountAmount = computedDiscountAmount;
  const totalNetMakingAmount = computedNetMakingAmount;

  const rawTotal = totalMetalAmount + totalMakingAmount;
  const totalBeforeAdditional = totalMetalAmount + totalNetMakingAmount; // Metal Value + Net Making Charge (e.g. ₹70,000 + ₹9,800 = ₹79,800)

  let totalAdditionalAmount = (rawInvoice.totalStoneAmount !== undefined && rawInvoice.totalStoneAmount !== null)
    ? rawInvoice.totalStoneAmount
    : computedAdditionalAmount;

  // Invoice-level fallback for legacy DB records where totalStoneAmount was stored as 0
  // Note: Modern invoices have distinct taxOnGold and taxOnMaking. Legacy invoices only had cgst/sgst based on flat 3%
  if (!totalAdditionalAmount && rawInvoice.totalAmount > 0 && totalBeforeAdditional > 0) {
    // Only apply legacy fallback if there is no specific making/gold tax recorded
    if (!rawInvoice.taxOnMaking && !rawInvoice.taxOnGold) {
      const hallmarkFee = rawInvoice.hallmarkingCharge || 0;
      const hallmarkTax = rawInvoice.taxOnHallmarking || 0;
      const netTaxableFromTotal = Math.round((rawInvoice.totalAmount - hallmarkFee - hallmarkTax) / 1.03);
      if (netTaxableFromTotal > Math.round(totalBeforeAdditional)) {
        totalAdditionalAmount = netTaxableFromTotal - Math.round(totalBeforeAdditional);
      }
    }
  }

  const netTaxable = totalBeforeAdditional + totalAdditionalAmount; // ₹79,800 + ₹400 = ₹80,200

  const cgst = (rawInvoice.cgst !== undefined && rawInvoice.cgst !== null) ? rawInvoice.cgst : (netTaxable * 0.015);
  const sgst = (rawInvoice.sgst !== undefined && rawInvoice.sgst !== null) ? rawInvoice.sgst : (netTaxable * 0.015);

  const hallmarkingCharge = rawInvoice.hallmarkingCharge || 0;
  const taxOnHallmarking = rawInvoice.taxOnHallmarking || (hallmarkingCharge > 0 ? hallmarkingCharge * 0.18 : 0);

  const totalAmount = (rawInvoice.totalAmount !== undefined && rawInvoice.totalAmount !== null && rawInvoice.totalAmount > 0) 
    ? rawInvoice.totalAmount 
    : (netTaxable + cgst + sgst + hallmarkingCharge + taxOnHallmarking);

  return {
    ...rawInvoice,
    items,
    totalMetalAmount,
    totalMakingAmount,
    totalNetMakingAmount,
    totalStoneAmount: totalAdditionalAmount,
    totalAdditionalAmount,
    additionalChargeReason: uniqueReasons,
    totalDiscountAmount,
    rawTotal,
    totalBeforeAdditional,
    discountTotalPrice: totalBeforeAdditional,
    netTaxable,
    cgst,
    sgst,
    totalAmount
  };
}
