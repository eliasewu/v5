"use client";

import { useState, useEffect } from "react";
import { Eraser, RefreshCw } from "lucide-react";
import DataTable, { type Column } from "@/components/DataTable";

interface Rule { id: number; type: number; type_label: string; enabled: number; content: number; expiredays: number; }

export default function AutoCleanPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true); setError("");
    try { const r = await fetch("/api/vos/auto-clean"); const d = await r.json(); if (d.error) setError(d.error); else setRules(d.rules || []); }
    catch { setError("Failed"); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const updateRule = async (rule: Rule) => {
    setSavingId(rule.id); setError("");
    try {
      const r = await fetch("/api/vos/auto-clean", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(rule) });
      const d = await r.json();
      if (d.error) setError(d.error); else fetchData();
    } catch { setError("Failed"); }
    finally { setSavingId(null); }
  };

  const toggle = (rule: Rule) => updateRule({ ...rule, enabled: rule.enabled === 1 ? 0 : 1 });
  const setDays = (rule: Rule, days: number) => updateRule({ ...rule, expiredays: Math.max(0, days) });

  const columns: Column<Rule>[] = [
    { key: "type", label: "ID", textAlign: "center" as const, render: (r) => <span className="font-mono text-surface-500">{r.type}</span> },
    { key: "type_label", label: "Data Type", cellClassName: "text-surface-50 font-medium text-xs" },
    { key: "enabled", label: "Enabled", textAlign: "center" as const, render: (r) => (
      <button onClick={() => toggle(r)} disabled={savingId === r.id} className={`px-3 py-1 rounded-full text-xs font-medium border ${r.enabled === 1 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-surface-800 border-surface-700 text-surface-500"}`}>
        {r.enabled === 1 ? "Enabled" : "Disabled"}
      </button>
    )},
    { key: "content", label: "Cleanup Scope", textAlign: "center" as const, render: (r) => r.content === 0 ? "All" : `Type ${r.content}` },
    { key: "expiredays", label: "Keep (days)", textAlign: "center" as const, render: (r) => (
      <input type="number" min={0} value={r.expiredays} onChange={e => setDays(r, parseInt(e.target.value) || 0)} disabled={savingId === r.id}
        className="w-20 px-2 py-1 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm text-center" />
    )},
  ];

  return (<div className="p-6 space-y-6">
    <div className="flex items-center justify-between">
      <div><h1 className="text-2xl font-bold text-surface-50">Auto Clean Settings</h1><p className="text-surface-400 text-sm mt-1">Automatic cleanup of old history data (CDRs, logs, records)</p></div>
      <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-800 text-surface-300 hover:bg-surface-700 text-sm"><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />Refresh</button>
    </div>

    {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
    {rules.length === 0 && !loading && (
      <div className="p-6 rounded-2xl bg-surface-900/60 border border-surface-800 text-center">
        <Eraser className="w-10 h-10 text-surface-600 mx-auto mb-3" />
        <p className="text-surface-400 text-sm">No auto-clean rules defined yet. VOS3000 creates these when the feature is enabled from the core.</p>
      </div>
    )}

    <DataTable columns={columns} data={rules} loading={loading} emptyMessage="No auto-clean rules" emptyIcon={<Eraser className="w-10 h-10 text-surface-600" />} pageSize={20} />
  </div>);
}
