"use client";

import React from "react";
import {
  Wallet,
  Building,
  ArrowRightLeft,
  ShieldCheck,
  BarChart3,
  Users,
  History,
  Settings,
  LogOut,
  PlusCircle,
  LayoutDashboard,
} from "lucide-react";

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  user: {
    name: string;
    email: string;
    role: "OWNER" | "STAFF";
  };
  agencyName: string;
  onLogout: () => void;
  onOpenPaymentModal: (dest?: "CASH" | "BANK") => void;
  onOpenTransferModal: () => void;
  onOpenVerificationModal: (reg?: "CASH" | "BANK") => void;
}

export default function Navbar({
  currentTab,
  setCurrentTab,
  user,
  agencyName,
  onLogout,
  onOpenPaymentModal,
  onOpenTransferModal,
  onOpenVerificationModal,
}: NavbarProps) {
  const isOwner = user.role === "OWNER";

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs print:hidden">
      {/* Top Demo Banner */}
      <div className="bg-amber-500 text-slate-950 px-4 py-1 text-xs font-bold tracking-wide flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="bg-slate-950 text-white px-2 py-0.5 rounded text-[10px] font-black uppercase">
            DEMO DATA MODE
          </span>
          <span>INDEPENDENT FINANCIAL TRACKER — STANDALONE AGENCY SYSTEM</span>
        </div>
        <div className="text-[11px] font-medium opacity-90 hidden sm:block">
          All records shown are demonstration data only
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Agency Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-lg shadow-xs">
              IFT
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-tight">
                {agencyName}
              </h1>
              <p className="text-[11px] text-slate-500">
                Independent Financial Desk
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenPaymentModal("CASH")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Record Payment</span>
            </button>

            <button
              onClick={onOpenTransferModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cash to Bank</span>
            </button>

            {isOwner && (
              <button
                onClick={() => onOpenVerificationModal("CASH")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Verify Closing</span>
              </button>
            )}

            {/* User Profile & Logout */}
            <div className="flex items-center gap-2 pl-3 ml-2 border-l border-slate-200">
              <div className="text-right hidden md:block">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {user.name}
                </div>
                <div className="flex items-center justify-end gap-1 mt-0.5">
                  <span
                    className={`text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                      isOwner
                        ? "bg-purple-100 text-purple-800 border border-purple-200"
                        : "bg-blue-100 text-blue-800 border border-blue-200"
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
              </div>
              <button
                onClick={onLogout}
                title="Sign Out"
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 overflow-x-auto border-t border-slate-100 py-2">
          <button
            onClick={() => setCurrentTab("dashboard")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition ${
              currentTab === "dashboard"
                ? "bg-slate-900 text-white font-semibold"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Dashboard
          </button>

          <button
            onClick={() => setCurrentTab("cash")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition ${
              currentTab === "cash"
                ? "bg-emerald-700 text-white font-semibold"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            Cash Register
          </button>

          <button
            onClick={() => setCurrentTab("bank")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition ${
              currentTab === "bank"
                ? "bg-blue-700 text-white font-semibold"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            Bank Register
          </button>

          <button
            onClick={() => setCurrentTab("transfers")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition ${
              currentTab === "transfers"
                ? "bg-slate-900 text-white font-semibold"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Transfers
          </button>

          <button
            onClick={() => setCurrentTab("verifications")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition ${
              currentTab === "verifications"
                ? "bg-slate-900 text-white font-semibold"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Verifications
          </button>

          <button
            onClick={() => setCurrentTab("reports")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition ${
              currentTab === "reports"
                ? "bg-slate-900 text-white font-semibold"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Reports & Reconciliation
          </button>

          {/* Owner Only Tabs */}
          {isOwner && (
            <>
              <button
                onClick={() => setCurrentTab("staff")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition ${
                  currentTab === "staff"
                    ? "bg-slate-900 text-white font-semibold"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Staff Management
              </button>

              <button
                onClick={() => setCurrentTab("audit")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition ${
                  currentTab === "audit"
                    ? "bg-slate-900 text-white font-semibold"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <History className="w-3.5 h-3.5" />
                Audit Trail
              </button>

              <button
                onClick={() => setCurrentTab("settings")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition ${
                  currentTab === "settings"
                    ? "bg-slate-900 text-white font-semibold"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                Agency Settings
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
