import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/auth";
import { hashPassword } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function GET() {
  try {
    // SERVER-SIDE CHECK: OWNER ONLY
    await requireOwner();

    const staffList = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { transactions: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, staff: staffList });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN_OWNER_ONLY") {
      return NextResponse.json(
        { error: "Forbidden: Staff accounts are restricted from accessing user management" },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: "Failed to fetch staff" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // SERVER-SIDE CHECK: OWNER ONLY
    const owner = await requireOwner();

    const { email, password, name, role } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Role check: Only STAFF or OWNER allowed; prevent unauthorized role spoofing
    const userRole = role === "OWNER" ? "OWNER" : "STAFF";

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A user with this email address already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const newUser = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: name.trim(),
        passwordHash,
        role: userRole,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    await logAudit({
      action: "STAFF_ACCOUNT_CREATED",
      entityType: "USER",
      entityId: newUser.id,
      performedById: owner.id,
      performedByName: owner.name,
      performedByRole: owner.role,
      details: {
        createdUserId: newUser.id,
        createdEmail: newUser.email,
        createdName: newUser.name,
        role: newUser.role,
      },
    });

    return NextResponse.json(
      { success: true, message: "Staff account created successfully", user: newUser },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    if (error.message === "FORBIDDEN_OWNER_ONLY") {
      return NextResponse.json(
        { error: "Forbidden: Only the Owner can create staff accounts" },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: "Failed to create staff account" }, { status: 500 });
  }
}
