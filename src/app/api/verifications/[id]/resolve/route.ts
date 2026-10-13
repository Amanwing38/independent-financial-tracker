import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const owner = await requireOwner();
    const { id } = await params;
    const { resolutionNotes } = await request.json();

    if (!resolutionNotes || resolutionNotes.trim().length < 5) {
      return NextResponse.json(
        { error: "Resolution explanation and authorized notes are required (min 5 characters)" },
        { status: 400 }
      );
    }

    const session = await prisma.verificationSession.findUnique({
      where: { id },
    });

    if (!session) {
      return NextResponse.json({ error: "Verification session not found" }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const s = await tx.verificationSession.update({
        where: { id },
        data: {
          status: "RESOLVED",
          resolutionNotes: resolutionNotes.trim(),
        },
      });

      // Update associated transactions from FLAGGED_DISCREPANCY to VERIFIED
      await tx.transaction.updateMany({
        where: { verificationSessionId: id },
        data: { verificationStatus: "VERIFIED" },
      });

      return s;
    });

    await logAudit({
      action: "DISCREPANCY_RESOLVED",
      entityType: "VERIFICATION",
      entityId: id,
      performedById: owner.id,
      performedByName: owner.name,
      performedByRole: owner.role,
      details: {
        sessionId: id,
        previousStatus: session.status,
        resolutionNotes: resolutionNotes.trim(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Discrepancy resolved and authorized by owner",
      session: updated,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN_OWNER_ONLY") {
      return NextResponse.json(
        { error: "Forbidden: Only the Agency Owner can authorize discrepancy resolutions" },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: "Failed to resolve discrepancy" }, { status: 500 });
  }
}
