"use client";

import { useEffect, useState } from "react";

interface Action {
  id: string;
  status: string;
  monthlySaving: number;
  annualSaving: number;
  commitBy?: string | null;
  method?: string | null;
  draftEmail?: string | null;
  completedAt?: string | null;
  createdAt: string;
  bill: { name: string; provider: string };
}

export default function ActionsPage() {
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEmail, setShowEmail] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/actions");
    setActions(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/actions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  const pending = actions.filter((a) => a.status === "pending");
  const done = actions.filter((a) => a.status === "done");
  const skipped = actions.filter((a) => a.status === "skipped");
  const realisedSaving = done.reduce((s, a) => s + a.annualSaving, 0);

  if (loading) return <div className="animate-pulse h-64 bg-gray-200 rounded-xl" />;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Your Actions</h1>
        <p className="text-gray-500 mt-1">Follow through on committed switches to unlock your savings.</p>
      </div>

      {actions.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
          <p className="text-gray-500 mb-3">No actions yet. Run a monthly review to find deals you can commit to.</p>
          <a href="/review" className="inline-block px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700">
            Start a review
          </a>
        </div>
      ) : (
        <>
          {realisedSaving > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-green-800 font-semibold text-lg">
                💰 You&apos;ve realised ${realisedSaving.toFixed(0)}/year in savings so far!
              </p>
            </div>
          )}

          {pending.length > 0 && (
            <Section title={`Pending (${pending.length})`}>
              {pending.map((action) => {
                const isOverdue = action.commitBy && new Date(action.commitBy) < new Date();
                return (
                  <ActionRow
                    key={action.id}
                    action={action}
                    highlight={isOverdue ? "red" : "amber"}
                    badge={isOverdue ? "OVERDUE" : `Due ${new Date(action.commitBy!).toLocaleDateString("en-AU")}`}
                    onDone={() => updateStatus(action.id, "done")}
                    onSkip={() => updateStatus(action.id, "skipped")}
                    onViewEmail={() => setShowEmail(action.draftEmail!)}
                  />
                );
              })}
            </Section>
          )}

          {done.length > 0 && (
            <Section title={`Completed (${done.length})`}>
              {done.map((action) => (
                <ActionRow key={action.id} action={action} highlight="green" badge="Done ✓" />
              ))}
            </Section>
          )}

          {skipped.length > 0 && (
            <Section title={`Skipped (${skipped.length})`}>
              {skipped.map((action) => (
                <ActionRow key={action.id} action={action} highlight="gray" badge="Skipped" />
              ))}
            </Section>
          )}
        </>
      )}

      {showEmail && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6">
            <h3 className="font-bold text-gray-900 mb-3">Draft Switch Email</h3>
            <pre className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap font-sans border border-gray-200 max-h-72 overflow-y-auto">
              {showEmail}
            </pre>
            <div className="flex gap-3 mt-4">
              <button onClick={() => navigator.clipboard.writeText(showEmail)} className="flex-1 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
                Copy
              </button>
              <button onClick={() => setShowEmail(null)} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function ActionRow({
  action,
  highlight,
  badge,
  onDone,
  onSkip,
  onViewEmail,
}: {
  action: Action;
  highlight: string;
  badge: string;
  onDone?: () => void;
  onSkip?: () => void;
  onViewEmail?: () => void;
}) {
  const colors: Record<string, string> = {
    amber: "bg-amber-50 border-amber-200",
    red: "bg-red-50 border-red-200",
    green: "bg-green-50 border-green-200",
    gray: "bg-gray-50 border-gray-200",
  };
  const badgeColors: Record<string, string> = {
    amber: "text-amber-700",
    red: "text-red-700 font-bold",
    green: "text-green-700",
    gray: "text-gray-500",
  };

  return (
    <div className={`border rounded-xl p-4 ${colors[highlight]}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-gray-900">{action.bill.name}</p>
            <span className={`text-xs ${badgeColors[highlight]}`}>{badge}</span>
          </div>
          <p className="text-sm text-gray-500">{action.bill.provider} · {action.method === "email" ? "✉️ email" : action.method === "call" ? "📞 call" : ""}</p>
          <p className="text-sm font-medium text-gray-700 mt-1">
            Save ${action.monthlySaving.toFixed(2)}/mo · ${action.annualSaving.toFixed(0)}/year
          </p>
        </div>
        {onDone && (
          <div className="flex gap-2 shrink-0">
            {action.draftEmail && onViewEmail && (
              <button onClick={onViewEmail} className="px-3 py-1.5 text-xs border border-gray-300 bg-white rounded-lg hover:bg-gray-50 text-gray-700">
                View email
              </button>
            )}
            <button onClick={onDone} className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
              Done ✓
            </button>
            {onSkip && (
              <button onClick={onSkip} className="px-3 py-1.5 text-xs border border-gray-300 bg-white rounded-lg hover:bg-gray-50 text-gray-600">
                Skip
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
