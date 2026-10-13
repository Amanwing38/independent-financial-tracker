import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { calculateFinancialSummary } from "@/lib/financials";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get("timeframe") || "daily"; // "daily" | "monthly" | "yearly"
    const format = searchParams.get("format"); // "json" | "csv"

    const summary = await calculateFinancialSummary();

    // Fetch all transactions with staff details
    const transactions = await prisma.transaction.findMany({
      include: {
        recordedBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Grouping by date period
    const periodsMap = new Map<
      string,
      {
        period: string;
        cashIncome: number;
        bankIncome: number;
        transfersOutCash: number;
        transfersInBank: number;
        totalApplicantIncome: number;
        transactionCount: number;
      }
    >();

    // Staff breakdown
    const staffMap = new Map<
      string,
      {
        staffId: string;
        staffName: string;
        cashCount: number;
        cashAmount: number;
        bankCount: number;
        bankAmount: number;
        totalCollected: number;
      }
    >();

    for (const txn of transactions) {
      const date = new Date(txn.createdAt);
      let periodKey = date.toISOString().slice(0, 10); // YYYY-MM-DD
      if (timeframe === "monthly") {
        periodKey = date.toISOString().slice(0, 7); // YYYY-MM
      } else if (timeframe === "yearly") {
        periodKey = date.toISOString().slice(0, 4); // YYYY
      }

      if (!periodsMap.has(periodKey)) {
        periodsMap.set(periodKey, {
          period: periodKey,
          cashIncome: 0,
          bankIncome: 0,
          transfersOutCash: 0,
          transfersInBank: 0,
          totalApplicantIncome: 0,
          transactionCount: 0,
        });
      }

      const p = periodsMap.get(periodKey)!;
      p.transactionCount++;

      if (txn.type === "PAYMENT") {
        if (txn.destination === "CASH") {
          p.cashIncome += txn.amount;
        } else if (txn.destination === "BANK") {
          p.bankIncome += txn.amount;
        }
        p.totalApplicantIncome += txn.amount;
      } else if (txn.type === "TRANSFER_OUT" && txn.destination === "CASH") {
        p.transfersOutCash += txn.amount;
      } else if (txn.type === "TRANSFER_IN" && txn.destination === "BANK") {
        p.transfersInBank += txn.amount;
      }

      // Staff metrics (only payment collections)
      if (txn.type === "PAYMENT") {
        const staffKey = txn.recordedById;
        if (!staffMap.has(staffKey)) {
          staffMap.set(staffKey, {
            staffId: txn.recordedById,
            staffName: txn.recordedBy?.name || "Unknown",
            cashCount: 0,
            cashAmount: 0,
            bankCount: 0,
            bankAmount: 0,
            totalCollected: 0,
          });
        }
        const s = staffMap.get(staffKey)!;
        if (txn.destination === "CASH") {
          s.cashCount++;
          s.cashAmount += txn.amount;
        } else {
          s.bankCount++;
          s.bankAmount += txn.amount;
        }
        s.totalCollected += txn.amount;
      }
    }

    const periodBreakdown = Array.from(periodsMap.values());
    const staffBreakdown = Array.from(staffMap.values());

    if (format === "csv") {
      // Return CSV download
      const headers = [
        "Transaction ID",
        "Receipt #",
        "Type",
        "Destination",
        "Amount (ETB)",
        "Applicant Reference",
        "Description",
        "Deposit Ref",
        "Recorded By",
        "Status",
        "Date & Time",
      ];

      const csvRows = [headers.join(",")];
      for (const t of transactions) {
        const row = [
          t.id,
          t.receiptNumber,
          t.type,
          t.destination,
          t.amount,
          `"${(t.applicantRef || "").replace(/"/g, '""')}"`,
          `"${(t.description || "").replace(/"/g, '""')}"`,
          `"${(t.depositReference || "").replace(/"/g, '""')}"`,
          `"${(t.recordedBy?.name || "").replace(/"/g, '""')}"`,
          t.verificationStatus,
          new Date(t.createdAt).toISOString(),
        ];
        csvRows.push(row.join(","));
      }

      return new Response(csvRows.join("\n"), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="financial_report_${timeframe}_${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      timeframe,
      summary,
      periodBreakdown,
      staffBreakdown,
      transactionsCount: transactions.length,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    console.error("Reports error:", error);
    return NextResponse.json({ error: "Failed to generate reports" }, { status: 500 });
  }
}
