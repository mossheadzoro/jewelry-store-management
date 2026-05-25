export function calculateTotals(
  products: any[],
  discountOnMaking: number,
  additional: number,
  taxOptions: {
    taxOnMaking: boolean;
    hallmarkCharge: boolean;
    taxOnMetal: boolean;
    taxOnTotal: boolean;
  }
) {
  let totalAmount = 0;
  let makingTaxCGST = 0;
  let makingTaxSGST = 0;
  let hallmarkingCharge = 0;
  let hallmarkingCGST = 0;
  let hallmarkingSGST = 0;
  let metalTaxCGST = 0;
  let metalTaxSGST = 0;
  let totalCGST = 0;
  let totalSGST = 0;

  // base total
  products.forEach((p) => {
    totalAmount += p.price * (p.quantity || 1);
  });

  // apply discount
  totalAmount -= discountOnMaking || 0;

  // making tax
  if (taxOptions.taxOnMaking) {
    makingTaxCGST = totalAmount * 0.025;
    makingTaxSGST = totalAmount * 0.025;
  }

  // hallmark charge (fixed)
  if (taxOptions.hallmarkCharge) {
    hallmarkingCharge = 45;
    hallmarkingCGST = hallmarkingCharge * 0.025;
    hallmarkingSGST = hallmarkingCharge * 0.025;
  }

  // tax on metal
  if (taxOptions.taxOnMetal) {
    metalTaxCGST = totalAmount * 0.015;
    metalTaxSGST = totalAmount * 0.015;
  }

  // tax on total
  if (taxOptions.taxOnTotal) {
    totalCGST = totalAmount * 0.015;
    totalSGST = totalAmount * 0.015;
  }

  // grand total
  const grandTotal =
    totalAmount +
    makingTaxCGST +
    makingTaxSGST +
    hallmarkingCharge +
    hallmarkingCGST +
    hallmarkingSGST +
    metalTaxCGST +
    metalTaxSGST +
    totalCGST +
    totalSGST +
    additional;

  return {
    totalAmount,
    makingTaxCGST,
    makingTaxSGST,
    hallmarkingCharge,
    hallmarkingCGST,
    hallmarkingSGST,
    metalTaxCGST,
    metalTaxSGST,
    totalCGST,
    totalSGST,
    grandTotal,
  };
}
