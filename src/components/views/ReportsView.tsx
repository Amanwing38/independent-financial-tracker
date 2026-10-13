"use client";

import React, { useState, useEffect } from "react";
import { Download, BarChart3, Users, CheckCircle2 } from "lucide-react";
import { FinancialSummary } from "@/lib/financials";

interface ReportsViewProps {
  summary: FinancialSummary | null;
  refreshKey: number;
}

export default function ReportsView({ summary, refreshKey }: ReportsViewProps) {
  const [timeframe, setTimeframe] = useState<"daily" | "monthly" | "yearly">("daily");
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [timeframe, refreshKey]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?timeframe=${timeframe}`);
      const data = await res.json();
      if (res.ok) {
        setReportData(data);
      }
    } catch {
      console.error("Failed to fetch report data");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    window.location.href = `/api/reports?timeframe=${timeframe}&format=csv`;
  };

  if (!summary) return null;
  const currency = summary.currency || "ETB";

  // Check mathematical reconciliation:
  const computedCash = summary.cashOpeningBalance + summary.totalCashIncome - summary.totalInternalTransfers;
  const computedBank = summary.bankOpeningBalance + summary.totalBankIncome + summary.totalInternalTransfers;
  const isCashReconciled = Math.abs(computedCash - summary.currentCashBalance) < 0.01;
  const isBankReconciled = Math.abs(computedBank - summary.currentBankBalance) < 0.01;

  return (
    <div className="space-y-6">
      {/* Top Banner & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <BarChart3 className="w-4 h-4" />
            Financial Audit & Reconciliation Reports
          </div>
          <h2 className="text-3xl font-extrabold font-mono mt-1">
            Reconciliation Desk
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Structured financial reporting with separate registers, staff activity, and CSV export
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Timeframe Switcher */}
          <div className="flex items-center bg-slate-800 p-1 rounded-lg text-xs">
            <button
              onClick={() => setTimeframe("daily")}
              className={`px-3 py-1.5 rounded-md font-semibold transition ${
                timeframe === "daily" ? "bg-blue-600 text-white" : "text-slate-300 hover:text-white"
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setTimeframe("monthly")}
              className={`px-3 py-1.5 rounded-md font-semibold transition ${
                timeframe === "monthly" ? "bg-blue-600 text-white" : "text-slate-300 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setTimeframe("yearly")}
              className={`px-3 py-1.5 rounded-md font-semibold transition ${
                timeframe === "yearly" ? "bg-blue-600 text-white" : "text-slate-300 hover:text-white"
              }`}
            >
              Yearly
            </button>
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Reconciliation Integrity Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Double-Entry Register Mathematical Reconciliation
            </h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            {isCashReconciled && isBankReconciled ? "100% BALANCED & RECONCILED" : "AUDIT DISCREPANCY"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Cash Register Formula */}
          <div className="p-4 bg-emerald-50/50 rounded-lg border border-emerald-200 space-y-2">
            <div className="font-bold text-emerald-950 uppercase text-[11px]">
              Cash Register Equation
            </div>
            <div className="flex justify-between text-slate-600">
              <span>(+) Cash Opening Balance:</span>
              <span className="font-mono">{currency} {summary.cashOpeningBalance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-emerald-700">
              <span>(+) Cash Applicant Payments:</span>
              <span className="font-mono">+{currency} {summary.totalCashIncome.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-rose-700">
              <span>(-) Internal Cash Deposited to Bank:</span>
              <span className="font-mono">-{currency} {summary.totalInternalTransfers.toFixed(2)}</span>
            </div>
            <div className="border-t border-emerald-200 pt-2 flex justify-between font-bold text-emerald-950 text-sm">
              <span>Current Cash Balance:</span>
              <span className="font-mono">{currency} {summary.currentCashBalance.toFixed(2)}</span>
            </div>
          </div>

          {/* Bank Register Formula */}
          <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-200 space-y-2">
            <div className="font-bold text-blue-950 uppercase text-[11px]">
              Bank Register Equation
            </div>
            <div className="flex justify-between text-slate-600">
              <span>(+) Bank Opening Balance:</span>
              <span className="font-mono">{currency} {summary.bankOpeningBalance.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-blue-700">
              <span>(+) Bank Applicant Payments:</span>
              <span className="font-mono">+{currency} {summary.totalBankIncome.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-emerald-700">
              <span>(+) Internal Cash Deposits Credited:</span>
              <span className="font-mono">+{currency} {summary.totalInternalTransfers.toFixed(2)}</span>
            </div>
            <div className="border-t border-blue-200 pt-2 flex justify-between font-bold text-blue-950 text-sm">
              <span>Current Bank Balance:</span>
              <span className="font-mono">{currency} {summary.currentBankBalance.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Period Breakdown Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900">
            {timeframe.charAt(0).toUpperCase() + timeframe.slice(1)} Performance Breakdown
          </h3>
          <p className="text-xs text-slate-500">
            Financial totals broken down by period with independent cash and bank segregation
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="py-2.5 px-4 font-semibold">Period</th>
                <th className="py-2.5 px-4 font-semibold text-right">Cash Collections</th>
                <th className="py-2.5 px-4 font-semibold text-right">Bank Collections</th>
                <th className="py-2.5 px-4 font-semibold text-right">Total Applicant Income</th>
                <th className="py-2.5 px-4 font-semibold text-right">Internal Transfers</th>
                <th className="py-2.5 px-4 font-semibold text-center">Txn Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading report breakdown...
                  </td>
                </tr>
              ) : !reportData || reportData.periodBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No records found for this period.
                  </td>
                </tr>
              ) : (
                reportData.periodBreakdown.map((p: any) => (
                  <tr key={p.period} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{p.period}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-medium text-emerald-700">
                      {currency} {p.cashIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-medium text-blue-700">
                      {currency} {p.bankIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                      {currency}{" "}
                      {p.totalApplicantIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-600">
                      {currency}{" "}
                      {p.transfersOutCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-4 text-center font-semibold text-slate-700">
                      {p.transactionCount}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Staff Activity & Performance */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-700" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">Staff Collection & Activity Breakdown</h3>
            <p className="text-xs text-slate-500">
              Tracking applicant payments recorded by individual front-desk staff members
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="py-2.5 px-4 font-semibold">Staff Member</th>
                <th className="py-2.5 px-4 font-semibold text-center">Cash Txns</th>
                <th className="py-2.5 px-4 font-semibold text-right">Cash Collected</th>
                <th className="py-2.5 px-4 font-semibold text-center">Bank Txns</th>
                <th className="py-2.5 px-4 font-semibold text-right">Bank Collected</th>
                <th className="py-2.5 px-4 font-semibold text-right">Total Staff Collections</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading staff activity...
                  </td>
                </tr>
              ) : !reportData || reportData.staffBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No staff records recorded yet.
                  </td>
                </tr>
              ) : (
                reportData.staffBreakdown.map((s: any) => (
                  <tr key={s.staffId} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{s.staffName}</td>
                    <td className="py-2.5 px-4 text-center">{s.cashCount}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-emerald-700">
                      {currency} {s.cashAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-4 text-center">{s.bankCount}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-blue-700">
                      {currency} {s.bankAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                      {currency} {s.totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
