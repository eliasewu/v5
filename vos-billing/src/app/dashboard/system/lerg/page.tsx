"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, RefreshCw, Database } from "lucide-react";
import DataTable, { type Column } from "@/components/DataTable";

interface LergRecord {
  id: number; state: string; npanxx: string; ocn: string; company: string; ratecenter: string;
  effectivedate: string; used: string; assigndate: string; initialorgrowth: string;
}

export default function LergPage() {
  const [records, setRecords] = useState<LergRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const q = new URLSearchParams({ limit: "300" });
      if (search.trim()) q.set("search", search.trim());
      const r = await fetch(`/api/vos/lerg?${q.toString()}`); const d = await r.json();
      if (d.error) setError(d.error); else { setRecords(d.records || []); setTotal(d.total || 0); }
    } catch { setError("Failed"); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns: Column<LergRecord>[] = [
    { key: "npanxx", label: "NPA-NXX", cellClassName: "font-mono text-surface-50 font-medium text-xs" },
    { key: "state", label: "State", render: (r) => r.state || "—" },
    { key: "company", label: "Company", render: (r) => r.company || "—", cellClassName: "text-surface-400" },
    { key: "ratecenter", label: "Rate Center", render: (r) => r.ratecenter || "—" },
    { key: "ocn", label: "OCN", render: (r) => r.ocn || "—", cellClassName: "font-mono text-surface-400" },
    { key: "effectivedate", label: "Effective Date", render: (r) => r.effectivedate || "—" },
    { key: "used", label: "Used", textAlign: "center" as const, render: (r) => r.used || "—" },
  ];

  return (<div className="p-6 space-y-6">
    <div className="flex items-center justify-between">
      <div><h1 className="text-2xl font-bold text-surface-50">LERG Database</h1><p className="text-surface-400 text-sm mt-1">{total} records — US number portability (NPA-NXX) reference</p></div>
      <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-800 text-surface-300 hover:bg-surface-700 text-sm"><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />Refresh</button>
    </div>

    <div className="flex items-end gap-3">
      <div className="flex-1 max-w-md"><label className="block text-xs font-medium text-surface-400 mb-1">Search (NPA-NXX, state, company, rate center)</label>
        <div className="flex gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => { if (e.key === "Enter") fetchData(); }} placeholder="e.g. 212 or New York" className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm" />
          <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-surface-50 text-sm font-medium"><Search className="w-4 h-4" />Query</button>
        </div>
      </div>
    </div>

    {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

    <DataTable columns={columns} data={records} searchKey="npanxx" loading={loading} emptyMessage="No LERG records — import the LERG database into VOS3000 first" emptyIcon={<Database className="w-10 h-10 text-surface-600" />} pageSize={20} />
  </div>);
}
