"use client";

import { useState, useEffect } from "react";
import { Bell, RefreshCw, CheckCircle2 } from "lucide-react";
import DataTable, { type Column } from "@/components/DataTable";

interface Alarm { id: number; name: string; value: number; level: number; type: number; time: number; status: number; }

const LEVEL_LABELS: Record<number, string> = { 1: "Info", 2: "Warning", 3: "Critical" };
const LEVEL_COLORS: Record<number, string> = {
  1: "bg-blue-500/10 text-blue-400",
  2: "bg-amber-500/10 text-amber-400",
  3: "bg-red-500/10 text-red-400",
};

export default function CurrentAlarmsPage() {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAlarms = async () => {
    setLoading(true); setError("");
    try { const r=await fetch("/api/vos/alarms"); const d=await r.json(); if(d.error)setError(d.error); else setAlarms(d.alarms||[]); } catch { setError("Failed"); }
    finally { setLoading(false); }
  };

  useEffect(()=>{fetchAlarms();},[]);

  const fmtTime = (t:number) => t ? new Date(t * 1000).toLocaleString("en-US", { year:"numeric", month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" }) : "—";

  const columns: Column<Alarm>[] = [
    { key: "id", label: "#", render: (a) => <span className="text-surface-500 text-xs">{a.id}</span> },
    { key: "name", label: "Alarm", cellClassName: "text-surface-50 font-medium" },
    { key: "value", label: "Value", textAlign: "right" as const, render: (a) => <span className="font-mono text-xs">{a.value}</span> },
    { key: "level", label: "Level", textAlign: "center" as const, render: (a) => <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${LEVEL_COLORS[a.level] || "bg-surface-800 text-surface-400"}`}>{LEVEL_LABELS[a.level] || `Level ${a.level}`}</span> },
    { key: "time", label: "Start Time", render: (a) => <span className="text-xs text-surface-400">{fmtTime(a.time)}</span> },
    { key: "status", label: "Status", textAlign: "center" as const, render: (a) => (
      <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${a.status === 0 ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}>
        {a.status === 0 ? "Active" : "Cleared"}
      </span>
    )},
  ];

  const critical = alarms.filter(a => a.level >= 3).length;

  return (<div className="p-6 space-y-6">
    <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-surface-50">Current Alarm</h1><p className="text-surface-400 text-sm mt-1">{alarms.length} active alarms {critical > 0 && `• ${critical} critical`}</p></div>
    <button onClick={fetchAlarms} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-800 text-surface-300 hover:bg-surface-700 text-sm"><RefreshCw className={`w-4 h-4 ${loading?"animate-spin":""}`}/>Refresh</button></div>

    {error&&<div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

    {alarms.length === 0 && !loading && !error && (
      <div className="bg-surface-900 border border-surface-700/50 rounded-xl p-12 text-center">
        <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
        <p className="text-surface-400">No active alarms — all systems normal</p>
      </div>
    )}

    <DataTable columns={columns} data={alarms} searchKey="name" loading={loading} emptyMessage="No active alarms" emptyIcon={<Bell className="w-10 h-10 text-surface-600" />} pageSize={20} />
  </div>);
}
