"use client";

import React, { useState } from "react";
import { X, ArrowRightLeft, AlertCircle, CheckCircle } from "lucide-react";

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentCashBalance: number;
  currency?: string;
}

export default function TransferModal({
  isOpen,
  onClose,
  onSuccess,
  currentCashBalance,
  currency = "ETB",
}: TransferModalProps) {
  const [amount, setAmount] = useState("");
  const [bankReference, setBankReference] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError("Please enter a valid transfer amount greater than 0.");
      return;
    }

    if (numericAmount > currentCashBalance) {
      setError(
        `Insufficient cash. Maximum cash available in register is ${currency} ${currentCashBalance.toLocaleString()}.`
      );
      return;
    }

    if (!bankReference.trim() || bankReference.trim().length < 3) {
      setError("A valid bank deposit slip / reference number is required.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numericAmount,
          bankReference: bankReference.trim(),
          notes: notes.trim() || "Cash deposited to bank commercial account [DEMO DATA]",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to execute transfer.");
        setLoading(false);
        return;
      }

      setAmount("");
      setBankReference("");
      setNotes("");
      setLoading(false);
      onSuccess();
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
            <span className="text-xs font-semibold uppercase tracking-wider bg-amber-500 text-slate-950 px-2 py-0.5 rounded">
              DEMO DATA
            </span>
            <div className="flex items-center gap-1.5 font-semibold text-base">
              <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
              Internal Cash-to-Bank Transfer
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transfer Rule Notice */}
        <div className="bg-blue-50 border-b border-blue-100 p-4 text-xs text-blue-900 flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">CRITICAL BALANCE RULE:</span> This operation transfers existing
            funds from the Cash Register into the Bank Register. It{" "}
            <span className="font-bold underline">does not</span> create new applicant payment income or
            inflate total collections.
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Available Cash Banner */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
            <span className="text-slate-600">Current Cash In Register:</span>
            <span className="font-bold text-slate-900 font-mono">
              {currency} {currentCashBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Deposit Amount to Transfer ({currency}) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
                {currency}
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={currentCashBalance}
                required
                placeholder="e.g. 5000.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-14 pr-4 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
          </div>

          {/* Deposit Slip / Bank Reference */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Bank Deposit Slip Number / Bank Reference *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. CBE-DEP-SLIP-49102"
              value={bankReference}
              onChange={(e) => setBankReference(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Provide the verified deposit slip or electronic transfer confirmation.
            </p>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Transfer Purpose / Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Routine end-of-week excess physical cash banking to CBE commercial account"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Balance Preview */}
          {parseFloat(amount) > 0 && !isNaN(parseFloat(amount)) && (
            <div className="p-3 bg-slate-100 rounded-lg text-xs space-y-1">
              <div className="font-semibold text-slate-700">Projected Register Changes:</div>
              <div className="flex justify-between text-rose-700">
                <span>Cash Register:</span>
                <span className="font-mono">-{currency} {parseFloat(amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Bank Register:</span>
                <span className="font-mono">+{currency} {parseFloat(amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600 border-t border-slate-200 pt-1">
                <span>Net Total Applicant Income:</span>
                <span className="font-mono font-bold">Unchanged (ETB 0.00 added)</span>
              </div>
            </div>
          )}

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
              disabled={loading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-lg text-sm font-semibold transition"
            >
              {loading ? "Processing Transfer..." : "Authorize Internal Transfer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
