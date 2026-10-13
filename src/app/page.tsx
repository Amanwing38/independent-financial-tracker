"use client";

import React, { useState, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar";
import LoginView from "@/components/LoginView";
import DashboardView from "@/components/views/DashboardView";
import CashRegisterView from "@/components/views/CashRegisterView";
import BankRegisterView from "@/components/views/BankRegisterView";
import TransfersView from "@/components/views/TransfersView";
import VerificationsView from "@/components/views/VerificationsView";
import ReportsView from "@/components/views/ReportsView";
import StaffView from "@/components/views/StaffView";
import AuditView from "@/components/views/AuditView";
import SettingsView from "@/components/views/SettingsView";
import PaymentModal from "@/components/PaymentModal";
import TransferModal from "@/components/TransferModal";
import VerificationModal from "@/components/VerificationModal";
import DiscrepancyModal from "@/components/DiscrepancyModal";
import ReceiptModal, { ReceiptData } from "@/components/ReceiptModal";
import { FinancialSummary } from "@/lib/financials";

export default function Home() {
  const [user, setUser] = useState<{
    id: string;
    email: string;
    name: string;
    role: "OWNER" | "STAFF";
  } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Active navigation tab
  const [currentTab, setCurrentTab] = useState("dashboard");

  // Financial data state
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [openSessions, setOpenSessions] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Modals state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentModalDest, setPaymentModalDest] = useState<"CASH" | "BANK">("CASH");
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [verificationModalReg, setVerificationModalReg] = useState<"CASH" | "BANK">("CASH");
  const [discrepancyModalSession, setDiscrepancyModalSession] = useState<any | null>(null);
  const [activeReceipt, setActiveReceipt] = useState<ReceiptData | null>(null);

  // Check authentication on initial load
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) return res.json();
        return { authenticated: false };
      })
      .then((data) => {
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
        setAuthChecked(true);
      })
      .catch(() => {
        setUser(null);
        setAuthChecked(true);
      });
  }, []);

  // Fetch financial summary and transactions
  const loadFinancialData = useCallback(async () => {
    if (!user) return;
    try {
      const [sumRes, txnRes, verRes] = await Promise.all([
        fetch("/api/summary"),
        fetch("/api/transactions"),
        fetch("/api/verifications"),
      ]);

      if (sumRes.ok) {
        const sumData = await sumRes.json();
        setSummary(sumData.summary);
      }

      if (txnRes.ok) {
        const txnData = await txnRes.json();
        setTransactions(txnData.transactions || []);
      }

      if (verRes.ok) {
        const verData = await verRes.json();
        const flagged = (verData.sessions || []).filter((s: any) => s.status === "FLAGGED");
        setOpenSessions(flagged);
      }
    } catch (err) {
      console.error("Failed to load financial records:", err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadFinancialData();
    }
  }, [user, refreshKey, loadFinancialData]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  };

  const handlePaymentSuccess = (txn: any) => {
    setPaymentModalOpen(false);
    setRefreshKey((k) => k + 1);
    // Automatically pop receipt for immediate printing
    setActiveReceipt({
      id: txn.id,
      receiptNumber: txn.receiptNumber,
      destination: txn.destination,
      amount: txn.amount,
      applicantRef: txn.applicantRef,
      description: txn.description,
      depositReference: txn.depositReference,
      recordedBy: txn.recordedBy,
      verificationStatus: txn.verificationStatus,
      createdAt: txn.createdAt,
      agencyName: summary?.agencyName,
      currency: summary?.currency,
    });
  };

  const handleTransferSuccess = () => {
    setTransferModalOpen(false);
    setRefreshKey((k) => k + 1);
  };

  const handleVerificationSuccess = () => {
    setVerificationModalOpen(false);
    setRefreshKey((k) => k + 1);
  };

  const handleResolveSuccess = () => {
    setDiscrepancyModalSession(null);
    setRefreshKey((k) => k + 1);
  };

  const handleUpdateSettings = async (newName: string, newCurr: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agencyName: newName, currency: newCurr }),
      });
      if (res.ok) {
        setRefreshKey((k) => k + 1);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-sm">
        Initializing Independent Financial Tracker...
      </div>
    );
  }

  if (!user) {
    return <LoginView onLoginSuccess={(u) => setUser(u)} />;
  }

  const currency = summary?.currency || "ETB";
  const agencyName = summary?.agencyName || "Independent Overseas Agency [DEMO DATA]";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Navbar with role tabs and quick actions */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        user={user}
        agencyName={agencyName}
        onLogout={handleLogout}
        onOpenPaymentModal={(dest = "CASH") => {
          setPaymentModalDest(dest);
          setPaymentModalOpen(true);
        }}
        onOpenTransferModal={() => setTransferModalOpen(true)}
        onOpenVerificationModal={(reg = "CASH") => {
          setVerificationModalReg(reg);
          setVerificationModalOpen(true);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0">
        {currentTab === "dashboard" && (
          <DashboardView
            summary={summary}
            transactions={transactions}
            userRole={user.role}
            openSessions={openSessions}
            onSelectReceipt={(t) =>
              setActiveReceipt({
                ...t,
                agencyName,
                currency,
              })
            }
            onOpenPaymentModal={(dest = "CASH") => {
              setPaymentModalDest(dest);
              setPaymentModalOpen(true);
            }}
            onOpenVerificationModal={(reg = "CASH") => {
              setVerificationModalReg(reg);
              setVerificationModalOpen(true);
            }}
            onResolveDiscrepancy={(session) => setDiscrepancyModalSession(session)}
          />
        )}

        {currentTab === "cash" && (
          <CashRegisterView
            summary={summary}
            transactions={transactions}
            userRole={user.role}
            onSelectReceipt={(t) =>
              setActiveReceipt({
                ...t,
                agencyName,
                currency,
              })
            }
            onOpenPaymentModal={() => {
              setPaymentModalDest("CASH");
              setPaymentModalOpen(true);
            }}
            onOpenTransferModal={() => setTransferModalOpen(true)}
            onOpenVerificationModal={() => {
              setVerificationModalReg("CASH");
              setVerificationModalOpen(true);
            }}
          />
        )}

        {currentTab === "bank" && (
          <BankRegisterView
            summary={summary}
            transactions={transactions}
            userRole={user.role}
            onSelectReceipt={(t) =>
              setActiveReceipt({
                ...t,
                agencyName,
                currency,
              })
            }
            onOpenPaymentModal={() => {
              setPaymentModalDest("BANK");
              setPaymentModalOpen(true);
            }}
            onOpenTransferModal={() => setTransferModalOpen(true)}
            onOpenVerificationModal={() => {
              setVerificationModalReg("BANK");
              setVerificationModalOpen(true);
            }}
          />
        )}

        {currentTab === "transfers" && (
          <TransfersView
            onOpenTransferModal={() => setTransferModalOpen(true)}
            currency={currency}
            refreshKey={refreshKey}
          />
        )}

        {currentTab === "verifications" && (
          <VerificationsView
            onOpenVerificationModal={(reg = "CASH") => {
              setVerificationModalReg(reg);
              setVerificationModalOpen(true);
            }}
            onResolveDiscrepancy={(session) => setDiscrepancyModalSession(session)}
            userRole={user.role}
            currency={currency}
            refreshKey={refreshKey}
          />
        )}

        {currentTab === "reports" && (
          <ReportsView summary={summary} refreshKey={refreshKey} />
        )}

        {currentTab === "staff" && (
          <StaffView userRole={user.role} refreshKey={refreshKey} />
        )}

        {currentTab === "audit" && (
          <AuditView userRole={user.role} refreshKey={refreshKey} />
        )}

        {currentTab === "settings" && (
          <SettingsView
            agencyName={agencyName}
            currency={currency}
            onUpdateSettings={handleUpdateSettings}
            userRole={user.role}
          />
        )}
      </main>

      {/* Record Payment Modal */}
      <PaymentModal
        isOpen={paymentModalOpen}
        defaultDestination={paymentModalDest}
        currency={currency}
        onClose={() => setPaymentModalOpen(false)}
        onSuccess={handlePaymentSuccess}
      />

      {/* Internal Cash-to-Bank Transfer Modal */}
      <TransferModal
        isOpen={transferModalOpen}
        currentCashBalance={summary?.currentCashBalance || 0}
        currency={currency}
        onClose={() => setTransferModalOpen(false)}
        onSuccess={handleTransferSuccess}
      />

      {/* Owner Collection Verification Modal */}
      <VerificationModal
        isOpen={verificationModalOpen}
        defaultRegister={verificationModalReg}
        currency={currency}
        pendingCashAmount={summary?.pendingCashCollections || 0}
        pendingBankAmount={summary?.pendingBankCollections || 0}
        pendingCashCount={summary?.pendingCashCount || 0}
        pendingBankCount={summary?.pendingBankCount || 0}
        onClose={() => setVerificationModalOpen(false)}
        onSuccess={handleVerificationSuccess}
      />

      {/* Owner Discrepancy Resolution Modal */}
      <DiscrepancyModal
        session={discrepancyModalSession}
        currency={currency}
        onClose={() => setDiscrepancyModalSession(null)}
        onSuccess={handleResolveSuccess}
      />

      {/* Printable Receipt Modal */}
      <ReceiptModal
        receipt={activeReceipt}
        onClose={() => setActiveReceipt(null)}
        agencyName={agencyName}
        currency={currency}
      />
    </div>
  );
}
