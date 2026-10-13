"use client";

import React, { useState } from "react";
import { X, DollarSign, Building, AlertCircle } from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (txn: any) => void;
  currency?: string;
  defaultDestination?: "CASH" | "BANK";
}

export default function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
  currency = "ETB",
  defaultDestination = "CASH",
}: PaymentModalProps) {
  const [destination, setDestination] = useState<"CASH" | "BANK">(defaultDestination);
  const [amount, setAmount] = useState("");
  const [applicantRef, setApplicantRef] = useState("");
  const [description, setDescription] = useState("");
  const [depositReference, setDepositReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError("Please enter a valid amount greater than zero.");
      return;
    }

    if (!applicantRef.trim() || applicantRef.trim().length < 3) {
      setError("Applicant reference is required (e.g. APP-88219 - Demo Name).");
      return;
    }

    if (!description.trim() || description.trim().length < 3) {
      setError("Payment description is required (e.g. Agency fee deposit).");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination,
          amount: numericAmount,
          applicantRef: `${applicantRef.trim()} [DEMO DATA]`,
          description: `${description.trim()} [DEMO DATA]`,
          depositReference: destination === "BANK" ? depositReference.trim() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to record payment.");
        setLoading(false);
        return;
      }

      // Reset form
      setAmount("");
      setApplicantRef("");
      setDescription("");
      setDepositReference("");
      setLoading(false);
      onSuccess(data.transaction);
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
            <h2 className="font-semibold text-base">Record Applicant Payment</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Payment Destination Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Payment Destination Account
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDestination("CASH")}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 text-sm font-semibold transition ${
                  destination === "CASH"
                    ? "border-emerald-600 bg-emerald-50/50 text-emerald-900 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 text-slate-600 bg-white"
                }`}
              >
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Cash Register
              </button>
              <button
                type="button"
                onClick={() => setDestination("BANK")}
                className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 text-sm font-semibold transition ${
                  destination === "BANK"
                    ? "border-blue-600 bg-blue-50/50 text-blue-900 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 text-slate-600 bg-white"
                }`}
              >
                <Building className="w-4 h-4 text-blue-600" />
                Bank Register
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {destination === "CASH"
                ? "Physical cash collected on-site. Added to office Cash Register."
                : "Direct bank deposit or bank transfer. Added to commercial Bank Register."}
            </p>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Amount ({currency}) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
                {currency}
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="e.g. 3500.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-14 pr-4 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Applicant Reference */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Applicant Reference / Name (DEMO DATA) *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. APP-94021 - Demo Applicant Abebe"
              value={applicantRef}
              onChange={(e) => setApplicantRef(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-[11px] text-slate-400">
              Only use placeholder/demo applicant references.
            </span>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Purpose / Description *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Application document processing fee"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Bank Slip Reference (if Bank selected) */}
          {destination === "BANK" && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bank Deposit Slip / Reference Number (Recommended for Bank)
              </label>
              <input
                type="text"
                placeholder="e.g. CBE-SLIP-849201"
                value={depositReference}
                onChange={(e) => setDepositReference(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>
          )}

          {/* Submit Buttons */}
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
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-sm font-semibold transition flex items-center gap-2"
            >
              {loading ? "Recording on Server..." : "Confirm & Issue Receipt"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
