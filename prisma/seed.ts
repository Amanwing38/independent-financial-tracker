import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Independent Financial Tracker database...");

  // 1. Initialize Agency Settings
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
  console.log("Agency settings ready:", settings.agencyName);

  // 2. Hash default passwords
  const ownerPasswordHash = await bcrypt.hash("OwnerPassword123!", 10);
  const staffPasswordHash = await bcrypt.hash("StaffPassword123!", 10);

  // 3. Create Owner
  const owner = await prisma.user.upsert({
    where: { email: "owner@tracker.local" },
    update: {},
    create: {
      email: "owner@tracker.local",
      name: "Dawit Haile (Owner)",
      passwordHash: ownerPasswordHash,
      role: "OWNER",
      isActive: true,
    },
  });
  console.log("Owner created:", owner.email);

  // 4. Create Staff Accounts
  const staff1 = await prisma.user.upsert({
    where: { email: "staff1@tracker.local" },
    update: {},
    create: {
      email: "staff1@tracker.local",
      name: "Selamawit Tadesse (Staff)",
      passwordHash: staffPasswordHash,
      role: "STAFF",
      isActive: true,
    },
  });

  const staff2 = await prisma.user.upsert({
    where: { email: "staff2@tracker.local" },
    update: {},
    create: {
      email: "staff2@tracker.local",
      name: "Yohannes Bekele (Staff)",
      passwordHash: staffPasswordHash,
      role: "STAFF",
      isActive: true,
    },
  });
  console.log("Staff accounts created:", staff1.email, staff2.email);

  // 5. Seed some initial audit log entries
  await prisma.auditLog.createMany({
    data: [
      {
        action: "SYSTEM_INITIALIZED",
        entityType: "SETTINGS",
        entityId: "default",
        performedById: owner.id,
        performedByName: owner.name,
        performedByRole: "OWNER",
        details: JSON.stringify({
          message: "System initialized with cash opening 5,000 ETB, bank opening 25,000 ETB [DEMO DATA]",
        }),
      },
      {
        action: "STAFF_CREATED",
        entityType: "USER",
        entityId: staff1.id,
        performedById: owner.id,
        performedByName: owner.name,
        performedByRole: "OWNER",
        details: JSON.stringify({ createdUser: staff1.email, role: "STAFF" }),
      },
    ],
  });

  // 6. Seed sample DEMO DATA payments
  const existingTxns = await prisma.transaction.count();
  if (existingTxns === 0) {
    // Verified historic Cash payment
    const pastCashTxn = await prisma.transaction.create({
      data: {
        id: "TXN-CSH-20261010-0001",
        receiptNumber: "RCP-20261010-0001",
        type: "PAYMENT",
        destination: "CASH",
        amount: 3000.0,
        applicantRef: "APP-DEMO-101 - Almaz Mengistu [DEMO DATA]",
        description: "Application initial processing fee [DEMO DATA]",
        recordedById: staff1.id,
        verificationStatus: "VERIFIED",
        createdAt: new Date("2026-10-10T10:30:00Z"),
      },
    });

    // Verification session for the historic payment
    const verSession = await prisma.verificationSession.create({
      data: {
        id: "VER-CSH-20261010-0001",
        registerType: "CASH",
        periodStart: new Date("2026-10-10T00:00:00Z"),
        periodEnd: new Date("2026-10-10T23:59:59Z"),
        expectedAmount: 3000.0,
        verifiedAmount: 3000.0,
        discrepancy: 0.0,
        hasDiscrepancy: false,
        status: "VERIFIED",
        verifiedById: owner.id,
        createdAt: new Date("2026-10-10T17:00:00Z"),
      },
    });

    await prisma.transaction.update({
      where: { id: pastCashTxn.id },
      data: { verificationSessionId: verSession.id },
    });

    // New pending Cash payment
    await prisma.transaction.create({
      data: {
        id: "TXN-CSH-20261013-0001",
        receiptNumber: "RCP-20261013-0001",
        type: "PAYMENT",
        destination: "CASH",
        amount: 2500.0,
        applicantRef: "APP-DEMO-102 - Chala Bekele [DEMO DATA]",
        description: "Medical clearance processing fee [DEMO DATA]",
        recordedById: staff1.id,
        verificationStatus: "PENDING",
        createdAt: new Date("2026-10-13T09:15:00Z"),
      },
    });

    // New pending Bank payment
    await prisma.transaction.create({
      data: {
        id: "TXN-BNK-20261013-0001",
        receiptNumber: "RCP-20261013-0002",
        type: "PAYMENT",
        destination: "BANK",
        amount: 7500.0,
        applicantRef: "APP-DEMO-103 - Meron Tesfaye [DEMO DATA]",
        description: "Trade test and certification fee [DEMO DATA]",
        depositReference: "CBE-DEP-9923841",
        recordedById: staff2.id,
        verificationStatus: "PENDING",
        createdAt: new Date("2026-10-13T11:45:00Z"),
      },
    });

    // Internal Transfer: Deposit 1,000 ETB from Cash into Bank
    const transfer = await prisma.internalTransfer.create({
      data: {
        id: "TRF-20261012-0001",
        amount: 1000.0,
        bankReference: "CBE-SLIP-771822",
        notes: "Routine excess cash deposit to CBE commercial account [DEMO DATA]",
        authorizedById: owner.id,
        createdAt: new Date("2026-10-12T14:00:00Z"),
      },
    });

    // Outflow from cash
    await prisma.transaction.create({
      data: {
        id: "TXN-CSH-TRF-20261012-0001",
        receiptNumber: "RCP-TRF-OUT-0001",
        type: "TRANSFER_OUT",
        destination: "CASH",
        amount: 1000.0,
        applicantRef: "INTERNAL TRANSFER [DEMO DATA]",
        description: "Cash deposited to bank account (Slip # CBE-SLIP-771822) [DEMO DATA]",
        recordedById: owner.id,
        verificationStatus: "VERIFIED",
        internalTransferId: transfer.id,
        createdAt: new Date("2026-10-12T14:00:00Z"),
      },
    });

    // Inflow to bank
    await prisma.transaction.create({
      data: {
        id: "TXN-BNK-TRF-20261012-0001",
        receiptNumber: "RCP-TRF-IN-0001",
        type: "TRANSFER_IN",
        destination: "BANK",
        amount: 1000.0,
        applicantRef: "INTERNAL TRANSFER [DEMO DATA]",
        description: "Cash received from office cash register (Slip # CBE-SLIP-771822) [DEMO DATA]",
        depositReference: "CBE-SLIP-771822",
        recordedById: owner.id,
        verificationStatus: "VERIFIED",
        internalTransferId: transfer.id,
        createdAt: new Date("2026-10-12T14:00:00Z"),
      },
    });

    console.log("Demo transactions and internal transfer created.");
  }

  console.log("Database seeded successfully.");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
