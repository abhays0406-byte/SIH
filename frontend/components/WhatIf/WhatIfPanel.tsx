"use client";
import { useState } from "react";
import { runWhatIf } from "@/lib/api";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

interface Props {
  bidderId: string;
  checks: Array<{ check_name: string; status: string }>;
}

const STATUSES = ["pass", "fail", "warn"];

export default function WhatIfPanel({ bidderId, checks }: Props) {
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSimulate = async () => {
    if (Object.keys(overrides).length === 0) { toast.error("Toggle at least one check"); return; }
    setLoading(true);
    try {
      const res = await runWhatIf(bidderId, overrides);
      setResult(res.data);
    } catch { toast.error("Simulation failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-medium text-white">What-If Simulator</h3>
          <p className="text-xs text-gray-500 mt-0.5">Toggle check statuses to see score impact. Not persisted.</p>
        </div>
        <button onClick={handleSimulate} disabled={loading} className="btn-primary text-sm">
          {loading ? "Simulating..." : "Simulate"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {checks.map((c) => (
          <div key={c.check_name} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
            <span className="text-sm text-gray-300">{c.check_name}</span>
            <select
              className="bg-gray-800 text-xs text-white rounded px-2 py-1 border border-white/10"
              value={overrides[c.check_name] ?? c.status}
              onChange={(e) => {
                const val = e.target.value;
                if (val === c.status) {
                  const next = { ...overrides };
                  delete next[c.check_name];
                  setOverrides(next);
                } else {
                  setOverrides({ ...overrides, [c.check_name]: val });
                }
              }}
            >
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        ))}
      </div>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-4 p-4 bg-indigo-900/20 rounded-xl border border-indigo-500/20"
        >
          <div className="text-center">
            <p className="text-xs text-gray-400">Original Score</p>
            <p className="text-2xl font-bold text-white">{result.original_score.toFixed(1)}</p>
            <p className="text-xs text-gray-500">{result.original_risk}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">Simulated Score</p>
            <p className={`text-2xl font-bold ${result.delta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {result.simulated_score.toFixed(1)}
            </p>
            <p className="text-xs text-gray-500">{result.simulated_risk}</p>
          </div>
          <div className="col-span-2 text-center">
            <span className={`text-sm font-medium ${result.delta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {result.delta >= 0 ? "+" : ""}{result.delta.toFixed(2)} points
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
