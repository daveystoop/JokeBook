"use client";

import { useState } from "react";

interface Deal {
  id: string;
  provider: string;
  planDetails: string;
  monthlyAmount: number;
  promoAmount?: number | null;
  promoDuration?: number | null;
  annualSaving: number;
}

interface Bill {
  id: string;
  name: string;
  provider: string;
  monthlyAmount: number;
}

interface Props {
  bill: Bill;
  deal: Deal;
  onClose: () => void;
  onCommit: () => void;
}

export function CommitmentModal({ bill, deal, onClose, onCommit }: Props) {
  const [method, setMethod] = useState<"email" | "call">("email");
  const [commitDays, setCommitDays] = useState(3);
  const [loading, setLoading] = useState(false);

  const commitByDate = new Date();
  commitByDate.setDate(commitByDate.getDate() + commitDays);

  const newMonthly = deal.promoAmount ?? deal.monthlyAmount;
  const monthlySaving = bill.monthlyAmount - newMonthly;

  async function handleCommit() {
    setLoading(true);
    try {
      await fetch("/api/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billId: bill.id,
          dealId: deal.id,
          monthlySaving,
          annualSaving: deal.annualSaving,
          method,
          commitBy: commitByDate.toISOString(),
        }),
      });
      onCommit();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Commit to Switch</h2>
        <p className="text-sm text-gray-500 mb-5">Lock in this saving by committing to make the switch.</p>

        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-600">Current: {bill.provider}</p>
              <p className="text-2xl font-bold text-gray-900">${bill.monthlyAmount}/mo</p>
            </div>
            <div className="text-center px-3">
              <span className="text-gray-400 text-2xl">→</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">New: {deal.provider}</p>
              <p className="text-2xl font-bold text-green-700">${newMonthly}/mo</p>
              {deal.promoAmount && deal.promoDuration && (
                <p className="text-xs text-gray-500">then ${deal.monthlyAmount}/mo after {deal.promoDuration}mo</p>
              )}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-green-200 text-center">
            <span className="text-green-700 font-semibold">You save ~${deal.annualSaving.toFixed(0)}/year</span>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">How will you make the switch?</label>
          <div className="flex gap-3">
            <button
              onClick={() => setMethod("email")}
              className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${method === "email" ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
            >
              ✉️ Send an email
            </button>
            <button
              onClick={() => setMethod("call")}
              className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${method === "call" ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-300 text-gray-700 hover:bg-gray-50"}`}
            >
              📞 Call them
            </button>
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            I&apos;ll do this within: <strong>{commitDays} day{commitDays !== 1 ? "s" : ""}</strong>
          </label>
          <input
            type="range"
            min={1}
            max={14}
            value={commitDays}
            onChange={(e) => setCommitDays(parseInt(e.target.value))}
            className="w-full accent-indigo-600"
          />
          <p className="text-xs text-gray-500 mt-1">
            Deadline: {commitByDate.toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleCommit}
            disabled={loading}
            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60"
          >
            {loading ? "Saving..." : "I'll do this ✓"}
          </button>
        </div>
      </div>
    </div>
  );
}
