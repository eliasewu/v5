"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, RefreshCw, PhoneForwarded } from "lucide-react";
import DataTable, { type Column } from "@/components/DataTable";

interface AxbCdr {
  id: number; callere164: string; callergatewayid: string; callertype: number; calleegatewayid: string;
  anumber: string; xnumber: string; bnumber: string; starttime: number; stoptime: number; holdtime: number;
  enddirection: number; endreason: number; fee: number; feetime: number; customeraccount: string; customername: string;
  agentfee: number; agentaccount: string; agentname: string; xfee: number; xaccount: string; xaccountname: string; xinterface: string;
}

function fmtTime(ts: number): string {
  if (!ts) return "—";
  return new Date(ts * 1000).toLocaleString();
}

export default function AxbCdrPage() {
  const [cdrs, setCdrs] = useState<AxbCdr[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [total, setTotal] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [search, setSearch] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true); setError(""); setNote("");
    try {
      const q = new URLSearchParams({ date, limit: "200" });
      if (search.trim()) q.set("search", search.trim());
      const r = await fetch(`/api/vos/axb-cdrs?${q.toString()}`); const d = await r.json();
      if (d.error) setError(d.error); else { setCdrs(d.cdrs || []); setTotal(d.total || 0); setNote(d.note || ""); }
    } catch { setError("Failed"); }
    finally { setLoading(false); }
  }, [date, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns: Column<AxbCdr>[] = [
    { key: "starttime", label: "Start Time", render: (c) => <span className="text-xs text-surface-400">{fmtTime(c.starttime)}</span> },
    { key: "anumber", label: "A Number", cellClassName: "font-mono text-surface-50 text-xs" },
    { key: "xnumber", label: "X Number", cellClassName: "font-mono text-brand-400 text-xs" },
    { key: "bnumber", label: "B Number", cellClassName: "font-mono text-surface-50 text-xs" },
    { key: "holdtime", label: "Duration", textAlign: "center" as const, render: (c) => c.holdtime ? `${Math.round(c.holdtime / 60)}m ${c.holdtime % 60}s` : "—" },
    { key: "fee", label: "Fee", textAlign: "right" as const, render: (c) => c.fee ? <span className="font-medium text-emerald-400">${c.fee.toFixed(4)}</span> : "—" },
    { key: "customername", label: "Customer", render: (c) => c.customername || c.customeraccount || "—", cellClassName: "text-surface-400" },
    { key: "endreason", label: "End Reason", textAlign: "center" as const, render: (c) => c.endreason || "—" },
  ];

  return (<div className="p-6 space-y-6">
    <div className="flex items-center justify-between">
      <div><h1 className="text-2xl font-bold text-surface-50">AXB CDR Query</h1><p className="text-surface-400 text-sm mt-1">{total} records</p></div>
      <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-800 text-surface-300 hover:bg-surface-700 text-sm"><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />Refresh</button>
    </div>

    <div className="flex items-end gap-3">
      <div><label className="block text-xs font-medium text-surface-400 mb-1">Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm" /></div>
      <div className="flex-1 max-w-md"><label className="block text-xs font-medium text-surface-400 mb-1">Search (A/X/B number, customer)</label>
        <div className="flex gap-2">
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => { if (e.key === "Enter") fetchData(); }} placeholder="e.g. 12025550123" className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm font-mono" />
          <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-surface-50 text-sm font-medium"><Search className="w-4 h-4" />Query</button>
        </div>
      </div>
    </div>

    {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
    {note && <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">{note}</div>}

    <DataTable columns={columns} data={cdrs} searchKey="xnumber" loading={loading} emptyMessage="No AXB CDR records for this date" emptyIcon={<PhoneForwarded className="w-10 h-10 text-surface-600" />} pageSize={20} />
  </div>);
}
