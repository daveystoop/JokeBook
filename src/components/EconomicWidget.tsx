"use client";

import { useEffect, useState } from "react";
import type { EconomicData } from "@/lib/economic-data";

export function EconomicWidget() {
  const [data, setData] = useState<EconomicData | null>(null);

  useEffect(() => {
    fetch("/api/economic").then((r) => r.json()).then(setData);
  }, []);

  if (!data) return <div className="animate-pulse h-24 bg-gray-100 rounded-xl" />;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Economic Climate</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-gray-900">{data.cashRate}%</span>
            {data.cashRateChange === "down" && <span className="text-green-600 text-lg">↓</span>}
            {data.cashRateChange === "up" && <span className="text-red-500 text-lg">↑</span>}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">RBA Cash Rate</p>
          {data.cashRateDate && <p className="text-xs text-gray-400">as of {data.cashRateDate}</p>}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-gray-900">{data.cpiAnnual}%</span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">CPI (annual)</p>
          {data.cpiDate && <p className="text-xs text-gray-400">{data.cpiDate} quarter</p>}
        </div>
      </div>
      {data.mortgageAlert && (
        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm text-amber-800">
          <strong>Rate changed recently.</strong> Consider calling your mortgage bank to negotiate a lower rate.
        </div>
      )}
    </div>
  );
}
