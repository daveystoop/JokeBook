"use client";

import { useState } from "react";
import { CommitmentModal } from "./CommitmentModal";

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

interface Bill {
  id: string;
  name: string;
  provider: string;
  category: string;
  monthlyAmount: number;
  planDetails?: string | null;
  deals: Deal[];
}

const CATEGORY_ICONS: Record<string, string> = {
  internet: "🌐",
  phone: "📱",
  energy: "⚡",
  insurance: "🛡️",
  streaming: "📺",
  mortgage: "🏠",
  gym: "💪",
  other: "📋",
};

interface Props {
  bill: Bill;
  onCommit: (annualSaving: number) => void;
  onSkip: () => void;
}

export function AuditBillCard({ bill, onCommit, onSkip }: Props) {
  const [committed, setCommitted] = useState(false);
  const [skipped, setSkipped] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const bestDeal = bill.deals[0] ?? null;
  const icon = CATEGORY_ICONS[bill.category] ?? "📋";

  if (committed) {
    return (
      <div className="border border-green-200 bg-green-50 rounded-xl p-4 flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1">
          <p className="font-semibold text-green-900">{bill.name}</p>
          <p className="text-sm text-green-700">Switch committed — ${bestDeal?.annualSaving.toFixed(0)}/year saving</p>
        </div>
        <span className="text-green-600 font-bold text-lg">✓</span>
      </div>
    );
  }

  if (skipped) {
    return (
      <div className="border border-gray-200 bg-gray-50 rounded-xl p-4 flex items-center gap-3 opacity-60">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1">
          <p className="font-semibold text-gray-700">{bill.name}</p>
          <p className="text-sm text-gray-500">Skipped</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="border border-gray-200 bg-white rounded-xl p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl mt-0.5">{icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-gray-900">{bill.name}</p>
                <p className="text-sm text-gray-500">{bill.provider} · ${bill.monthlyAmount}/mo</p>
                {bill.planDetails && <p className="text-xs text-gray-400 mt-0.5">{bill.planDetails}</p>}
              </div>
              <span className="text-sm font-semibold text-gray-700 shrink-0">${(bill.monthlyAmount * 12).toFixed(0)}/yr</span>
            </div>

            {bestDeal ? (
              <div className="mt-3 bg-indigo-50 border border-indigo-100 rounded-lg p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-indigo-900">Better deal found</p>
                    <p className="text-sm text-indigo-700">{bestDeal.provider} — {bestDeal.planDetails}</p>
                    {bestDeal.promoAmount && bestDeal.promoDuration ? (
                      <p className="text-xs text-indigo-600 mt-0.5">
                        ${bestDeal.promoAmount}/mo for {bestDeal.promoDuration} months, then ${bestDeal.monthlyAmount}/mo
                      </p>
                    ) : (
                      <p className="text-xs text-indigo-600 mt-0.5">${bestDeal.monthlyAmount}/mo regular price</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-green-700 font-bold text-sm">Save ${bestDeal.annualSaving.toFixed(0)}/yr</p>
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setSkipped(true)}
                    className="flex-1 py-2 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Skip
                  </button>
                  <button
                    onClick={() => setShowModal(true)}
                    className="flex-2 px-5 py-2 text-sm bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    Yes, switch →
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3 flex items-center justify-between">
                <p className="text-sm text-green-700 font-medium">✓ Looks competitive</p>
                <button
                  onClick={() => setSkipped(true)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && bestDeal && (
        <CommitmentModal
          bill={bill}
          deal={bestDeal}
          onClose={() => setShowModal(false)}
          onCommit={() => {
            setShowModal(false);
            setCommitted(true);
            onCommit(bestDeal.annualSaving);
          }}
        />
      )}
    </>
  );
}
