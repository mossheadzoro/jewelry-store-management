import { NextResponse } from "next/server";
import { evaluateCustomerTags, evaluateAllCustomers } from "../../../../../lib/services/TagRuleEngine";

// POST: Trigger tag evaluation for a customer or all customers
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { customerId, all } = body;

    if (customerId) {
      const parsedId = parseInt(customerId, 10);
      if (isNaN(parsedId)) {
        return NextResponse.json({ error: "Invalid customerId" }, { status: 400 });
      }
      await evaluateCustomerTags(parsedId);
      return NextResponse.json({ success: true, message: `Evaluated tags for customer ${parsedId}` });
    }

    if (all === true || !customerId) {
      await evaluateAllCustomers();
      return NextResponse.json({ success: true, message: "Evaluated tags for all customers" });
    }

    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  } catch (error: any) {
    console.error("Evaluate tags error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to evaluate tags" },
      { status: 500 }
    );
  }
}
