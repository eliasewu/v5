"use client";

import { useState, useEffect } from "react";
import { Network, RefreshCw, Wifi, WifiOff, Server, Lock } from "lucide-react";
import DataTable, { type Column } from "@/components/DataTable";

interface GatewayStatus {
  id: number; name: string; type: string; ips: string; port: number; capacity: number; prefix: string;
  locktype: number; online: boolean; responseTime: number | null; error: string | null; checkedAt: string;
}

export default function NetworkTestPage() {
  const [gateways, setGateways] = useState<GatewayStatus[]>([]);
  const [summary, setSummary] = useState<{ total: number; online: number; offline: number; locked: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStatus = async () => {
    setLoading(true); setError("");
    try { const r=await fetch("/api/vos/gateway-ping"); const d=await r.json(); if(d.error)setError(d.error); else { setGateways(d.gateways||[]); setSummary(d.summary); } } catch { setError("Failed"); }
    finally { setLoading(false); }
  };

  useEffect(()=>{fetchStatus();},[]);

  const columns: Column<GatewayStatus>[] = [
    { key: "name", label: "Gateway", cellClassName: "text-surface-50 font-medium" },
    { key: "type", label: "Type", textAlign: "center" as const, render: (g) => <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${g.type === "mapping" ? "bg-blue-500/10 text-blue-400" : "bg-violet-500/10 text-violet-400"}`}>{g.type === "mapping" ? "Mapping" : "Routing"}</span> },
    { key: "ips", label: "IP Address", render: (g) => <span className="font-mono text-xs">{g.ips.split(",")[0].trim() || "—"}</span> },
    { key: "port", label: "Port", textAlign: "center" as const, render: (g) => <span className="font-mono text-xs">{g.port}</span> },
    { key: "capacity", label: "Capacity", textAlign: "right" as const, render: (g) => <span className="font-mono text-xs">{g.capacity}</span> },
    { key: "locktype", label: "Locked", textAlign: "center" as const, render: (g) => g.locktype !== 0 ? <Lock className="w-3.5 h-3.5 text-amber-400 mx-auto" /> : <span className="text-surface-600">—</span> },
    { key: "online", label: "Status", textAlign: "center" as const, render: (g) => (
      g.online ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400"><Wifi className="w-3 h-3"/>Online</span>
      ) : (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-red-500/10 text-red-400"><WifiOff className="w-3 h-3"/>Offline</span>
      )
    )},
    { key: "responseTime", label: "Response", textAlign: "right" as const, render: (g) => g.responseTime !== null ? <span className="font-mono text-xs text-emerald-400">{g.responseTime}ms</span> : <span className="text-surface-600 text-xs">—</span> },
  ];

  return (<div className="p-6 space-y-6">
    <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-surface-50">Network Test</h1><p className="text-surface-400 text-sm mt-1">Ping reachability of all gateways</p></div>
    <button onClick={fetchStatus} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-800 text-surface-300 hover:bg-surface-700 text-sm"><RefreshCw className={`w-4 h-4 ${loading?"animate-spin":""}`}/>Test Again</button></div>

    {summary && <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="bg-surface-900 border border-surface-700/50 rounded-xl p-5"><p className="text-xs text-surface-500 mb-1">Total Gateways</p><p className="text-2xl font-bold text-surface-50">{summary.total}</p></div>
      <div className="bg-surface-900 border border-surface-700/50 rounded-xl p-5"><p className="text-xs text-surface-500 mb-1">Online</p><p className="text-2xl font-bold text-emerald-400">{summary.online}</p></div>
      <div className="bg-surface-900 border border-surface-700/50 rounded-xl p-5"><p className="text-xs text-surface-500 mb-1">Offline</p><p className="text-2xl font-bold text-red-400">{summary.offline}</p></div>
      <div className="bg-surface-900 border border-surface-700/50 rounded-xl p-5"><p className="text-xs text-surface-500 mb-1">Locked</p><p className="text-2xl font-bold text-amber-400">{summary.locked}</p></div>
    </div>}

    {error&&<div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

    <DataTable columns={columns} data={gateways} searchKey="name" loading={loading} emptyMessage="No gateways found" emptyIcon={<Network className="w-10 h-10 text-surface-600" />} pageSize={20} />
  </div>);
}
