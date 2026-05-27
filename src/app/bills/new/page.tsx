"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BILL_CATEGORIES } from "@/types";

export default function NewBillPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    provider: "",
    category: "internet",
    monthlyAmount: "",
    planDetails: "",
    contractEnds: "",
    accountNumber: "",
    phoneNumber: "",
    notes: "",
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const bill = await res.json();
      router.push(`/bills/${bill.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add a Bill</h1>
        <p className="text-gray-500 mt-1">Track a recurring expense so we can find better deals for you.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Bill name *" required>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. NBN Internet"
              required
              className="input"
            />
          </Field>
          <Field label="Provider *" required>
            <input
              type="text"
              value={form.provider}
              onChange={(e) => set("provider", e.target.value)}
              placeholder="e.g. Aussie Broadband"
              required
              className="input"
            />
          </Field>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Category *">
            <select value={form.category} onChange={(e) => set("category", e.target.value)} className="input">
              {BILL_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Monthly amount ($) *" required>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.monthlyAmount}
              onChange={(e) => set("monthlyAmount", e.target.value)}
              placeholder="95.00"
              required
              className="input"
            />
          </Field>
        </div>

        <Field label="Plan details">
          <input
            type="text"
            value={form.planDetails}
            onChange={(e) => set("planDetails", e.target.value)}
            placeholder="e.g. 100Mbps unlimited NBN"
            className="input"
          />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Contract ends">
            <input type="date" value={form.contractEnds} onChange={(e) => set("contractEnds", e.target.value)} className="input" />
          </Field>
          <Field label="Account number">
            <input type="text" value={form.accountNumber} onChange={(e) => set("accountNumber", e.target.value)} className="input" />
          </Field>
        </div>

        <Field label="Provider phone number">
          <input type="tel" value={form.phoneNumber} onChange={(e) => set("phoneNumber", e.target.value)} placeholder="e.g. 1300 000 000" className="input" />
        </Field>

        <Field label="Notes">
          <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} className="input resize-none" />
        </Field>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60">
            {saving ? "Saving..." : "Save bill"}
          </button>
        </div>
      </form>

      <style jsx>{`
        .input {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s;
        }
        .input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}
