"use client";

import React, { useState, useEffect } from "react";
import { Users, UserPlus, CheckCircle, XCircle, AlertCircle, Shield } from "lucide-react";

interface StaffViewProps {
  userRole: "OWNER" | "STAFF";
  refreshKey: number;
}

export default function StaffView({ userRole, refreshKey }: StaffViewProps) {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // New Staff Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchStaff();
  }, [refreshKey]);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/staff");
      const data = await res.json();
      if (res.ok) {
        setStaffList(data.staff || []);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Failed to load staff accounts");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role: "STAFF" }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create staff account.");
      } else {
        setSuccess(`Staff account for ${name} created successfully.`);
        setName("");
        setEmail("");
        setPassword("");
        fetchStaff();
      }
    } catch {
      setError("Server error creating staff account.");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (user: any) => {
    setError(null);
    setSuccess(null);
    const newStatus = !user.isActive;

    try {
      const res = await fetch(`/api/staff/${user.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newStatus }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to update account status.");
      } else {
        setSuccess(`Account ${user.email} is now ${newStatus ? "ACTIVE" : "DISABLED"}.`);
        fetchStaff();
      }
    } catch {
      setError("Server error updating account status.");
    }
  };

  if (userRole !== "OWNER") {
    return (
      <div className="p-8 text-center text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
        Access Denied: Only the Agency Owner has access to staff management.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider">
            <Users className="w-4 h-4" />
            Staff & Cashier Access Control
          </div>
          <h2 className="text-3xl font-extrabold font-mono mt-1">
            {staffList.length} Registered Accounts
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Create front-desk accounts, toggle login access, and review payment activity
          </p>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex items-start gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Create Staff Form Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-4">
          <UserPlus className="w-4 h-4 text-slate-700" />
          <h3 className="text-sm font-bold text-slate-900">Create New Staff / Cashier Account</h3>
        </div>

        <form onSubmit={handleCreateStaff} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Tigist Wolde"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              placeholder="e.g. tigist@tracker.local"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Initial Password (min 8 chars) *
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={creating}
              className="w-full py-2 px-4 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              {creating ? "Creating..." : "Add Staff Account"}
            </button>
          </div>
        </form>
      </div>

      {/* Staff Accounts List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900">System Users & Roles</h3>
          <p className="text-xs text-slate-500">
            Enforced server-side permissions: Staff can record and view permitted transactions but cannot modify audits or close periods
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="py-2.5 px-4 font-semibold">Name</th>
                <th className="py-2.5 px-4 font-semibold">Email</th>
                <th className="py-2.5 px-4 font-semibold">Role</th>
                <th className="py-2.5 px-4 font-semibold text-center">Transactions Recorded</th>
                <th className="py-2.5 px-4 font-semibold">Account Status</th>
                <th className="py-2.5 px-4 font-semibold text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading accounts...
                  </td>
                </tr>
              ) : (
                staffList.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-4 font-bold text-slate-900">{u.name}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-700">{u.email}</td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          u.role === "OWNER"
                            ? "bg-purple-100 text-purple-800 border border-purple-200"
                            : "bg-blue-100 text-blue-800 border border-blue-200"
                        }`}
                      >
                        {u.role === "OWNER" && <Shield className="w-3 h-3 text-purple-700" />}
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center font-bold text-slate-800">
                      {u._count?.transactions || 0}
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                          u.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {u.isActive ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-rose-600" />
                            Disabled
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {u.role === "OWNER" ? (
                        <span className="text-[10px] text-slate-400 font-medium">Primary Owner</span>
                      ) : (
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`px-2 py-1 rounded text-[10px] font-bold transition shadow-xs ${
                            u.isActive
                              ? "bg-rose-100 hover:bg-rose-200 text-rose-800"
                              : "bg-emerald-100 hover:bg-emerald-200 text-emerald-800"
                          }`}
                        >
                          {u.isActive ? "Disable Access" : "Enable Access"}
                        </button>
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
