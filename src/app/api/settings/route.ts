import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner, requireUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    await requireUser();
    const settings = await prisma.agencySettings.upsert({
      where: { id: "default" },
      update: {},
      create: {
        id: "default",
        agencyName: "Horn Continental Financial Desk [DEMO DATA]",
        currency: "ETB",
        cashOpeningBalance: 5000.0,
        bankOpeningBalance: 25000.0,
      },
    });

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const owner = await requireOwner();
    const { agencyName, currency } = await request.json();

    if (!agencyName || agencyName.trim().length < 3) {
      return NextResponse.json(
        { error: "Agency name is required (min 3 characters)" },
        { status: 400 }
      );
    }

    const updated = await prisma.agencySettings.update({
      where: { id: "default" },
      data: {
        agencyName: agencyName.trim(),
        currency: currency ? currency.trim() : "ETB",
      },
    });

    await logAudit({
      action: "SETTINGS_UPDATED",
      entityType: "SETTINGS",
      entityId: "default",
      performedById: owner.id,
      performedByName: owner.name,
      performedByRole: owner.role,
      details: {
        agencyName: updated.agencyName,
        currency: updated.currency,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Agency settings updated successfully",
      settings: updated,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN_OWNER_ONLY") {
      return NextResponse.json(
        { error: "Forbidden: Only the Owner can modify agency settings" },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
