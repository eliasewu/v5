"use client";

import { useState, useEffect } from "react";
import { ScrollText, RefreshCw } from "lucide-react";
import DataTable, { type Column } from "@/components/DataTable";

interface SysLog { id: number; type: number; typeLabel: string; time: number; source: string; event: string; format: string; memo: string; infoOld: string; infoNew: string; }

export default function SystemLogPage() {
  const [logs, setLogs] = useState<SysLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLogs = async () => {
    setLoading(true); setError("");
    try { const r=await fetch("/api/vos/system-log"); const d=await r.json(); if(d.error)setError(d.error); else setLogs(d.logs||[]); } catch { setError("Failed"); }
    finally { setLoading(false); }
  };

  useEffect(()=>{fetchLogs();},[]);

  const fmtTime = (t:number) => t ? new Date(t * 1000).toLocaleString("en-US", { year:"numeric", month:"short", day:"numeric", hour:"2-digit", minute:"2-digit", second:"2-digit" }) : "—";

  const typeColor = (t:number) => t === 3 ? "bg-red-500/10 text-red-400" : t === 2 ? "bg-amber-500/10 text-amber-400" : t === 4 ? "bg-violet-500/10 text-violet-400" : "bg-surface-800 text-surface-400";

  const columns: Column<SysLog>[] = [
    { key: "id", label: "#", render: (l) => <span className="text-surface-500 text-xs">{l.id}</span> },
    { key: "time", label: "Time", render: (l) => <span className="text-xs text-surface-400">{fmtTime(l.time)}</span> },
    { key: "typeLabel", label: "Type", textAlign: "center" as const, render: (l) => <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${typeColor(l.type)}`}>{l.typeLabel}</span> },
    { key: "source", label: "Source", render: (l) => <span className="font-mono text-xs">{l.source || "—"}</span> },
    { key: "event", label: "Event", render: (l) => <span className="max-w-[260px] truncate block" title={l.event||""}>{l.event || "—"}</span> },
    { key: "memo", label: "Memo", render: (l) => <span className="max-w-[200px] truncate block" title={l.memo||""}>{l.memo || "—"}</span>, cellClassName: "text-surface-400" },
  ];

  return (<div className="p-6 space-y-6">
    <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-surface-50">System Log</h1><p className="text-surface-400 text-sm mt-1">{logs.length} recent system log entries</p></div>
    <button onClick={fetchLogs} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-800 text-surface-300 hover:bg-surface-700 text-sm"><RefreshCw className={`w-4 h-4 ${loading?"animate-spin":""}`}/>Refresh</button></div>

    {error&&<div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

    <DataTable columns={columns} data={logs} searchKey="event" loading={loading} emptyMessage="No system log entries" emptyIcon={<ScrollText className="w-10 h-10 text-surface-600" />} pageSize={20} />
  </div>);
}
