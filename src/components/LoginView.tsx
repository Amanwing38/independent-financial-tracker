"use client";

import React, { useState } from "react";
import { Shield, KeyRound, AlertCircle, ArrowRight, UserCheck } from "lucide-react";

interface LoginViewProps {
  onLoginSuccess: (user: any) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed. Check your credentials.");
        setLoading(false);
        return;
      }

      onLoginSuccess(data.user);
    } catch {
      setError("Network error connecting to the authentication server.");
      setLoading(false);
    }
  };

  const handleQuickLogin = (quickEmail: string, quickPass: string) => {
    setEmail(quickEmail);
    setPassword(quickPass);
    // Instant submission
    setError(null);
    setLoading(true);
    fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: quickEmail, password: quickPass }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          onLoginSuccess(data.user);
        } else {
          setError(data.error || "Login failed");
          setLoading(false);
        }
      })
      .catch(() => {
        setError("Network connection failed");
        setLoading(false);
      });
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
      {/* Demo Badge */}
      <div className="mb-6 bg-amber-500 text-slate-950 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-md">
        DEMO DATA • INDEPENDENT FINANCIAL TRACKER
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-slate-950 p-6 text-white text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center font-black text-xl mx-auto shadow-md">
            IFT
          </div>
          <h1 className="text-xl font-bold mt-3">Independent Financial Tracker</h1>
          <p className="text-xs text-slate-400 mt-1">
            Standalone Financial Management Desk
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Account Email
              </label>
              <input
                type="email"
                required
                placeholder="e.g. owner@tracker.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-sm font-bold transition flex items-center justify-center gap-2 shadow-xs"
            >
              <KeyRound className="w-4 h-4" />
              {loading ? "Authenticating..." : "Sign In to Dashboard"}
            </button>
          </form>

          {/* Quick Demo Credentials Buttons */}
          <div className="pt-4 border-t border-slate-200">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Quick Demo Accounts (Click to test):
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("owner@tracker.local", "OwnerPassword123!")}
                className="w-full p-2.5 text-left rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 transition flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-purple-700" />
                    Agency Owner (Dawit Haile)
                  </div>
                  <div className="text-[10px] text-purple-700">
                    Full registers, collection verifications, staff control, audit trail
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-purple-400 group-hover:text-purple-700 transition" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("staff1@tracker.local", "StaffPassword123!")}
                className="w-full p-2.5 text-left rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 transition flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-blue-700" />
                    Cashier & Staff (Selamawit Tadesse)
                  </div>
                  <div className="text-[10px] text-blue-700">
                    Record applicant payments, print receipts, view register ledgers
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-400 group-hover:text-blue-700 transition" />
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("staff2@tracker.local", "StaffPassword123!")}
                className="w-full p-2.5 text-left rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-slate-700" />
                    Accounts Staff (Yohannes Bekele)
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Record bank deposits, applicant receipts
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
