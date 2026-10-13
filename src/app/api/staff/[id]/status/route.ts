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
    const { isActive } = await request.json();

    if (id === owner.id) {
      return NextResponse.json(
        { error: "Cannot disable your own active owner account" },
        { status: 400 }
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: Boolean(isActive) },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    });

    await logAudit({
      action: updated.isActive ? "STAFF_ACCOUNT_ENABLED" : "STAFF_ACCOUNT_DISABLED",
      entityType: "USER",
      entityId: id,
      performedById: owner.id,
      performedByName: owner.name,
      performedByRole: owner.role,
      details: {
        targetUser: updated.email,
        isActive: updated.isActive,
      },
    });

    return NextResponse.json({
      success: true,
      message: `User account ${updated.isActive ? "enabled" : "disabled"} successfully`,
      user: updated,
    });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN_OWNER_ONLY") {
      return NextResponse.json(
        { error: "Forbidden: Only the Owner can manage staff status" },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: "Failed to update staff status" }, { status: 500 });
  }
}
