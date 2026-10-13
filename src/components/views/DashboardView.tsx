"use client";

import React, { useState } from "react";
import {
  Wallet,
  Building,
  TrendingUp,
  Clock,
  AlertTriangle,
  FileText,
  Search,
  Filter,
} from "lucide-react";
import { FinancialSummary } from "@/lib/financials";

interface DashboardViewProps {
  summary: FinancialSummary | null;
  transactions: any[];
  userRole: "OWNER" | "STAFF";
  onSelectReceipt: (txn: any) => void;
  onOpenPaymentModal: (dest?: "CASH" | "BANK") => void;
  onOpenVerificationModal: (reg?: "CASH" | "BANK") => void;
  onResolveDiscrepancy: (session: any) => void;
  openSessions: any[];
}

export default function DashboardView({
  summary,
  transactions,
  userRole,
  onSelectReceipt,
  onOpenPaymentModal,
  onOpenVerificationModal,
  onResolveDiscrepancy,
  openSessions,
}: DashboardViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDest, setFilterDest] = useState<string>("ALL");

  if (!summary) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-400">
        Loading financial summary...
      </div>
    );
  }

  const currency = summary.currency || "ETB";

  const filteredTransactions = transactions.filter((t) => {
    const matchesDest = filterDest === "ALL" || t.destination === filterDest;
    const matchesSearch =
      searchTerm === "" ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.applicantRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDest && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Discrepancy Banner if open discrepancies exist */}
      {summary.openDiscrepanciesCount > 0 && (
        <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-amber-900">
                Action Required: {summary.openDiscrepanciesCount} Discrepancy Flagged for Resolution
              </h3>
              <p className="text-xs text-amber-800">
                A collection period had a physical/bank count difference requiring authorized Owner sign-off.
              </p>
            </div>
          </div>
          {userRole === "OWNER" && openSessions.length > 0 && (
            <button
              onClick={() => onResolveDiscrepancy(openSessions[0])}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold whitespace-nowrap transition"
            >
              Review & Sign Off Discrepancy
            </button>
          )}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Cash Register Balance */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Cash Register (On-Hand)
            </span>
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-700">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            {currency}{" "}
            {summary.currentCashBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-xs flex justify-between text-slate-500 pt-2 border-t border-slate-100">
            <span>Opening: {currency} {summary.cashOpeningBalance.toLocaleString()}</span>
            <span className="text-emerald-700 font-medium">
              Collected: +{currency} {summary.totalCashIncome.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Bank Register Balance */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
              Bank Register (Commercial Account)
            </span>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-700">
              <Building className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            {currency}{" "}
            {summary.currentBankBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-xs flex justify-between text-slate-500 pt-2 border-t border-slate-100">
            <span>Opening: {currency} {summary.bankOpeningBalance.toLocaleString()}</span>
            <span className="text-blue-700 font-medium">
              Collected: +{currency} {summary.totalBankIncome.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Total Applicant Payments Income */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-800">
              Total Applicant Payments (Income)
            </span>
            <div className="p-2 bg-purple-50 rounded-lg text-purple-700">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">
            {currency}{" "}
            {summary.totalApplicantIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-xs text-slate-500 pt-2 border-t border-slate-100 flex justify-between">
            <span>Cash: {currency} {summary.totalCashIncome.toLocaleString()}</span>
            <span>Bank: {currency} {summary.totalBankIncome.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Pending Verification Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pending Cash Verification */}
        <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-200/60 shadow-xs flex items-center justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-lg text-amber-800 mt-0.5">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase text-amber-900">
                Pending Cash Verification
              </div>
              <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
                {currency} {summary.pendingCashCollections.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-slate-500">
                {summary.pendingCashCount} unverified cash payment(s) awaiting physical count
              </div>
            </div>
          </div>
          {userRole === "OWNER" && summary.pendingCashCount > 0 && (
            <button
              onClick={() => onOpenVerificationModal("CASH")}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-semibold shadow-xs transition"
            >
              Verify Cash
            </button>
          )}
        </div>

        {/* Pending Bank Verification */}
        <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-200/60 shadow-xs flex items-center justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-800 mt-0.5">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase text-blue-900">
                Pending Bank Verification
              </div>
              <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
                {currency} {summary.pendingBankCollections.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-slate-500">
                {summary.pendingBankCount} unverified bank deposit(s) awaiting bank statement check
              </div>
            </div>
          </div>
          {userRole === "OWNER" && summary.pendingBankCount > 0 && (
            <button
              onClick={() => onOpenVerificationModal("BANK")}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow-xs transition"
            >
              Verify Bank
            </button>
          )}
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">Recent Financial Transactions</h2>
            <span className="text-xs text-slate-500">({filteredTransactions.length} records)</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search ref, receipt, name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-500 w-48"
              />
            </div>

            {/* Filter */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
              <Filter className="w-3 h-3 text-slate-500 ml-1.5" />
              <button
                onClick={() => setFilterDest("ALL")}
                className={`px-2 py-1 rounded text-xs font-medium transition ${
                  filterDest === "ALL" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterDest("CASH")}
                className={`px-2 py-1 rounded text-xs font-medium transition ${
                  filterDest === "CASH" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-600"
                }`}
              >
                Cash
              </button>
              <button
                onClick={() => setFilterDest("BANK")}
                className={`px-2 py-1 rounded text-xs font-medium transition ${
                  filterDest === "BANK" ? "bg-white text-blue-800 shadow-xs" : "text-slate-600"
                }`}
              >
                Bank
              </button>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="py-2.5 px-4 font-semibold">Txn ID / Receipt</th>
                <th className="py-2.5 px-4 font-semibold">Type / Destination</th>
                <th className="py-2.5 px-4 font-semibold">Applicant Ref & Purpose</th>
                <th className="py-2.5 px-4 font-semibold text-right">Amount</th>
                <th className="py-2.5 px-4 font-semibold">Recorded By</th>
                <th className="py-2.5 px-4 font-semibold">Verification Status</th>
                <th className="py-2.5 px-4 font-semibold">Date & Time</th>
                <th className="py-2.5 px-4 font-semibold text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No transactions match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredTransactions.slice(0, 15).map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-4 font-mono font-medium text-slate-900">
                      <div>{t.id}</div>
                      <div className="text-[10px] text-slate-500">{t.receiptNumber}</div>
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                          t.destination === "CASH"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {t.type === "PAYMENT" ? t.destination : t.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="font-semibold text-slate-900">{t.applicantRef}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">
                        {t.description}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                      {currency} {t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {t.recordedBy?.name || "Staff"}
                    </td>
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
                    <td className="py-2.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(t.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <button
                        onClick={() => onSelectReceipt(t)}
                        title="View Official Receipt"
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
