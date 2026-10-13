import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import {
  generateTransferId,
  generateTransactionId,
  generateReceiptNumber,
  calculateFinancialSummary,
} from "@/lib/financials";

export async function GET() {
  try {
    await requireUser();
    const transfers = await prisma.internalTransfer.findMany({
      include: {
        authorizedBy: {
          select: { id: true, name: true, email: true, role: true },
        },
        transactions: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, transfers });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch transfers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const { amount, bankReference, notes } = await request.json();

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        { error: "Transfer amount must be a positive number greater than 0" },
        { status: 400 }
      );
    }

    if (!bankReference || typeof bankReference !== "string" || bankReference.trim().length < 3) {
      return NextResponse.json(
        { error: "A valid bank deposit reference or slip number is required (min 3 characters)" },
        { status: 400 }
      );
    }

    // Verify sufficient cash on hand before allowing cash-to-bank transfer
    const summary = await calculateFinancialSummary();
    if (numericAmount > summary.currentCashBalance) {
      return NextResponse.json(
        {
          error: `Insufficient cash in register. Current cash balance is ${summary.currency} ${summary.currentCashBalance.toLocaleString()}, but transfer requested is ${summary.currency} ${numericAmount.toLocaleString()}.`,
        },
        { status: 400 }
      );
    }

    const transferId = await generateTransferId();
    const cashTxnId = await generateTransactionId("CASH");
    const bankTxnId = await generateTransactionId("BANK");
    const cashReceipt = await generateReceiptNumber();
    const bankReceipt = `RCP-BNK-${bankTxnId.split("-").slice(2).join("-")}`;

    // Execute atomically inside Prisma transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create InternalTransfer record
      const transfer = await tx.internalTransfer.create({
        data: {
          id: transferId,
          amount: numericAmount,
          bankReference: bankReference.trim(),
          notes: notes ? notes.trim() : "Cash deposited to bank account",
          authorizedById: user.id,
        },
      });

      // 2. Cash side: TRANSFER_OUT from CASH
      const cashTxn = await tx.transaction.create({
        data: {
          id: cashTxnId,
          receiptNumber: cashReceipt,
          type: "TRANSFER_OUT",
          destination: "CASH",
          amount: numericAmount,
          applicantRef: "INTERNAL CASH TRANSFER [DEMO DATA]",
          description: `Internal transfer: Cash deposited to bank (Deposit Slip: ${bankReference.trim()})`,
          recordedById: user.id,
          verificationStatus: "VERIFIED",
          internalTransferId: transfer.id,
        },
      });

      // 3. Bank side: TRANSFER_IN to BANK
      const bankTxn = await tx.transaction.create({
        data: {
          id: bankTxnId,
          receiptNumber: bankReceipt,
          type: "TRANSFER_IN",
          destination: "BANK",
          amount: numericAmount,
          applicantRef: "INTERNAL BANK DEPOSIT [DEMO DATA]",
          description: `Internal transfer: Cash deposit credited (Deposit Slip: ${bankReference.trim()})`,
          depositReference: bankReference.trim(),
          recordedById: user.id,
          verificationStatus: "VERIFIED",
          internalTransferId: transfer.id,
        },
      });

      return { transfer, cashTxn, bankTxn };
    });

    // Write immutable audit log
    await logAudit({
      action: "INTERNAL_TRANSFER",
      entityType: "TRANSFER",
      entityId: result.transfer.id,
      performedById: user.id,
      performedByName: user.name,
      performedByRole: user.role,
      details: {
        transferId: result.transfer.id,
        amount: numericAmount,
        bankReference: bankReference.trim(),
        cashTxnId: result.cashTxn.id,
        bankTxnId: result.bankTxn.id,
        notes: notes || "",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Internal transfer executed successfully. Cash balance decreased and Bank balance increased by the exact same amount.",
        transfer: result.transfer,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    console.error("Internal transfer error:", error);
    return NextResponse.json({ error: "Failed to process internal transfer" }, { status: 500 });
  }
}
