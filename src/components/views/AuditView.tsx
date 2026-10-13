"use client";

import React, { useState, useEffect } from "react";
import { History, Shield, Filter, Search } from "lucide-react";

interface AuditViewProps {
  userRole: "OWNER" | "STAFF";
  refreshKey: number;
}

export default function AuditView({ userRole, refreshKey }: AuditViewProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [entityFilter, setEntityFilter] = useState("ALL");

  useEffect(() => {
    fetchLogs();
  }, [refreshKey]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/audit");
      const data = await res.json();
      if (res.ok) {
        setLogs(data.logs || []);
      }
    } catch {
      console.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  if (userRole !== "OWNER") {
    return (
      <div className="p-8 text-center text-rose-600 bg-rose-50 rounded-xl border border-rose-200">
        Access Denied: Audit trail inspection is strictly restricted to the Agency Owner.
      </div>
    );
  }

  const filteredLogs = logs.filter((l) => {
    const matchesEntity = entityFilter === "ALL" || l.entityType === entityFilter;
    const matchesSearch =
      searchTerm === "" ||
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.performedByName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.entityId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.details.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesEntity && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
          <History className="w-4 h-4" />
          Immutable Financial Audit Trail
        </div>
        <h2 className="text-3xl font-extrabold font-mono mt-1">
          {logs.length} Audit Events Recorded
        </h2>
        <p className="text-xs text-slate-300 mt-1">
          Permanently preserved event stream. Logs cannot be modified, edited, or deleted by any user or API request.
        </p>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Security & Operational Audit Log</h3>
            <p className="text-xs text-slate-500">
              Complete accountability record of all financial changes and user actions
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search audit trail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-blue-500 w-44"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs">
              <Filter className="w-3 h-3 text-slate-500 ml-1.5" />
              <button
                onClick={() => setEntityFilter("ALL")}
                className={`px-2 py-1 rounded text-xs font-medium transition ${
                  entityFilter === "ALL" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setEntityFilter("TRANSACTION")}
                className={`px-2 py-1 rounded text-xs font-medium transition ${
                  entityFilter === "TRANSACTION" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                }`}
              >
                Txn
              </button>
              <button
                onClick={() => setEntityFilter("TRANSFER")}
                className={`px-2 py-1 rounded text-xs font-medium transition ${
                  entityFilter === "TRANSFER" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                }`}
              >
                Transfer
              </button>
              <button
                onClick={() => setEntityFilter("VERIFICATION")}
                className={`px-2 py-1 rounded text-xs font-medium transition ${
                  entityFilter === "VERIFICATION" ? "bg-white text-slate-900 shadow-xs" : "text-slate-600"
                }`}
              >
                Verification
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="py-2.5 px-4 font-semibold">Action</th>
                <th className="py-2.5 px-4 font-semibold">Target Entity</th>
                <th className="py-2.5 px-4 font-semibold">Performed By</th>
                <th className="py-2.5 px-4 font-semibold">Role</th>
                <th className="py-2.5 px-4 font-semibold">Details / Payload</th>
                <th className="py-2.5 px-4 font-semibold">Server Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading audit stream...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No audit records match query.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-4">
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                        {l.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-700">
                      <div>{l.entityType}</div>
                      <div className="text-[10px] text-slate-400">{l.entityId}</div>
                    </td>
                    <td className="py-2.5 px-4 font-medium text-slate-900">{l.performedByName}</td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold uppercase ${
                          l.performedByRole === "OWNER"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {l.performedByRole}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-[11px] text-slate-600 max-w-sm truncate">
                      {l.details}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(l.createdAt).toLocaleString()}
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
