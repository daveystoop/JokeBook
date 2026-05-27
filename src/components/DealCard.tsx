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
  monthlyAmount: number;
}

interface Props {
  deal: Deal;
  bill: Bill;
  onCommit?: () => void;
}

export function DealCard({ deal, bill, onCommit }: Props) {
  const [showModal, setShowModal] = useState(false);

  const effectivePrice = deal.promoAmount ?? deal.monthlyAmount;
  const saving = bill.monthlyAmount - effectivePrice;

  return (
    <>
      <div className="bg-white border border-green-200 rounded-xl p-4 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="font-semibold text-gray-900">{deal.provider}</p>
            <p className="text-sm text-gray-500">{deal.planDetails}</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold text-green-700">${effectivePrice}/mo</p>
            {deal.promoAmount && deal.promoDuration && (
              <p className="text-xs text-gray-400">then ${deal.monthlyAmount}/mo</p>
            )}
          </div>
        </div>

        {deal.promoAmount && deal.promoDuration && (
          <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5 mb-2">
            <p className="text-xs text-amber-700 font-medium">
              🔥 Promo: ${deal.promoAmount}/mo for {deal.promoDuration} months
            </p>
          </div>
        )}

        <div className="flex items-center justify-between mt-3">
          <span className="text-sm text-green-700 font-medium">
            Save ~${deal.annualSaving.toFixed(0)}/year
          </span>
          {saving > 0 && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Commit to switch →
            </button>
          )}
        </div>

        {deal.sourceNote && (
          <p className="text-xs text-gray-400 mt-2 italic">{deal.sourceNote}</p>
        )}
      </div>

      {showModal && (
        <CommitmentModal
          bill={bill}
          deal={deal}
          onClose={() => setShowModal(false)}
          onCommit={() => {
            setShowModal(false);
            onCommit?.();
          }}
        />
      )}
    </>
  );
}
