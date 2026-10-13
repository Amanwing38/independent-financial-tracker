"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, PlusCircle, AlertTriangle, CheckCircle2 } from "lucide-react";

interface VerificationsViewProps {
  onOpenVerificationModal: (reg?: "CASH" | "BANK") => void;
  onResolveDiscrepancy: (session: any) => void;
  userRole: "OWNER" | "STAFF";
  currency?: string;
  refreshKey: number;
}

export default function VerificationsView({
  onOpenVerificationModal,
  onResolveDiscrepancy,
  userRole,
  currency = "ETB",
  refreshKey,
}: VerificationsViewProps) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, [refreshKey]);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/verifications");
      const data = await res.json();
      if (res.ok) {
        setSessions(data.sessions || []);
      }
    } catch {
      console.error("Failed to fetch verification sessions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            Collection Verifications & Closing Log
          </div>
          <h2 className="text-3xl font-extrabold font-mono mt-1">
            {sessions.length} Closed Sessions
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Formal owner physical counts, bank statement audits, and discrepancy resolutions
          </p>
        </div>

        {userRole === "OWNER" && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenVerificationModal("CASH")}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              Verify Cash
            </button>
            <button
              onClick={() => onOpenVerificationModal("BANK")}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              Verify Bank
            </button>
          </div>
        )}
      </div>

      {/* Critical Balance Rule Explanation Banner */}
      <div className="bg-amber-50/70 border border-amber-200/80 p-4 rounded-xl text-xs text-amber-950 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-sm block mb-0.5 text-amber-900">
            Important Financial Integrity Rule
          </span>
          Verification closes the pending collection period and clears the unverified counter. It{" "}
          <span className="font-bold underline">never resets</span> the running cash balance or bank
          balance to zero, and is <span className="font-bold underline">never treated as new income</span>.
        </div>
      </div>

      {/* Sessions Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900">Verification & Period Closing Records</h3>
          <p className="text-xs text-slate-500">
            Recorded audit of physical counts, verified bank credits, and authorized explanations
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="py-2.5 px-4 font-semibold">Session ID</th>
                <th className="py-2.5 px-4 font-semibold">Register</th>
                <th className="py-2.5 px-4 font-semibold text-right">Expected Recorded</th>
                <th className="py-2.5 px-4 font-semibold text-right">Owner Verified</th>
                <th className="py-2.5 px-4 font-semibold text-right">Discrepancy</th>
                <th className="py-2.5 px-4 font-semibold">Status</th>
                <th className="py-2.5 px-4 font-semibold">Verified By & Timestamp</th>
                <th className="py-2.5 px-4 font-semibold">Notes / Explanation</th>
                <th className="py-2.5 px-4 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Loading sessions...
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No verification sessions closed yet.
                  </td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-4 font-mono font-medium text-slate-900">{s.id}</td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                          s.registerType === "CASH"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {s.registerType}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-700">
                      {currency} {s.expectedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                      {currency} {s.verifiedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold">
                      {s.discrepancy === 0 ? (
                        <span className="text-emerald-700">0.00</span>
                      ) : (
                        <span className="text-rose-700">
                          {s.discrepancy > 0 ? "+" : ""}
                          {currency} {s.discrepancy.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                          s.status === "VERIFIED"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : s.status === "RESOLVED"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {s.status === "FLAGGED" && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                        {s.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">
                      <div>{s.verifiedBy?.name || "Owner"}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(s.createdAt).toLocaleString()}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 max-w-xs text-[11px]">
                      {s.discrepancyReason && (
                        <div className="text-rose-700 font-medium">Reason: {s.discrepancyReason}</div>
                      )}
                      {s.resolutionNotes && (
                        <div className="text-emerald-700 font-medium mt-0.5">
                          Resolution: {s.resolutionNotes}
                        </div>
                      )}
                      {s.notes && <div className="text-slate-500">{s.notes}</div>}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {s.status === "FLAGGED" && userRole === "OWNER" ? (
                        <button
                          onClick={() => onResolveDiscrepancy(s)}
                          className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-[10px] font-bold transition shadow-xs"
                        >
                          Resolve
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Closed</span>
                      )}
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
