"use client";

import { useState, useEffect } from "react";
import { History, RefreshCw } from "lucide-react";
import DataTable, { type Column } from "@/components/DataTable";

interface HistAlarm { id: number; moId: number; moType: number; name: string; type: number; level: number; levelLabel: string; startTime: number; stopTime: number; value: number; upper: number; lower: number; confirmUser: string; confirmTime: number; confirmMemo: string; clearUser: string; clearTime: number; }

const LEVEL_COLORS: Record<number, string> = {
  1: "bg-blue-500/10 text-blue-400",
  2: "bg-amber-500/10 text-amber-400",
  3: "bg-red-500/10 text-red-400",
};

export default function AlarmHistoryPage() {
  const [alarms, setAlarms] = useState<HistAlarm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [levelFilter, setLevelFilter] = useState("");

  const fetchAlarms = async () => {
    setLoading(true); setError("");
    try {
      const q = levelFilter ? `?level=${levelFilter}` : "";
      const r=await fetch(`/api/vos/alarm-history${q}`); const d=await r.json();
      if(d.error)setError(d.error); else setAlarms(d.alarms||[]);
    } catch { setError("Failed"); }
    finally { setLoading(false); }
  };

  useEffect(()=>{fetchAlarms();},[levelFilter]);

  const fmtTime = (t:number) => t ? new Date(t * 1000).toLocaleString("en-US", { year:"numeric", month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" }) : "—";

  const columns: Column<HistAlarm>[] = [
    { key: "id", label: "#", render: (a) => <span className="text-surface-500 text-xs">{a.id}</span> },
    { key: "name", label: "Alarm", cellClassName: "text-surface-50 font-medium" },
    { key: "level", label: "Level", textAlign: "center" as const, render: (a) => <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${LEVEL_COLORS[a.level] || "bg-surface-800 text-surface-400"}`}>{a.levelLabel}</span> },
    { key: "value", label: "Value", textAlign: "right" as const, render: (a) => <span className="font-mono text-xs">{a.value}</span> },
    { key: "startTime", label: "Start", render: (a) => <span className="text-xs text-surface-400">{fmtTime(a.startTime)}</span> },
    { key: "stopTime", label: "Stop", render: (a) => <span className="text-xs text-surface-400">{fmtTime(a.stopTime)}</span> },
    { key: "confirmUser", label: "Confirmed By", render: (a) => a.confirmUser || "—" },
    { key: "clearUser", label: "Cleared By", render: (a) => a.clearUser || "—" },
  ];

  return (<div className="p-6 space-y-6">
    <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-surface-50">History Alarm</h1><p className="text-surface-400 text-sm mt-1">{alarms.length} historical alarms</p></div>
    <div className="flex items-center gap-2">
      <select value={levelFilter} onChange={e=>setLevelFilter(e.target.value)} className="px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm">
        <option value="">All Levels</option><option value="1">Info</option><option value="2">Warning</option><option value="3">Critical</option>
      </select>
      <button onClick={fetchAlarms} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-800 text-surface-300 hover:bg-surface-700 text-sm"><RefreshCw className={`w-4 h-4 ${loading?"animate-spin":""}`}/>Refresh</button>
    </div></div>

    {error&&<div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

    <DataTable columns={columns} data={alarms} searchKey="name" loading={loading} emptyMessage="No alarm history found" emptyIcon={<History className="w-10 h-10 text-surface-600" />} pageSize={20} />
  </div>);
}
