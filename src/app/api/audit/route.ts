import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    // IMMUTABLE AUDIT LOG: OWNER ONLY
    await requireOwner();

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const entityType = searchParams.get("entityType");

    const where: Record<string, unknown> = {};
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN_OWNER_ONLY") {
      return NextResponse.json(
        { error: "Forbidden: Only the Owner can inspect the system audit history" },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Audit logs are strictly immutable and cannot be deleted or altered by any user." },
    { status: 403 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: "Audit logs are strictly immutable and cannot be updated." },
    { status: 403 }
  );
}
