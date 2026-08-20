"use client";

import { useState, useEffect } from "react";
import { Server, RefreshCw } from "lucide-react";
import DataTable, { type Column } from "@/components/DataTable";

interface Equipment { id: number; category: number; categoryLabel: string; type: number; name: string; vosName: string; configSerialId: number; createTime: number; accessTime: number; accessIp: string; socketId: number; memo: string; }

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchEquipment = async () => {
    setLoading(true); setError("");
    try { const r=await fetch("/api/vos/equipment"); const d=await r.json(); if(d.error)setError(d.error); else setEquipment(d.equipment||[]); } catch { setError("Failed"); }
    finally { setLoading(false); }
  };

  useEffect(()=>{fetchEquipment();},[]);

  const fmtTime = (t:number) => t ? new Date(t).toLocaleString("en-US", { year:"numeric", month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" }) : "—";

  const columns: Column<Equipment>[] = [
    { key: "id", label: "#", render: (e) => <span className="text-surface-500 text-xs">{e.id}</span> },
    { key: "name", label: "Name", cellClassName: "text-surface-50 font-medium" },
    { key: "categoryLabel", label: "Category", render: (e) => <span className="px-2 py-0.5 rounded text-[11px] bg-brand-500/10 text-brand-400">{e.categoryLabel}</span> },
    { key: "vosName", label: "VOS Name", render: (e) => e.vosName || "—" },
    { key: "configSerialId", label: "Config Serial", textAlign: "center" as const, render: (e) => e.configSerialId || "—" },
    { key: "accessIp", label: "Access IP", render: (e) => <span className="font-mono text-xs">{e.accessIp || "—"}</span> },
    { key: "accessTime", label: "Last Access", render: (e) => <span className="text-xs text-surface-400">{fmtTime(e.accessTime)}</span> },
    { key: "socketId", label: "Socket", textAlign: "center" as const, render: (e) => e.socketId || "—" },
    { key: "memo", label: "Memo", render: (e) => e.memo || "—", cellClassName: "text-surface-400" },
  ];

  const online = equipment.filter(e => e.accessTime > Date.now() - 1000 * 60 * 60).length;

  return (<div className="p-6 space-y-6">
    <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-surface-50">Web Service Equipment</h1><p className="text-surface-400 text-sm mt-1">{equipment.length} registered devices • {online} active</p></div>
    <button onClick={fetchEquipment} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-800 text-surface-300 hover:bg-surface-700 text-sm"><RefreshCw className={`w-4 h-4 ${loading?"animate-spin":""}`}/>Refresh</button></div>

    {error&&<div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

    <DataTable columns={columns} data={equipment} searchKey="name" loading={loading} emptyMessage="No equipment registered" emptyIcon={<Server className="w-10 h-10 text-surface-600" />} pageSize={20} />
  </div>);
}
