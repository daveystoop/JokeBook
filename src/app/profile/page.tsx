"use client";

import { useEffect, useState } from "react";

interface Profile {
  name: string;
  address?: string;
  email?: string;
  mortgageBank?: string;
  mortgageRate?: number;
}

export default function ProfilePage() {
  const [form, setForm] = useState<Profile>({ name: "" });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile").then((r) => r.json()).then((data) => {
      if (data) setForm(data);
      setLoading(false);
    });
  }, []);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (loading) return <div className="animate-pulse h-48 bg-gray-200 rounded-xl" />;

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
        <p className="text-gray-500 mt-1">This information is used to generate personalised switch emails and mortgage alerts.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <Field label="Full name *">
          <input
            type="text"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            required
            placeholder="e.g. Alex Smith"
            className="input"
          />
        </Field>

        <Field label="Home address">
          <input
            type="text"
            value={form.address ?? ""}
            onChange={(e) => set("address", e.target.value)}
            placeholder="Used in email templates"
            className="input"
          />
        </Field>

        <Field label="Email address">
          <input
            type="email"
            value={form.email ?? ""}
            onChange={(e) => set("email", e.target.value)}
            placeholder="So providers can contact you"
            className="input"
          />
        </Field>

        <hr className="border-gray-100" />

        <h3 className="font-medium text-gray-900 text-sm">Mortgage details (for rate alerts)</h3>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Mortgage bank">
            <input
              type="text"
              value={form.mortgageBank ?? ""}
              onChange={(e) => set("mortgageBank", e.target.value)}
              placeholder="e.g. ME Bank"
              className="input"
            />
          </Field>
          <Field label="Current interest rate (%)">
            <input
              type="number"
              step="0.01"
              min="0"
              max="20"
              value={form.mortgageRate ?? ""}
              onChange={(e) => set("mortgageRate", e.target.value)}
              placeholder="e.g. 6.24"
              className="input"
            />
          </Field>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
        >
          {saved ? "Saved ✓" : "Save profile"}
        </button>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
