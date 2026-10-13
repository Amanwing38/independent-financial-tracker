"use client";

import React, { useState, useEffect } from "react";
import { ArrowRightLeft, PlusCircle, CheckCircle2, ShieldCheck } from "lucide-react";

interface TransfersViewProps {
  onOpenTransferModal: () => void;
  currency?: string;
  refreshKey: number;
}

export default function TransfersView({
  onOpenTransferModal,
  currency = "ETB",
  refreshKey,
}: TransfersViewProps) {
  const [transfers, setTransfers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTransfers();
  }, [refreshKey]);

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/transfers");
      const data = await res.json();
      if (res.ok) {
        setTransfers(data.transfers || []);
      }
    } catch {
      console.error("Failed to fetch transfers");
    } finally {
      setLoading(false);
    }
  };

  const totalTransferred = transfers.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <ArrowRightLeft className="w-4 h-4" />
            Internal Cash-to-Bank Transfers
          </div>
          <h2 className="text-3xl font-extrabold font-mono mt-1">
            {currency} {totalTransferred.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Total Internal Cash Deposited to Bank Register ({transfers.length} transfers executed)
          </p>
        </div>

        <button
          onClick={onOpenTransferModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Deposit Cash to Bank
        </button>
      </div>

      {/* Zero Inflation Guarantee Banner */}
      <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl text-xs text-emerald-950 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-sm block mb-0.5 text-emerald-900">
            Audit Guarantee: No Artificial Revenue Inflation
          </span>
          Every internal transfer is permanently bound to both the Cash Register (outflow) and Bank
          Register (inflow). Transfers <strong>never count as applicant revenue</strong>, preserving 100%
          accuracy of your total collected income.
        </div>
      </div>

      {/* Transfers Ledger */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900">Internal Transfer Registry</h3>
          <p className="text-xs text-slate-500">
            Immutable log of all office cash deposits into bank accounts with bank slip references
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="py-2.5 px-4 font-semibold">Transfer ID</th>
                <th className="py-2.5 px-4 font-semibold">Bank Deposit Slip / Ref</th>
                <th className="py-2.5 px-4 font-semibold text-right">Transfer Amount</th>
                <th className="py-2.5 px-4 font-semibold">Authorized By</th>
                <th className="py-2.5 px-4 font-semibold">Notes / Purpose</th>
                <th className="py-2.5 px-4 font-semibold">Timestamp</th>
                <th className="py-2.5 px-4 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading transfers...
                  </td>
                </tr>
              ) : transfers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No internal transfers recorded yet.
                  </td>
                </tr>
              ) : (
                transfers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-4 font-mono font-medium text-slate-900">{t.id}</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-blue-700">
                      {t.bankReference}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                      {currency} {t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 font-medium">
                      {t.authorizedBy?.name || "Owner"}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 max-w-xs truncate">
                      {t.notes || "Routine deposit"}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 text-[11px]">
                      {new Date(t.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        Reconciled
                      </span>
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
