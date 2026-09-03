// scratch/test-return-engine.ts
// Automated Verification Script for Enterprise Return & Exchange Engine

import { ReturnNumberingService } from "../src/lib/services/returns/ReturnNumberingService";
import { ReturnCalculationService } from "../src/lib/services/returns/ReturnCalculationService";
import { ReturnEligibilityService } from "../src/lib/services/returns/ReturnEligibilityService";

async function runTests() {
  console.log("==================================================");
  console.log("RUNNING MOUAL ERP RETURN & EXCHANGE ENGINE TESTS");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      failed++;
    }
  }

  // TEST 1: Financial Year & Sequence Formatting
  try {
    const testDate = new Date("2026-08-27T10:00:00Z");
    const fy = ReturnNumberingService.getFinancialYear(testDate);
    assert(fy === "26-27", `FY string calculation for Aug 2026 should be '26-27' (got '${fy}')`);

    const janDate = new Date("2027-02-15T10:00:00Z");
    const janFy = ReturnNumberingService.getFinancialYear(janDate);
    assert(janFy === "26-27", `FY string calculation for Feb 2027 should still be '26-27' (got '${janFy}')`);
  } catch (err: any) {
    console.error("Test 1 error:", err);
    failed++;
  }

  // TEST 2: Financial Calculation Engine & Proportional Tax Reversal
  try {
    const calcInput = [
      {
        invoiceItemId: 101,
        originalValues: {
          metalValue: 100000,
          makingAmount: 10000,
          stoneCharge: 5000,
          discountOnMaking: 1000,
          totalBeforeTax: 114000,
          cgst: 1710, // 1.5%
          sgst: 1710, // 1.5%
          totalAfterTax: 117420,
          grossWeight: 15.25,
          netWeight: 14.5,
          purity: 22,
        },
        policyDeductions: {
          makingChargePolicy: "FULL" as const,
          damageDeductionAmount: 0,
        },
      },
    ];

    const result = ReturnCalculationService.calculateReturn(
      calcInput,
      [{ method: "UPI", amount: 117420 }],
      117420
    );

    assert(result.summary.totalTaxableReversal === 114000, "Taxable reversal matches original taxable (114000)");
    assert(result.summary.totalCgstReversal === 1710, "CGST reversal matches original (1710)");
    assert(result.summary.totalSgstReversal === 1710, "SGST reversal matches original (1710)");
    assert(result.summary.creditNoteTotalAmount === 117420, "Credit Note amount matches totalAfterTax (117420)");
    assert(result.summary.netRefundPayable === 117420, "Net refund payable equals 117420 when no deductions applied");
    assert(result.recommendedRefundAllocation[0].method === "UPI", "Recommended refund method allocates to original UPI");
  } catch (err: any) {
    console.error("Test 2 error:", err);
    failed++;
  }

  // TEST 3: Commercial Deductions & Damage Handling
  try {
    const calcInputWithDeductions = [
      {
        invoiceItemId: 102,
        originalValues: {
          metalValue: 50000,
          makingAmount: 6000,
          stoneCharge: 2000,
          discountOnMaking: 0,
          totalBeforeTax: 58000,
          cgst: 870,
          sgst: 870,
          totalAfterTax: 59740,
          grossWeight: 8.0,
          netWeight: 7.8,
        },
        policyDeductions: {
          makingChargePolicy: "NON_REFUNDABLE" as const, // Deduct full 6000 making
          damageDeductionAmount: 1500, // Deduct 1500 damage
        },
      },
    ];

    const result = ReturnCalculationService.calculateReturn(calcInputWithDeductions);

    assert(result.summary.totalCommercialDeductions === 7500, "Total commercial deductions sum to 7500 (6000 + 1500)");
    assert(result.summary.creditNoteTotalAmount === 59740, "Gross Credit Note remains statutory 59740");
    assert(result.summary.netRefundPayable === 52240, "Net refund payable is correctly reduced to 52240 (59740 - 7500)");
  } catch (err: any) {
    console.error("Test 3 error:", err);
    failed++;
  }

  // TEST 4: Calendar Elapsed Days & Boundary Policy Checks
  try {
    const baseDate = new Date("2026-08-20T10:00:00Z");
    const day2 = new Date("2026-08-22T14:00:00Z");
    const day5 = new Date("2026-08-25T14:00:00Z");
    const day10 = new Date("2026-08-30T14:00:00Z");

    const elapsedDay2 = ReturnEligibilityService.calculateElapsedDays(baseDate, day2);
    const elapsedDay5 = ReturnEligibilityService.calculateElapsedDays(baseDate, day5);
    const elapsedDay10 = ReturnEligibilityService.calculateElapsedDays(baseDate, day10);

    assert(elapsedDay2 === 2, `Day 2 elapsed days should be 2 (got ${elapsedDay2})`);
    assert(elapsedDay5 === 5, `Day 5 elapsed days should be 5 (got ${elapsedDay5})`);
    assert(elapsedDay10 === 10, `Day 10 elapsed days should be 10 (got ${elapsedDay10})`);
  } catch (err: any) {
    console.error("Test 4 error:", err);
    failed++;
  }

  // TEST 5: 2 Lac 11 Thousand Case (Zero stored item tax fallback with 3% GST)
  try {
    // Customer bought item where line totalBeforeTax was 204,854.37 and paid 2,11,000.00
    const calcInputZeroItemTax = [
      {
        invoiceItemId: 205,
        originalValues: {
          metalValue: 190000,
          makingAmount: 14854.37,
          stoneCharge: 0,
          discountOnMaking: 0,
          totalBeforeTax: 204854.37,
          cgst: 0, // legacy 0
          sgst: 0, // legacy 0
          totalAfterTax: 204854.37, // legacy without item tax
          grossWeight: 25.0,
          netWeight: 24.5,
        },
      },
    ];

    const result = ReturnCalculationService.calculateReturn(
      calcInputZeroItemTax,
      [{ method: "CASH", amount: 211000 }],
      211000
    );

    assert(result.summary.totalTaxableReversal === 204854.37, "Taxable reversal is 204854.37 (2 lac 4 thousand)");
    assert(result.summary.totalCgstReversal === 3072.82, "CGST 1.5% reversal correctly calculated (3072.82)");
    assert(result.summary.totalSgstReversal === 3072.82, "SGST 1.5% reversal correctly calculated (3072.82)");
    assert(result.summary.totalTaxReversal === 6145.64, "Total GST tax money refunded is 6145.64");
    assert(result.summary.creditNoteTotalAmount === 211000.01, "Credit Note includes full tax and equals 2,11,000");
    assert(result.summary.netRefundPayable === 211000.01, "Net refund payable to customer is 2,11,000");
  } catch (err: any) {
    console.error("Test 5 error:", err);
    failed++;
  }

  console.log("==================================================");
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(console.error);
