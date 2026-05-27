"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DealCard } from "@/components/DealCard";
import { BILL_CATEGORIES } from "@/types";

interface Deal {
  id: string;
  provider: string;
  planDetails: string;
  monthlyAmount: number;
  promoAmount?: number | null;
  promoDuration?: number | null;
  annualSaving: number;
  sourceNote?: string | null;
  foundAt: string;
}

interface Action {
  id: string;
  status: string;
  monthlySaving: number;
  annualSaving: number;
  commitBy?: string | null;
  method?: string | null;
  draftEmail?: string | null;
  createdAt: string;
}

interface Bill {
  id: string;
  name: string;
  provider: string;
  category: string;
  monthlyAmount: number;
  planDetails?: string | null;
  contractEnds?: string | null;
  accountNumber?: string | null;
  phoneNumber?: string | null;
  notes?: string | null;
  deals: Deal[];
  actions: Action[];
}

export default function BillDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [bill, setBill] = useState<Bill | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [showEmail, setShowEmail] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    const res = await fetch(`/api/bills/${id}`);
    setBill(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  async function runReview() {
    setReviewing(true);
    try {
      await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billId: id }),
      });
      load();
    } finally {
      setReviewing(false);
    }
  }

  async function markActionDone(actionId: string) {
    await fetch(`/api/actions/${actionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "done" }),
    });
    load();
  }

  async function deleteBill() {
    if (!confirm("Delete this bill?")) return;
    setDeleting(true);
    await fetch(`/api/bills/${id}`, { method: "DELETE" });
    router.push("/bills");
  }

  if (loading) return <div className="animate-pulse h-64 bg-gray-200 rounded-xl" />;
  if (!bill) return <p className="text-gray-500">Bill not found.</p>;

  const categoryLabel = BILL_CATEGORIES.find((c) => c.value === bill.category)?.label ?? bill.category;
  const pendingAction = bill.actions.find((a) => a.status === "pending");

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{categoryLabel}</p>
          <h1 className="text-2xl font-bold text-gray-900">{bill.name}</h1>
          <p className="text-gray-600">{bill.provider} · <span className="font-semibold">${bill.monthlyAmount}/mo</span></p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={runReview}
            disabled={reviewing}
            className="px-4 py-2 border border-indigo-600 text-indigo-700 text-sm font-medium rounded-lg hover:bg-indigo-50 disabled:opacity-50"
          >
            {reviewing ? "Searching..." : "Find deals"}
          </button>
          <button
            onClick={deleteBill}
            disabled={deleting}
            className="px-4 py-2 border border-red-300 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Bill details */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 grid sm:grid-cols-2 gap-3 text-sm">
        {bill.planDetails && <Detail label="Plan" value={bill.planDetails} />}
        {bill.contractEnds && <Detail label="Contract ends" value={new Date(bill.contractEnds).toLocaleDateString("en-AU")} />}
        {bill.accountNumber && <Detail label="Account #" value={bill.accountNumber} />}
        {bill.phoneNumber && <Detail label="Phone" value={bill.phoneNumber} />}
        {bill.notes && <Detail label="Notes" value={bill.notes} />}
      </div>

      {/* Pending action */}
      {pendingAction && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-amber-900">Action pending</h3>
              <p className="text-sm text-amber-700 mt-1">
                Save ${pendingAction.monthlySaving.toFixed(2)}/mo · via {pendingAction.method}
              </p>
              {pendingAction.commitBy && (
                <p className="text-xs text-amber-600 mt-0.5">
                  Due by {new Date(pendingAction.commitBy).toLocaleDateString("en-AU")}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {pendingAction.draftEmail && (
                <button
                  onClick={() => setShowEmail(pendingAction.draftEmail!)}
                  className="px-3 py-1.5 text-xs bg-white border border-amber-300 text-amber-800 rounded-lg hover:bg-amber-100"
                >
                  View email
                </button>
              )}
              <button
                onClick={() => markActionDone(pendingAction.id)}
                className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Mark done ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deals */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          {bill.deals.length > 0 ? `${bill.deals.length} deal(s) found` : "No deals found yet"}
        </h2>
        {bill.deals.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
            <p className="text-gray-500 mb-3">Click &quot;Find deals&quot; to search for better options using AI.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bill.deals.map((deal) => (
              <DealCard key={deal.id} deal={deal} bill={bill} onCommit={load} />
            ))}
          </div>
        )}
      </div>

      {/* Email modal */}
      {showEmail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <h3 className="font-bold text-gray-900 mb-3">Draft Switch Email</h3>
            <pre className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap font-sans border border-gray-200 max-h-64 overflow-y-auto">
              {showEmail}
            </pre>
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { navigator.clipboard.writeText(showEmail); }}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Copy to clipboard
              </button>
              <button
                onClick={() => setShowEmail(null)}
                className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-gray-900 font-medium">{value}</p>
    </div>
  );
}
