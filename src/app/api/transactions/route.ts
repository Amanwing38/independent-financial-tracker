import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { generateTransactionId, generateReceiptNumber } from "@/lib/financials";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);

    const destination = searchParams.get("destination"); // "CASH" | "BANK"
    const status = searchParams.get("status"); // "PENDING" | "VERIFIED" | "FLAGGED_DISCREPANCY"
    const type = searchParams.get("type"); // "PAYMENT" | "TRANSFER_OUT" | "TRANSFER_IN"
    const search = searchParams.get("search");
    const staffId = searchParams.get("staffId");

    const whereClause: Record<string, unknown> = {};

    if (destination) {
      whereClause.destination = destination;
    }

    if (status) {
      whereClause.verificationStatus = status;
    }

    if (type) {
      whereClause.type = type;
    }

    if (staffId) {
      whereClause.recordedById = staffId;
    }

    if (search) {
      whereClause.OR = [
        { id: { contains: search } },
        { receiptNumber: { contains: search } },
        { applicantRef: { contains: search } },
        { description: { contains: search } },
        { depositReference: { contains: search } },
      ];
    }

    // Fetch transactions with recorder and verification details
    const transactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        recordedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        verificationSession: {
          select: {
            id: true,
            verifiedAmount: true,
            status: true,
            createdAt: true,
            verifiedBy: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    });

    return NextResponse.json({ success: true, transactions, userRole: user.role });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    console.error("Fetch transactions error:", error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();

    const { destination, amount, applicantRef, description, depositReference } = body;

    // Strict Server-Side Validations
    if (!destination || (destination !== "CASH" && destination !== "BANK")) {
      return NextResponse.json(
        { error: "Payment destination must be either CASH or BANK" },
        { status: 400 }
      );
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a valid positive number greater than 0" },
        { status: 400 }
      );
    }

    if (!applicantRef || typeof applicantRef !== "string" || applicantRef.trim().length < 3) {
      return NextResponse.json(
        { error: "A valid applicant reference or name is required (minimum 3 characters)" },
        { status: 400 }
      );
    }

    if (!description || typeof description !== "string" || description.trim().length < 3) {
      return NextResponse.json(
        { error: "A valid payment description or purpose is required" },
        { status: 400 }
      );
    }

    if (destination === "BANK" && depositReference && typeof depositReference !== "string") {
      return NextResponse.json(
        { error: "Invalid deposit reference format" },
        { status: 400 }
      );
    }

    // Accidental double counting / duplicate submission prevention:
    // Check if identical submission occurred in the last 10 seconds
    const tenSecondsAgo = new Date(Date.now() - 10000);
    const existingDuplicate = await prisma.transaction.findFirst({
      where: {
        destination,
        amount: numericAmount,
        applicantRef: applicantRef.trim(),
        recordedById: user.id,
        createdAt: { gte: tenSecondsAgo },
      },
    });

    if (existingDuplicate) {
      return NextResponse.json(
        {
          error: "Duplicate transaction detected. An identical payment was just recorded a few seconds ago.",
        },
        { status: 409 }
      );
    }

    // Generate unique server-side IDs
    const txnId = await generateTransactionId(destination);
    const receiptNumber = await generateReceiptNumber();

    // Record the payment
    const newTransaction = await prisma.transaction.create({
      data: {
        id: txnId,
        receiptNumber,
        type: "PAYMENT",
        destination,
        amount: numericAmount,
        applicantRef: applicantRef.trim(),
        description: description.trim(),
        depositReference: destination === "BANK" && depositReference ? depositReference.trim() : null,
        recordedById: user.id,
        verificationStatus: "PENDING",
      },
      include: {
        recordedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Write immutable audit log
    await logAudit({
      action: "PAYMENT_RECORDED",
      entityType: "TRANSACTION",
      entityId: newTransaction.id,
      performedById: user.id,
      performedByName: user.name,
      performedByRole: user.role,
      details: {
        transactionId: newTransaction.id,
        receiptNumber: newTransaction.receiptNumber,
        destination: newTransaction.destination,
        amount: newTransaction.amount,
        applicantRef: newTransaction.applicantRef,
        description: newTransaction.description,
        depositReference: newTransaction.depositReference,
        status: newTransaction.verificationStatus,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Payment successfully recorded with unique ID and receipt",
        transaction: newTransaction,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    console.error("Record payment error:", error);
    return NextResponse.json(
      { error: "Failed to record payment" },
      { status: 500 }
    );
  }
}

// Ensure staff cannot DELETE confirmed transactions directly
export async function DELETE() {
  return NextResponse.json(
    {
      error: "Confirmed transactions cannot be deleted. All transactions are permanently preserved for audit compliance.",
    },
    { status: 403 }
  );
}

// Ensure staff cannot PUT/PATCH to overwrite confirmed financial records
export async function PUT() {
  return NextResponse.json(
    {
      error: "Direct modification of confirmed transactions is prohibited to preserve balance integrity.",
    },
    { status: 403 }
  );
}
