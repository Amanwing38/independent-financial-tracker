"use client";

import React from "react";
import { Printer, X, CheckCircle, Clock, AlertTriangle } from "lucide-react";

export interface ReceiptData {
  id: string;
  receiptNumber: string;
  destination: "CASH" | "BANK";
  amount: number;
  applicantRef: string;
  description: string;
  depositReference?: string | null;
  recordedBy?: {
    name: string;
    email: string;
  };
  verificationStatus: "PENDING" | "VERIFIED" | "FLAGGED_DISCREPANCY";
  createdAt: string;
  agencyName?: string;
  currency?: string;
}

interface ReceiptModalProps {
  receipt: ReceiptData | null;
  onClose: () => void;
  agencyName?: string;
  currency?: string;
}

export default function ReceiptModal({
  receipt,
  onClose,
  agencyName = "Independent Overseas Agency [DEMO DATA]",
  currency = "ETB",
}: ReceiptModalProps) {
  if (!receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  const isVerified = receipt.verificationStatus === "VERIFIED";
  const isFlagged = receipt.verificationStatus === "FLAGGED_DISCREPANCY";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 print:p-0 print:bg-white backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden print:shadow-none print:w-full print:max-w-none border border-slate-200">
        {/* Modal Controls (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider bg-amber-500 text-slate-950 px-2 py-0.5 rounded">
              DEMO DATA
            </span>
            <span className="font-semibold text-sm">Official Payment Receipt</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-xs font-medium rounded transition"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Receipt
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-8 print:p-6 bg-white text-slate-900" id="printable-receipt">
          {/* Header */}
          <div className="text-center border-b border-dashed border-slate-300 pb-5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              {receipt.agencyName || agencyName}
            </h1>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">
              Independent Financial Desk • Transaction Confirmation
            </p>
            <div className="inline-block mt-2 bg-slate-100 text-slate-700 px-3 py-0.5 rounded-full text-xs font-mono font-medium">
              Receipt: {receipt.receiptNumber}
            </div>
          </div>

          {/* Amount Hero */}
          <div className="my-6 p-4 bg-slate-50 rounded-lg border border-slate-200 text-center">
            <div className="text-xs uppercase text-slate-500 font-semibold tracking-wider">
              Amount Received
            </div>
            <div className="text-3xl font-extrabold text-slate-900 mt-1">
              {currency} {receipt.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-1 flex items-center justify-center gap-2 text-xs">
              <span className="font-semibold text-slate-700">Payment Destination:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded ${
                  receipt.destination === "CASH"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {receipt.destination} REGISTER
              </span>
            </div>
          </div>

          {/* Details Table */}
          <div className="space-y-3 text-sm border-b border-slate-200 pb-5">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Transaction ID:</span>
              <span className="font-mono font-medium text-slate-800">{receipt.id}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Applicant Reference:</span>
              <span className="font-semibold text-slate-900 text-right">{receipt.applicantRef}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Purpose / Description:</span>
              <span className="font-medium text-slate-800 text-right max-w-[240px]">
                {receipt.description}
              </span>
            </div>
            {receipt.destination === "BANK" && receipt.depositReference && (
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Bank Deposit Ref:</span>
                <span className="font-mono font-bold text-blue-700">{receipt.depositReference}</span>
              </div>
            )}
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Recorded By:</span>
              <span className="font-medium text-slate-800">
                {receipt.recordedBy?.name || "Staff Member"}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Server Timestamp:</span>
              <span className="font-medium text-slate-700">
                {new Date(receipt.createdAt).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Verification Status Warning / Stamp */}
          <div className="mt-5 p-3 rounded-lg border text-xs">
            {isVerified ? (
              <div className="flex items-start gap-2 text-emerald-800 bg-emerald-50 p-2 rounded">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">VERIFIED COLLECTION:</span> This payment was reviewed and
                  confirmed by the Agency Owner during formal register closing.
                </div>
              </div>
            ) : isFlagged ? (
              <div className="flex items-start gap-2 text-amber-800 bg-amber-50 p-2 rounded">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">FLAGGED WITH DISCREPANCY:</span> Under owner review and
                  discrepancy resolution audit.
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 text-amber-900 bg-amber-50 p-2 rounded">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">UNVERIFIED (PENDING PHYSICAL COUNT):</span> This record has
                  been recorded by front-desk staff but has not yet undergone formal owner physical count
                  verification.
                </div>
              </div>
            )}
          </div>

          {/* Footer Note */}
          <div className="mt-6 text-center text-[10px] text-slate-400">
            DEMO DATA RECORD • INDEPENDENT FINANCIAL TRACKER • IMMUTABLE AUDIT TRAIL PRESERVED
          </div>
        </div>
      </div>
    </div>
  );
}
