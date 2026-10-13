import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { calculateFinancialSummary } from "@/lib/financials";

export async function GET() {
  try {
    await requireUser();
    const summary = await calculateFinancialSummary();
    return NextResponse.json({ success: true, summary });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    console.error("Summary error:", error);
    return NextResponse.json({ error: "Failed to calculate financial summary" }, { status: 500 });
  }
}
