"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BILL_CATEGORIES } from "@/types";

interface Bill {
  id: string;
  name: string;
  provider: string;
  category: string;
  monthlyAmount: number;
  deals: { annualSaving: number }[];
  actions: { id: string; status: string }[];
}

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState<{ dealsFound: number; totalSavingFound: number } | null>(null);

  async function loadBills() {
    const res = await fetch("/api/bills");
    setBills(await res.json());
    setLoading(false);
  }

  useEffect(() => { loadBills(); }, []);

  async function runReview() {
    setReviewing(true);
    setReviewResult(null);
    try {
      const res = await fetch("/api/review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const data = await res.json();
      setReviewResult(data);
      loadBills();
    } finally {
      setReviewing(false);
    }
  }

  const categoryLabel = (cat: string) => BILL_CATEGORIES.find((c) => c.value === cat)?.label ?? cat;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Bills</h1>
          <p className="text-gray-500 mt-1">Track your recurring expenses and find better deals.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={runReview}
            disabled={reviewing || bills.length === 0}
            className="px-4 py-2 border border-indigo-600 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50"
          >
            {reviewing ? "Searching deals..." : "Find better deals"}
          </button>
          <Link href="/bills/new" className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
            + Add bill
          </Link>
        </div>
      </div>

      {reviewResult && (
        <div className={`p-4 rounded-xl border ${reviewResult.dealsFound > 0 ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-200"}`}>
          {reviewResult.dealsFound > 0 ? (
            <p className="text-green-800 font-medium">
              Found {reviewResult.dealsFound} deal(s) — potential saving of ${reviewResult.totalSavingFound.toFixed(0)}/year. Click any bill to see deals.
            </p>
          ) : (
            <p className="text-gray-600">No better deals found right now. Your current plans look competitive.</p>
          )}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="animate-pulse h-16 bg-gray-200 rounded-xl" />)}
        </div>
      ) : bills.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <p className="text-gray-500 mb-4">No bills added yet. Start by adding your recurring expenses.</p>
          <Link href="/bills/new" className="inline-block px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700">
            Add your first bill
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide">
                <th className="text-left px-5 py-3">Bill</th>
                <th className="text-left px-5 py-3">Category</th>
                <th className="text-left px-5 py-3">Provider</th>
                <th className="text-right px-5 py-3">Monthly</th>
                <th className="text-right px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bills.map((bill) => {
                const topDeal = bill.deals[0];
                const hasPending = bill.actions.some((a) => a.status === "pending");
                return (
                  <tr key={bill.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <Link href={`/bills/${bill.id}`} className="font-medium text-indigo-700 hover:underline">{bill.name}</Link>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">{categoryLabel(bill.category)}</td>
                    <td className="px-5 py-4 text-sm text-gray-600">{bill.provider}</td>
                    <td className="px-5 py-4 text-right font-semibold text-gray-900">${bill.monthlyAmount.toFixed(2)}</td>
                    <td className="px-5 py-4 text-right">
                      {hasPending ? (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Action pending</span>
                      ) : topDeal ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                          Save ${topDeal.annualSaving.toFixed(0)}/yr
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">No deals found</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t border-gray-200">
                <td colSpan={3} className="px-5 py-3 text-sm font-semibold text-gray-600">Total</td>
                <td className="px-5 py-3 text-right font-bold text-gray-900">
                  ${bills.reduce((s, b) => s + b.monthlyAmount, 0).toFixed(2)}/mo
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
