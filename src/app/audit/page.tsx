"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AuditBillCard } from "@/components/AuditBillCard";

interface Deal {
  id: string;
  provider: string;
  planDetails: string;
  monthlyAmount: number;
  promoAmount?: number | null;
  promoDuration?: number | null;
  annualSaving: number;
  sourceNote?: string | null;
}

interface AuditBill {
  id: string;
  name: string;
  provider: string;
  category: string;
  monthlyAmount: number;
  planDetails?: string | null;
  deals: Deal[];
}

interface AuditResult {
  bills: AuditBill[];
  totalMonthlyCost: number;
  totalAnnualOpportunity: number;
  detectedCount: number;
  summary: string;
}

type Phase = "upload" | "uploading" | "analysing" | "report" | "error";

const ANALYSIS_MESSAGES = [
  "Reading your transactions…",
  "Identifying recurring bills…",
  "Researching better deals…",
  "Calculating your savings…",
];

export default function AuditPage() {
  const [phase, setPhase] = useState<Phase>("upload");
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [messageIdx, setMessageIdx] = useState(0);
  const [committedSaving, setCommittedSaving] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.name.endsWith(".csv")) {
      setError("Please upload a CSV file exported from your bank.");
      setPhase("error");
      return;
    }

    setPhase("uploading");
    setError(null);

    try {
      // Upload and parse
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        setError(uploadData.error ?? "Failed to parse the CSV.");
        setPhase("error");
        return;
      }

      // Start cycling analysis messages
      setPhase("analysing");
      let idx = 0;
      const interval = setInterval(() => {
        idx = (idx + 1) % ANALYSIS_MESSAGES.length;
        setMessageIdx(idx);
      }, 2200);

      // Run audit
      const auditRes = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uploadId: uploadData.uploadId }),
      });
      clearInterval(interval);

      const auditData = await auditRes.json();
      if (!auditRes.ok) {
        setError(auditData.error ?? "Audit failed.");
        setPhase("error");
        return;
      }

      setResult(auditData);
      setPhase("report");
    } catch {
      setError("Something went wrong. Please try again.");
      setPhase("error");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  if (phase === "upload" || phase === "error") {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Financial Audit</h1>
          <p className="text-gray-500 mt-2">
            Upload your bank transactions and we&apos;ll do the rest — find every recurring bill,
            research better deals, and show you exactly how much you could save.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors ${
            dragOver ? "border-indigo-500 bg-indigo-50" : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50"
          }`}
        >
          <div className="text-5xl mb-4">📂</div>
          <p className="text-lg font-semibold text-gray-900">Drop your CSV here</p>
          <p className="text-gray-500 mt-1">or click to browse</p>
          <p className="text-xs text-gray-400 mt-4">Supports Macquarie Bank, CBA, ANZ, NAB, Westpac CSV exports</p>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleInputChange} />
        </div>

        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xl p-4">
          <p className="text-sm font-medium text-gray-700 mb-2">How to export from Macquarie Bank:</p>
          <ol className="text-sm text-gray-500 space-y-1 list-decimal list-inside">
            <li>Log in to Macquarie Online Banking</li>
            <li>Go to your account → Transactions</li>
            <li>Select a date range (last 3 months recommended)</li>
            <li>Click Download / Export → choose CSV</li>
          </ol>
        </div>

        <p className="text-center mt-6 text-sm text-gray-400">
          Prefer to add bills manually?{" "}
          <Link href="/bills/new" className="text-indigo-600 hover:underline">Add a bill →</Link>
        </p>
      </div>
    );
  }

  if (phase === "uploading") {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="inline-block w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Uploading your transactions…</h2>
      </div>
    );
  }

  if (phase === "analysing") {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="inline-block w-14 h-14 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-6" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2 transition-all">
          {ANALYSIS_MESSAGES[messageIdx]}
        </h2>
        <p className="text-gray-400 text-sm">This takes about a minute. Sit tight.</p>
        <div className="mt-8 flex justify-center gap-2">
          {ANALYSIS_MESSAGES.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === messageIdx ? "w-8 bg-indigo-600" : "w-2 bg-gray-300"
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  if (phase === "report" && result) {
    const billsWithDeals = result.bills.filter((b) => b.deals.length > 0);
    const billsNoDeals = result.bills.filter((b) => b.deals.length === 0);

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Hero */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-6 text-white">
          <p className="text-indigo-200 text-sm font-medium uppercase tracking-wider mb-1">Your Financial Audit</p>
          <p className="text-lg text-indigo-100 mb-4">{result.summary}</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-3xl font-bold">{result.detectedCount}</p>
              <p className="text-indigo-200 text-sm">bills found</p>
            </div>
            <div>
              <p className="text-3xl font-bold">${result.totalMonthlyCost.toFixed(0)}</p>
              <p className="text-indigo-200 text-sm">per month</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-green-300">${result.totalAnnualOpportunity.toFixed(0)}</p>
              <p className="text-indigo-200 text-sm">potential saving/yr</p>
            </div>
          </div>
        </div>

        {/* Committed saving tracker */}
        {committedSaving > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-green-900">Committed savings so far</p>
              <p className="text-sm text-green-700">Keep going — every switch counts</p>
            </div>
            <p className="text-2xl font-bold text-green-700">${committedSaving.toFixed(0)}/yr</p>
          </div>
        )}

        {/* Bills with deals — action required */}
        {billsWithDeals.length > 0 && (
          <div>
            <h2 className="font-semibold text-gray-900 mb-3">
              💰 Savings opportunities ({billsWithDeals.length})
            </h2>
            <div className="space-y-3">
              {billsWithDeals.map((bill) => (
                <AuditBillCard
                  key={bill.id}
                  bill={bill}
                  onCommit={(saving) => setCommittedSaving((s) => s + saving)}
                  onSkip={() => {}}
                />
              ))}
            </div>
          </div>
        )}

        {/* Bills looking competitive */}
        {billsNoDeals.length > 0 && (
          <div>
            <h2 className="font-semibold text-gray-900 mb-3">
              ✓ Already competitive ({billsNoDeals.length})
            </h2>
            <div className="space-y-2">
              {billsNoDeals.map((bill) => (
                <AuditBillCard
                  key={bill.id}
                  bill={bill}
                  onCommit={() => {}}
                  onSkip={() => {}}
                />
              ))}
            </div>
          </div>
        )}

        {/* Action CTA */}
        <div className="flex gap-3 pt-2">
          <Link
            href="/actions"
            className="flex-1 py-3 bg-indigo-600 text-white text-center font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
          >
            View my action plan →
          </Link>
          <button
            onClick={() => { setPhase("upload"); setResult(null); setCommittedSaving(0); }}
            className="px-5 py-3 border border-gray-300 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50"
          >
            Upload new file
          </button>
        </div>
      </div>
    );
  }

  return null;
}
