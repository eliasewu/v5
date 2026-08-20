"use client";

import { useState, useEffect } from "react";
import { PhoneCall, RefreshCw } from "lucide-react";
import DataTable, { type Column } from "@/components/DataTable";

interface RegPhone { id: number; e164: string; displaynum: string; locktype: number; calllevel: number; customer_id: number; customerName: string; feerategroup_id: number; memo: string; }

export default function RegistrationPage() {
  const [phones, setPhones] = useState<RegPhone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPhones = async () => {
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/vos/phones");
      const d = await r.json();
      if (d.error) setError(d.error); else setPhones(d.phones || []);
    } catch { setError("Failed"); }
    finally { setLoading(false); }
  };

  useEffect(()=>{fetchPhones();},[]);

  const columns: Column<RegPhone>[] = [
    { key: "e164", label: "E164", cellClassName: "text-surface-50 font-mono font-medium text-xs" },
    { key: "displaynum", label: "Display Number", render: (p) => p.displaynum || "—" },
    { key: "customerName", label: "Account", render: (p) => p.customerName || "—" },
    { key: "calllevel", label: "Call Level", textAlign: "center" as const, render: (p) => <span className="px-2 py-0.5 rounded text-[11px] bg-surface-800 text-surface-400">{p.calllevel}</span> },
    { key: "locktype", label: "Status", textAlign: "center" as const, render: (p) => (
      <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${p.locktype === 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
        {p.locktype === 0 ? "Active" : "Locked"}
      </span>
    )},
    { key: "memo", label: "Memo", render: (p) => p.memo || "—", cellClassName: "text-surface-400" },
  ];

  return (<div className="p-6 space-y-6">
    <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-surface-50">Registration Management</h1><p className="text-surface-400 text-sm mt-1">{phones.length} registered phone terminals</p></div>
    <button onClick={fetchPhones} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-800 text-surface-300 hover:bg-surface-700 text-sm"><RefreshCw className={`w-4 h-4 ${loading?"animate-spin":""}`}/>Refresh</button></div>

    {error&&<div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

    <DataTable columns={columns} data={phones} searchKey="e164" loading={loading} emptyMessage="No registered phones" emptyIcon={<PhoneCall className="w-10 h-10 text-surface-600" />} pageSize={20} />
  </div>);
}
