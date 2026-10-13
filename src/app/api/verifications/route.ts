import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner, requireUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { generateVerificationId } from "@/lib/financials";

export async function GET() {
  try {
    await requireUser();
    const sessions = await prisma.verificationSession.findMany({
      include: {
        verifiedBy: {
          select: { id: true, name: true, email: true },
        },
        transactions: {
          select: {
            id: true,
            receiptNumber: true,
            amount: true,
            applicantRef: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, sessions });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch verification sessions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // ENFORCE SERVER-SIDE AUTHORIZATION: OWNER ONLY!
    const owner = await requireOwner();

    const { registerType, verifiedAmount, notes, discrepancyReason } = await request.json();

    if (!registerType || (registerType !== "CASH" && registerType !== "BANK")) {
      return NextResponse.json(
        { error: "Register type must be either CASH or BANK" },
        { status: 400 }
      );
    }

    const numericVerified = parseFloat(verifiedAmount);
    if (isNaN(numericVerified) || numericVerified < 0) {
      return NextResponse.json(
        { error: "Verified amount must be a valid non-negative number" },
        { status: 400 }
      );
    }

    // 1. Find all unverified payment transactions for this register
    const unverifiedTxns = await prisma.transaction.findMany({
      where: {
        destination: registerType,
        type: "PAYMENT",
        verificationStatus: "PENDING",
      },
      orderBy: { createdAt: "asc" },
    });

    if (unverifiedTxns.length === 0) {
      return NextResponse.json(
        {
          error: `No pending unverified collections found for the ${registerType} register to close.`,
        },
        { status: 400 }
      );
    }

    // 2. Calculate expected collections
    const expectedAmount = unverifiedTxns.reduce((sum, txn) => sum + txn.amount, 0);
    const discrepancy = numericVerified - expectedAmount;
    const hasDiscrepancy = Math.abs(discrepancy) > 0.001;

    if (hasDiscrepancy && (!discrepancyReason || discrepancyReason.trim().length < 5)) {
      return NextResponse.json(
        {
          error: `Discrepancy of ${discrepancy > 0 ? "+" : ""}${discrepancy.toFixed(2)} detected between recorded collections (${expectedAmount.toFixed(2)}) and verified physical/bank count (${numericVerified.toFixed(2)}). An explanation and discrepancy reason are required to proceed.`,
        },
        { status: 400 }
      );
    }

    const sessionId = await generateVerificationId(registerType);
    const periodStart = unverifiedTxns[0].createdAt;
    const periodEnd = unverifiedTxns[unverifiedTxns.length - 1].createdAt;

    // 3. Atomically close the collection period
    const result = await prisma.$transaction(async (tx) => {
      const session = await tx.verificationSession.create({
        data: {
          id: sessionId,
          registerType,
          periodStart,
          periodEnd,
          expectedAmount,
          verifiedAmount: numericVerified,
          discrepancy,
          hasDiscrepancy,
          status: hasDiscrepancy ? "FLAGGED" : "VERIFIED",
          discrepancyReason: hasDiscrepancy ? discrepancyReason.trim() : null,
          notes: notes ? notes.trim() : null,
          verifiedById: owner.id,
        },
      });

      // Mark the transactions as VERIFIED or FLAGGED_DISCREPANCY, linked to this verification session
      const targetStatus = hasDiscrepancy ? "FLAGGED_DISCREPANCY" : "VERIFIED";
      await tx.transaction.updateMany({
        where: {
          id: { in: unverifiedTxns.map((t) => t.id) },
        },
        data: {
          verificationStatus: targetStatus,
          verificationSessionId: session.id,
        },
      });

      return session;
    });

    // 4. Log immutable audit trail
    await logAudit({
      action: hasDiscrepancy ? "COLLECTION_VERIFIED_WITH_DISCREPANCY" : "COLLECTION_VERIFIED",
      entityType: "VERIFICATION",
      entityId: result.id,
      performedById: owner.id,
      performedByName: owner.name,
      performedByRole: owner.role,
      details: {
        sessionId: result.id,
        registerType,
        expectedAmount,
        verifiedAmount: numericVerified,
        discrepancy,
        hasDiscrepancy,
        discrepancyReason: discrepancyReason || null,
        transactionCount: unverifiedTxns.length,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: hasDiscrepancy
          ? `Collection period verified with a discrepancy of ${discrepancy.toFixed(2)}. Flagged for review.`
          : `Collection period verified successfully. Pending unverified counter cleared. Actual account balances remain intact.`,
        session: result,
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN_OWNER_ONLY") {
      return NextResponse.json(
        { error: "Forbidden: Only the Agency Owner has permission to verify collections and close financial periods." },
        { status: 403 }
      );
    }
    console.error("Verification error:", error);
    return NextResponse.json({ error: "Failed to verify collection period" }, { status: 500 });
  }
}
