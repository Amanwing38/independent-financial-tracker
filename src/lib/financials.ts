import { prisma } from "./prisma";

// Generate unique timestamp-based identifiers with sequential padding
export async function generateTransactionId(destination: "CASH" | "BANK"): Promise<string> {
  const prefix = destination === "CASH" ? "TXN-CSH" : "TXN-BNK";
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  
  // Find transactions today to get accurate sequence
  const countToday = await prisma.transaction.count({
    where: {
      id: { startsWith: `${prefix}-${dateStr}` },
    },
  });
  
  const seq = String(countToday + 1).padStart(4, "0");
  return `${prefix}-${dateStr}-${seq}`;
}

export async function generateReceiptNumber(): Promise<string> {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const countToday = await prisma.transaction.count({
    where: {
      receiptNumber: { startsWith: `RCP-${dateStr}` },
    },
  });
  const seq = String(countToday + 1).padStart(4, "0");
  return `RCP-${dateStr}-${seq}`;
}

export async function generateTransferId(): Promise<string> {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const countToday = await prisma.internalTransfer.count({
    where: {
      id: { startsWith: `TRF-${dateStr}` },
    },
  });
  const seq = String(countToday + 1).padStart(4, "0");
  return `TRF-${dateStr}-${seq}`;
}

export async function generateVerificationId(registerType: "CASH" | "BANK"): Promise<string> {
  const prefix = registerType === "CASH" ? "VER-CSH" : "VER-BNK";
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const countToday = await prisma.verificationSession.count({
    where: {
      id: { startsWith: `${prefix}-${dateStr}` },
    },
  });
  const seq = String(countToday + 1).padStart(4, "0");
  return `${prefix}-${dateStr}-${seq}`;
}

export interface FinancialSummary {
  agencyName: string;
  currency: string;
  cashOpeningBalance: number;
  bankOpeningBalance: number;
  
  // Running Account Balances (Independent!)
  currentCashBalance: number;
  currentBankBalance: number;
  
  // Applicant Collections (Income)
  totalCashIncome: number;
  totalBankIncome: number;
  totalApplicantIncome: number;
  
  // Pending Verification amounts (counters cleared upon owner verification)
  pendingCashCollections: number;
  pendingBankCollections: number;
  pendingCashCount: number;
  pendingBankCount: number;
  
  // Verified collections
  verifiedCashCollections: number;
  verifiedBankCollections: number;
  
  // Internal Transfers
  totalInternalTransfers: number;
  
  // Discrepancy counts
  openDiscrepanciesCount: number;
}

export async function calculateFinancialSummary(): Promise<FinancialSummary> {
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

  // 1. Fetch transactions grouped by type and destination
  const transactions = await prisma.transaction.findMany({
    select: {
      id: true,
      type: true,
      destination: true,
      amount: true,
      verificationStatus: true,
    },
  });

  let cashIncome = 0;
  let bankIncome = 0;
  let cashTransferOut = 0;
  let bankTransferIn = 0;
  let pendingCash = 0;
  let pendingBank = 0;
  let pendingCashCount = 0;
  let pendingBankCount = 0;
  let verifiedCash = 0;
  let verifiedBank = 0;

  for (const txn of transactions) {
    if (txn.type === "PAYMENT") {
      if (txn.destination === "CASH") {
        cashIncome += txn.amount;
        if (txn.verificationStatus === "PENDING") {
          pendingCash += txn.amount;
          pendingCashCount++;
        } else if (txn.verificationStatus === "VERIFIED") {
          verifiedCash += txn.amount;
        }
      } else if (txn.destination === "BANK") {
        bankIncome += txn.amount;
        if (txn.verificationStatus === "PENDING") {
          pendingBank += txn.amount;
          pendingBankCount++;
        } else if (txn.verificationStatus === "VERIFIED") {
          verifiedBank += txn.amount;
        }
      }
    } else if (txn.type === "TRANSFER_OUT" && txn.destination === "CASH") {
      cashTransferOut += txn.amount;
    } else if (txn.type === "TRANSFER_IN" && txn.destination === "BANK") {
      bankTransferIn += txn.amount;
    }
  }

  // Running cash balance: Opening + Cash payments received - Cash deposited to bank
  const currentCashBalance = settings.cashOpeningBalance + cashIncome - cashTransferOut;

  // Running bank balance: Opening + Bank payments received + Cash deposited to bank
  const currentBankBalance = settings.bankOpeningBalance + bankIncome + bankTransferIn;

  // Total applicant payments collected (strictly payments, transfers NOT counted!)
  const totalApplicantIncome = cashIncome + bankIncome;

  // Check unresolved discrepancies
  const openDiscrepancies = await prisma.verificationSession.count({
    where: {
      status: "FLAGGED",
    },
  });

  return {
    agencyName: settings.agencyName,
    currency: settings.currency,
    cashOpeningBalance: settings.cashOpeningBalance,
    bankOpeningBalance: settings.bankOpeningBalance,
    currentCashBalance,
    currentBankBalance,
    totalCashIncome: cashIncome,
    totalBankIncome: bankIncome,
    totalApplicantIncome,
    pendingCashCollections: pendingCash,
    pendingBankCollections: pendingBank,
    pendingCashCount,
    pendingBankCount,
    verifiedCashCollections: verifiedCash,
    verifiedBankCollections: verifiedBank,
    totalInternalTransfers: cashTransferOut,
    openDiscrepanciesCount: openDiscrepancies,
  };
}
