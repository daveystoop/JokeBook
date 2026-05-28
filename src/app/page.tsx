"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EconomicWidget } from "@/components/EconomicWidget";

interface Bill {
  id: string;
  name: string;
  provider: string;
  category: string;
  monthlyAmount: number;
  deals: { annualSaving: number }[];
  actions: { id: string }[];
}

interface Action {
  id: string;
  billId: string;
  status: string;
  monthlySaving: number;
  annualSaving: number;
  commitBy?: string;
  bill: { name: string; provider: string };
}

export default function Dashboard() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/bills").then((r) => r.json()),
      fetch("/api/actions").then((r) => r.json()),
    ]).then(([b, a]) => {
      setBills(b);
      setActions(a);
      setLoading(false);
    });
  }, []);

  const totalMonthly = bills.reduce((s, b) => s + b.monthlyAmount, 0);
  const totalOpportunity = bills.reduce((s, b) => s + (b.deals[0]?.annualSaving ?? 0), 0);
  const pendingActions = actions.filter((a) => a.status === "pending");
  const overdueActions = pendingActions.filter(
    (a) => a.commitBy && new Date(a.commitBy) < new Date()
  );
  const realisedSavings = actions
    .filter((a) => a.status === "done")
    .reduce((s, a) => s + a.annualSaving, 0);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse h-24 bg-gray-200 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Your Financial Dashboard</h1>
        <p className="text-gray-500 mt-1">Track bills, find better deals, and reclaim money that&apos;s slipping away.</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Monthly Bills" value={`$${totalMonthly.toFixed(0)}`} sub="total outgoing" color="blue" />
        <StatCard label="Annual Opportunity" value={`$${totalOpportunity.toFixed(0)}`} sub="by switching" color="green" />
        <StatCard label="Actions Pending" value={String(pendingActions.length)} sub={overdueActions.length > 0 ? `${overdueActions.length} overdue` : "on track"} color={overdueActions.length > 0 ? "red" : "gray"} />
        <StatCard label="Savings Realised" value={`$${realisedSavings.toFixed(0)}`} sub="this year" color="purple" />
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <EconomicWidget />

        {/* Quick actions */}
        {pendingActions.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Pending Actions</h3>
            <div className="space-y-2">
              {pendingActions.slice(0, 3).map((a) => {
                const isOverdue = a.commitBy && new Date(a.commitBy) < new Date();
                return (
                  <div key={a.id} className={`flex items-center justify-between p-3 rounded-lg ${isOverdue ? "bg-red-50 border border-red-200" : "bg-gray-50"}`}>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{a.bill.name}</p>
                      <p className="text-xs text-gray-500">Save ${a.monthlySaving.toFixed(0)}/mo</p>
                    </div>
                    {isOverdue && <span className="text-xs text-red-600 font-medium">Overdue</span>}
                  </div>
                );
              })}
            </div>
            <Link href="/actions" className="block mt-3 text-sm text-indigo-600 font-medium hover:underline">
              View all actions →
            </Link>
          </div>
        )}
      </div>

      {/* Bills overview */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Your Bills</h3>
          <Link href="/bills" className="text-sm text-indigo-600 font-medium hover:underline">
            Manage bills →
          </Link>
        </div>
        {bills.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-gray-500 mb-1">No bills yet.</p>
            <p className="text-sm text-gray-400 mb-4">Upload your bank transactions and we&apos;ll find them automatically.</p>
            <div className="flex gap-3 justify-center">
              <Link href="/audit" className="inline-block px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700">
                Run financial audit →
              </Link>
              <Link href="/bills/new" className="inline-block px-4 py-2 border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50">
                Add manually
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {bills.map((bill) => {
              const hasDeals = bill.deals.length > 0;
              const hasPendingAction = bill.actions.length > 0;
              return (
                <Link key={bill.id} href={`/bills/${bill.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900">{bill.name}</p>
                    <p className="text-sm text-gray-500">{bill.provider}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {hasPendingAction && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Action pending</span>
                    )}
                    {hasDeals && !hasPendingAction && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Deal found</span>
                    )}
                    <span className="font-semibold text-gray-900">${bill.monthlyAmount}/mo</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {bills.length > 0 && (
        <div className="flex gap-3">
          <Link href="/audit" className="px-5 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
            Run financial audit →
          </Link>
          <Link href="/bills/new" className="px-5 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors">
            Add bill
          </Link>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  const colors: Record<string, string> = {
    blue: "text-blue-700",
    green: "text-green-700",
    red: "text-red-600",
    gray: "text-gray-700",
    purple: "text-purple-700",
  };
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${colors[color]}`}>{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  );
}
