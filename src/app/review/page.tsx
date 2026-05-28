"use client";

import { useEffect, useState } from "react";
import { DealCard } from "@/components/DealCard";

interface Bill {
  id: string;
  name: string;
  provider: string;
  monthlyAmount: number;
  planDetails?: string | null;
  deals: {
    id: string;
    provider: string;
    planDetails: string;
    monthlyAmount: number;
    promoAmount?: number | null;
    promoDuration?: number | null;
    annualSaving: number;
    sourceNote?: string | null;
  }[];
}

type Phase = "intro" | "running" | "walkthrough" | "done";

export default function ReviewPage() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [bills, setBills] = useState<Bill[]>([]);
  const [current, setCurrent] = useState(0);
  const [totalSaving, setTotalSaving] = useState(0);
  const [commitCount, setCommitCount] = useState(0);

  async function startReview() {
    setPhase("running");
    const res = await fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const { totalSavingFound } = await res.json();
    setTotalSaving(totalSavingFound);

    const billsRes = await fetch("/api/bills");
    const allBills: Bill[] = await billsRes.json();
    const withDeals = allBills.filter((b) => b.deals.length > 0);
    setBills(withDeals);
    setCurrent(0);
    setCommitCount(0);

    if (withDeals.length === 0) {
      setPhase("done");
    } else {
      setPhase("walkthrough");
    }
  }

  function next(committed: boolean) {
    if (committed) setCommitCount((n) => n + 1);
    if (current + 1 >= bills.length) {
      setPhase("done");
    } else {
      setCurrent((n) => n + 1);
    }
  }

  if (phase === "intro") {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Monthly Review</h1>
        <p className="text-gray-500 mb-6">
          We&apos;ll scan each of your bills using AI to find better deals in the Australian market right now.
          This typically takes 1–2 minutes depending on how many bills you have.
        </p>
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">What happens during a review?</h3>
          <ol className="space-y-2 text-sm text-gray-600 list-decimal list-inside">
            <li>AI searches for competing deals for each of your bills</li>
            <li>We compare them to what you&apos;re currently paying</li>
            <li>You review each opportunity and decide whether to act</li>
            <li>For each deal you commit to, we prepare an email or call script</li>
          </ol>
        </div>
        <button
          onClick={startReview}
          className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
        >
          Start review →
        </button>
      </div>
    );
  }

  if (phase === "running") {
    return (
      <div className="max-w-2xl text-center py-16">
        <div className="inline-block w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Searching for better deals...</h2>
        <p className="text-gray-500">AI is scanning the Australian market for each of your bills. This takes a moment.</p>
      </div>
    );
  }

  if (phase === "walkthrough" && bills[current]) {
    const bill = bills[current];
    return (
      <div className="max-w-2xl space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Review your bills</h2>
          <span className="text-sm text-gray-500">{current + 1} / {bills.length}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-indigo-600 h-1.5 rounded-full transition-all"
            style={{ width: `${((current + 1) / bills.length) * 100}%` }}
          />
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Current bill</p>
          <h3 className="text-lg font-bold text-gray-900">{bill.name}</h3>
          <p className="text-gray-600">{bill.provider} · <span className="font-semibold">${bill.monthlyAmount}/mo</span></p>
          {bill.planDetails && <p className="text-sm text-gray-500 mt-1">{bill.planDetails}</p>}
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-3">{bill.deals.length} better deal(s) found:</h4>
          <div className="space-y-3">
            {bill.deals.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                bill={bill}
                onCommit={() => next(true)}
              />
            ))}
          </div>
        </div>

        <button
          onClick={() => next(false)}
          className="w-full py-3 border border-gray-300 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50"
        >
          Skip this one →
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl text-center py-12">
      <div className="text-5xl mb-4">🎉</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Review complete!</h2>
      {commitCount > 0 ? (
        <p className="text-gray-600 mb-2">
          You committed to <strong>{commitCount}</strong> switch(es) with potential savings of <strong>${totalSaving.toFixed(0)}/year</strong>.
        </p>
      ) : (
        <p className="text-gray-600 mb-2">
          {bills.length === 0
            ? "No better deals were found this month. Your current plans look competitive."
            : "No switches committed this time. Check back next month for new deals."}
        </p>
      )}
      <p className="text-sm text-gray-500 mb-8">Check your <a href="/actions" className="text-indigo-600 underline">Actions page</a> for next steps on committed switches.</p>
      <button
        onClick={() => setPhase("intro")}
        className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50"
      >
        Run another review
      </button>
    </div>
  );
}
