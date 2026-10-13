"use client";

import React, { useState } from "react";
import { X, CheckCircle, AlertTriangle } from "lucide-react";

interface DiscrepancyModalProps {
  session: any | null;
  onClose: () => void;
  onSuccess: () => void;
  currency?: string;
}

export default function DiscrepancyModal({
  session,
  onClose,
  onSuccess,
  currency = "ETB",
}: DiscrepancyModalProps) {
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!session) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolutionNotes.trim() || resolutionNotes.trim().length < 5) {
      setError("Please provide a thorough resolution explanation (min 5 characters).");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/verifications/${session.id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolutionNotes: resolutionNotes.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to resolve discrepancy.");
        setLoading(false);
        return;
      }

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
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h2 className="font-semibold text-base">Authorize Discrepancy Resolution</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs space-y-1">
            <div className="font-bold text-amber-900">
              Session: {session.id} ({session.registerType} REGISTER)
            </div>
            <div className="flex justify-between text-slate-700">
              <span>Expected Collections:</span>
              <span className="font-mono">{currency} {session.expectedAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>Verified Amount:</span>
              <span className="font-mono">{currency} {session.verifiedAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-amber-900 border-t border-amber-200 pt-1">
              <span>Discrepancy:</span>
              <span className="font-mono">{session.discrepancy > 0 ? "+" : ""}{currency} {session.discrepancy.toFixed(2)}</span>
            </div>
            {session.discrepancyReason && (
              <div className="pt-1 text-slate-600">
                <span className="font-semibold">Initial Reason:</span> {session.discrepancyReason}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Owner Resolution Notes & Final Sign-Off *
            </label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Account adjusted; cashier reimbursed difference or bank slip reconciliation completed and verified."
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

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
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              {loading ? "Resolving..." : "Authorize Resolution"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
