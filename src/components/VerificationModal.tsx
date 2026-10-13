"use client";

import React, { useState } from "react";
import { X, CheckCircle2, AlertTriangle, ShieldCheck, DollarSign, Building } from "lucide-react";

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (session: any) => void;
  currency?: string;
  defaultRegister?: "CASH" | "BANK";
  pendingCashAmount: number;
  pendingBankAmount: number;
  pendingCashCount: number;
  pendingBankCount: number;
}

export default function VerificationModal({
  isOpen,
  onClose,
  onSuccess,
  currency = "ETB",
  defaultRegister = "CASH",
  pendingCashAmount,
  pendingBankAmount,
  pendingCashCount,
  pendingBankCount,
}: VerificationModalProps) {
  const [registerType, setRegisterType] = useState<"CASH" | "BANK">(defaultRegister);
  const [verifiedAmount, setVerifiedAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [discrepancyReason, setDiscrepancyReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const expectedAmount = registerType === "CASH" ? pendingCashAmount : pendingBankAmount;
  const pendingCount = registerType === "CASH" ? pendingCashCount : pendingBankCount;

  const numericVerified = parseFloat(verifiedAmount);
  const hasEnteredAmount = !isNaN(numericVerified);
  const discrepancy = hasEnteredAmount ? numericVerified - expectedAmount : 0;
  const hasDiscrepancy = hasEnteredAmount && Math.abs(discrepancy) > 0.001;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isNaN(numericVerified) || numericVerified < 0) {
      setError("Please enter a valid verified amount.");
      return;
    }

    if (hasDiscrepancy && (!discrepancyReason.trim() || discrepancyReason.trim().length < 5)) {
      setError(
        "A discrepancy was detected. You must provide an explanation and authorized reason to proceed."
      );
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/verifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registerType,
          verifiedAmount: numericVerified,
          notes: notes.trim() || null,
          discrepancyReason: hasDiscrepancy ? discrepancyReason.trim() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to verify collection period.");
        setLoading(false);
        return;
      }

      setVerifiedAmount("");
      setNotes("");
      setDiscrepancyReason("");
      setLoading(false);
      onSuccess(data.session);
    } catch {
      setError("Network or server connection error.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="font-semibold text-base leading-tight">
                Owner Collection Verification & Closing
              </h2>
              <span className="text-[10px] text-slate-300 uppercase tracking-wider">
                Restricted to Agency Owner
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Critical Balance Rule Notice */}
        <div className="bg-amber-50/70 border-b border-amber-200/70 p-4 text-xs text-amber-950">
          <div className="font-bold flex items-center gap-1.5 text-amber-900 mb-1">
            <CheckCircle2 className="w-4 h-4 text-amber-700" />
            CRITICAL BALANCE RULE
          </div>
          <p>
            Closing this period will clear the <strong>Pending Collection Counter</strong> for this register.
            It <span className="underline font-bold">does NOT reset the actual running cash or bank balance</span> to zero.
            Existing cumulative account funds remain intact.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-sm flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Register Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Select Register to Verify
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setRegisterType("CASH");
                  setVerifiedAmount("");
                }}
                className={`p-3 rounded-lg border-2 text-left transition ${
                  registerType === "CASH"
                    ? "border-emerald-600 bg-emerald-50/50 text-emerald-950 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 text-slate-600"
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-sm">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  Cash Register
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Pending: {currency} {pendingCashAmount.toLocaleString()} ({pendingCashCount} items)
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setRegisterType("BANK");
                  setVerifiedAmount("");
                }}
                className={`p-3 rounded-lg border-2 text-left transition ${
                  registerType === "BANK"
                    ? "border-blue-600 bg-blue-50/50 text-blue-950 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 text-slate-600"
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-sm">
                  <Building className="w-4 h-4 text-blue-600" />
                  Bank Register
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Pending: {currency} {pendingBankAmount.toLocaleString()} ({pendingBankCount} items)
                </div>
              </button>
            </div>
          </div>

          {/* Expected Collections Breakdown */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>Expected System Recorded Collections:</span>
              <span className="font-semibold text-slate-700">{pendingCount} payments</span>
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {currency} {expectedAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>

          {/* Actual Verified Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {registerType === "CASH"
                ? "Physically Counted Cash on Hand (ETB) *"
                : "Confirmed Bank Statement Balance Credited (ETB) *"}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
                {currency}
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                placeholder="e.g. 5000.00"
                value={verifiedAmount}
                onChange={(e) => setVerifiedAmount(e.target.value)}
                className="w-full pl-14 pr-4 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold"
              />
            </div>
          </div>

          {/* Discrepancy Indicator */}
          {hasEnteredAmount && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                !hasDiscrepancy
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-amber-50 border-amber-300 text-amber-900"
              }`}
            >
              {!hasDiscrepancy ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Perfect Match (Balanced):</span> Physical count matches
                    recorded collections exactly (0.00 discrepancy).
                  </div>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-amber-900">
                      Discrepancy Detected: {discrepancy > 0 ? "+" : ""}
                      {currency} {discrepancy.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div className="mt-0.5 text-amber-800">
                      {discrepancy > 0
                        ? "Physical cash exceeds recorded receipts."
                        : "Shortage: Physical cash is less than recorded receipts."}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Required explanation if discrepancy */}
          {hasDiscrepancy && (
            <div>
              <label className="block text-xs font-bold text-amber-900 mb-1">
                Discrepancy Explanation & Authorized Reason *
              </label>
              <textarea
                rows={2}
                required
                placeholder="e.g. Cash drawer discrepancy explained: 50 ETB change shortage resolved by staff Selamawit..."
                value={discrepancyReason}
                onChange={(e) => setDiscrepancyReason(e.target.value)}
                className="w-full px-3 py-2 border border-amber-300 bg-amber-50/30 rounded-lg text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>
          )}

          {/* General Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Closing Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. End of day formal closing verified by Owner"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || pendingCount === 0}
              className="px-5 py-2 bg-slate-900 hover:bg-black disabled:bg-slate-400 text-white rounded-lg text-sm font-semibold transition"
            >
              {loading ? "Verifying..." : "Verify & Close Period"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
