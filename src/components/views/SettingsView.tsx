"use client";

import React, { useState } from "react";
import { Settings, Save, Database, ShieldCheck, CheckCircle, AlertCircle } from "lucide-react";

interface SettingsViewProps {
  agencyName: string;
  currency: string;
  onUpdateSettings: (newName: string, newCurr: string) => Promise<boolean>;
  userRole: "OWNER" | "STAFF";
}

export default function SettingsView({
  agencyName,
  currency,
  onUpdateSettings,
  userRole,
}: SettingsViewProps) {
  const [nameInput, setNameInput] = useState(agencyName);
  const [currInput, setCurrInput] = useState(currency);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (userRole !== "OWNER") {
    return (
      <div className="p-8 text-center text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
        Access Denied: Settings are restricted to the Agency Owner.
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!nameInput.trim() || nameInput.trim().length < 3) {
      setError("Agency name must be at least 3 characters.");
      return;
    }

    setSaving(true);
    const ok = await onUpdateSettings(nameInput, currInput);
    setSaving(false);

    if (ok) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError("Failed to save settings.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
          <Settings className="w-4 h-4" />
          Agency Configuration & System Operations
        </div>
        <h2 className="text-3xl font-extrabold font-mono mt-1">Agency Settings</h2>
        <p className="text-xs text-slate-300 mt-1">
          Customize receipt header names, currency symbols, and review standalone database backup procedures
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex items-start gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>Agency settings updated and reflected on all receipts!</span>
        </div>
      )}

      {/* Agency Name & Currency Form */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Receipt & Display Configuration</h3>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Agency Name (Printed on all Receipts) *
            </label>
            <input
              type="text"
              required
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Label DEMO DATA clearly in the title for testing.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Operating Currency Symbol / Code *
            </label>
            <input
              type="text"
              required
              value={currInput}
              onChange={(e) => setCurrInput(e.target.value)}
              className="w-32 px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono font-bold uppercase"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-bold transition shadow-xs"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving Changes..." : "Save Agency Settings"}
          </button>
        </form>
      </div>

      {/* Documented Backup & Restore Procedure */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <Database className="w-5 h-5 text-slate-700" />
          <h3 className="text-sm font-bold text-slate-900">
            Documented Database Backup & Restore Procedure
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* SQLite Local Dev Backup */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <div className="font-bold text-slate-900 uppercase">
              1. Local SQLite Backup (Development)
            </div>
            <p className="text-slate-600">
              The local database file is stored safely at: <br />
              <code className="text-[11px] bg-slate-200 px-1 py-0.5 rounded font-mono">
                prisma/dev.db
              </code>
            </p>
            <div className="font-semibold text-slate-700 mt-2">To Backup:</div>
            <pre className="bg-slate-900 text-slate-100 p-2.5 rounded font-mono text-[11px] overflow-x-auto">
              Copy-Item prisma\dev.db prisma\backup_$(Get-Date -f yyyyMMdd_HHmmss).db
            </pre>
            <div className="font-semibold text-slate-700 mt-2">To Restore:</div>
            <pre className="bg-slate-900 text-slate-100 p-2.5 rounded font-mono text-[11px] overflow-x-auto">
              Copy-Item prisma\backup_YYYYMMDD.db prisma\dev.db
            </pre>
          </div>

          {/* Standalone PostgreSQL Production Migration Path */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <div className="font-bold text-slate-900 uppercase">
              2. Production PostgreSQL Path
            </div>
            <p className="text-slate-600">
              This application has a direct, zero-code-change path to a standalone PostgreSQL database.
            </p>
            <div className="font-semibold text-slate-700 mt-2">Migration Steps:</div>
            <ol className="list-decimal pl-4 space-y-1 text-slate-600">
              <li>
                In <code className="bg-slate-200 px-1 rounded font-mono">prisma/schema.prisma</code>, change{" "}
                <code className="font-mono">provider = "sqlite"</code> to{" "}
                <code className="font-mono">provider = "postgresql"</code>.
              </li>
              <li>
                In <code className="bg-slate-200 px-1 rounded font-mono">.env</code>, set:{" "}
                <code className="font-mono">
                  DATABASE_URL="postgresql://user:pass@host:5432/financial_tracker"
                </code>
              </li>
              <li>
                Run: <code className="font-mono bg-slate-200 px-1">npx prisma db push</code> or{" "}
                <code className="font-mono bg-slate-200 px-1">npx prisma migrate deploy</code>
              </li>
            </ol>
            <div className="font-semibold text-slate-700 mt-2">PostgreSQL Automated Backup:</div>
            <pre className="bg-slate-900 text-slate-100 p-2.5 rounded font-mono text-[11px] overflow-x-auto">
              pg_dump -U user -d financial_tracker &gt; backup.sql
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
