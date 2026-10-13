"use client";

import React, { useState } from "react";
import {
  Wallet,
  PlusCircle,
  FileText,
  Search,
  Filter,
  CheckCircle,
  Clock,
  ArrowRightLeft,
} from "lucide-react";
import { FinancialSummary } from "@/lib/financials";

interface CashRegisterViewProps {
  summary: FinancialSummary | null;
  transactions: any[];
  userRole: "OWNER" | "STAFF";
  onSelectReceipt: (txn: any) => void;
  onOpenPaymentModal: () => void;
  onOpenTransferModal: () => void;
  onOpenVerificationModal: () => void;
}

export default function CashRegisterView({
  summary,
  transactions,
  userRole,
  onSelectReceipt,
  onOpenPaymentModal,
  onOpenTransferModal,
  onOpenVerificationModal,
}: CashRegisterViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  if (!summary) return null;
  const currency = summary.currency || "ETB";

  // Filter only cash transactions
  const cashTransactions = transactions.filter((t) => t.destination === "CASH");

  const filtered = cashTransactions.filter((t) => {
    const matchesStatus = statusFilter === "ALL" || t.verificationStatus === statusFilter;
    const matchesSearch =
      searchTerm === "" ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.applicantRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-emerald-900 text-white p-6 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <Wallet className="w-4 h-4" />
            Independent Cash Register Desk
          </div>
          <h2 className="text-3xl font-extrabold font-mono mt-1">
            {currency}{" "}
            {summary.currentCashBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h2>
          <p className="text-xs text-emerald-200 mt-1">
            Current Physical Cash on Hand (Opening Balance + Collected Payments - Bank Deposits)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenPaymentModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-emerald-950 rounded-lg text-xs font-bold transition shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            Receive Cash Payment
          </button>
          <button
            onClick={onOpenTransferModal}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition border border-emerald-700"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Deposit Cash to Bank
          </button>
          {userRole === "OWNER" && (
            <button
              onClick={onOpenVerificationModal}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold transition shadow-xs"
            >
              Verify Cash Register
            </button>
          )}
        </div>
      </div>

      {/* Cash Register Breakdown Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 uppercase font-semibold">Opening Cash Balance</div>
          <div className="text-xl font-bold text-slate-900 font-mono mt-1">
            {currency} {summary.cashOpeningBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Established baseline register balance</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-emerald-700 uppercase font-semibold">Total Cash Payments</div>
          <div className="text-xl font-bold text-emerald-700 font-mono mt-1">
            +{currency} {summary.totalCashIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Cumulative applicant cash receipts</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-rose-700 uppercase font-semibold">Cash Deposited to Bank</div>
          <div className="text-xl font-bold text-rose-700 font-mono mt-1">
            -{currency} {summary.totalInternalTransfers.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Internal transfer outflows to bank</div>
        </div>

        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 shadow-xs">
          <div className="text-xs text-amber-900 uppercase font-semibold">Pending Verification</div>
          <div className="text-xl font-bold text-amber-900 font-mono mt-1">
            {currency} {summary.pendingCashCollections.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-amber-800 mt-1">
            {summary.pendingCashCount} unverified payments
          </div>
        </div>
      </div>

      {/* Cash Transaction Ledger Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Cash Register Transaction Ledger</h3>
            <p className="text-xs text-slate-500">
              Chronological log of all physical cash receipts and deposit outflows
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search cash entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-500 w-44"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
              <Filter className="w-3 h-3 text-slate-500 ml-1.5" />
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`px-2 py-1 rounded text-xs font-medium transition ${
                  statusFilter === "ALL" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter("PENDING")}
                className={`px-2 py-1 rounded text-xs font-medium transition ${
                  statusFilter === "PENDING" ? "bg-white text-amber-800 shadow-xs" : "text-slate-600"
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setStatusFilter("VERIFIED")}
                className={`px-2 py-1 rounded text-xs font-medium transition ${
                  statusFilter === "VERIFIED" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-600"
                }`}
              >
                Verified
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="py-2.5 px-4 font-semibold">Transaction ID</th>
                <th className="py-2.5 px-4 font-semibold">Receipt #</th>
                <th className="py-2.5 px-4 font-semibold">Applicant Ref & Purpose</th>
                <th className="py-2.5 px-4 font-semibold text-right">Inflow / Outflow</th>
                <th className="py-2.5 px-4 font-semibold">Recorded By</th>
                <th className="py-2.5 px-4 font-semibold">Status</th>
                <th className="py-2.5 px-4 font-semibold">Timestamp</th>
                <th className="py-2.5 px-4 font-semibold text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No cash register records found.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-4 font-mono font-medium text-slate-900">{t.id}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-600">{t.receiptNumber}</td>
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-slate-900">{t.applicantRef}</div>
                      <div className="text-[11px] text-slate-500">{t.description}</div>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold">
                      {t.type === "TRANSFER_OUT" ? (
                        <span className="text-rose-600">
                          -{currency} {t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span className="text-emerald-700">
                          +{currency} {t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">{t.recordedBy?.name || "Staff"}</td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          t.verificationStatus === "VERIFIED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : t.verificationStatus === "FLAGGED_DISCREPANCY"
                            ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : "bg-amber-50 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {t.verificationStatus}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 text-[11px]">
                      {new Date(t.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <button
                        onClick={() => onSelectReceipt(t)}
                        className="p-1 hover:bg-slate-100 text-slate-600 hover:text-blue-600 rounded transition"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
