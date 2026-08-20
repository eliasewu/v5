"use client";

import { useState, useEffect } from "react";
import { Globe, RefreshCw, Plus, Edit2, Trash2, X } from "lucide-react";
import DataTable, { type Column } from "@/components/DataTable";

interface Domain { id: number; domain: string; ip: string; type: number; updateTime: string; memo: string; }

export default function DomainManagementPage() {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Domain | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ domain:"", ip:"", type:0, memo:"" });

  const fetchDomains = async () => {
    setLoading(true); setError("");
    try { const r=await fetch("/api/vos/domains"); const d=await r.json(); if(d.error)setError(d.error); else setDomains(d.domains||[]); } catch { setError("Failed"); }
    finally { setLoading(false); }
  };

  useEffect(()=>{fetchDomains();},[]);

  const handleSave = async () => {
    setSaving(true); setError("");
    try {
      const method = editing ? "PUT" : "POST";
      const body = editing ? { id: editing.id, ...form } : form;
      const r = await fetch("/api/vos/domains", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json();
      if (d.error) { setError(d.error); return; }
      setShowModal(false); setEditing(null); fetchDomains();
    } catch { setError("Failed"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id:number) => {
    if(!confirm("Delete this domain?"))return;
    try { await fetch(`/api/vos/domains?id=${id}`,{method:"DELETE"}); fetchDomains(); } catch {}
  };

  const openEdit = (d:Domain) => { setEditing(d); setForm({ domain:d.domain, ip:d.ip, type:d.type, memo:d.memo||"" }); setShowModal(true); };
  const openAdd = () => { setEditing(null); setForm({ domain:"", ip:"", type:0, memo:"" }); setShowModal(true); };

  const columns: Column<Domain>[] = [
    { key: "domain", label: "Domain", cellClassName: "text-surface-50 font-medium" },
    { key: "ip", label: "IP Address", render: (d) => <span className="font-mono text-xs">{d.ip || "—"}</span> },
    { key: "type", label: "Type", textAlign: "center" as const, render: (d) => <span className="px-2 py-0.5 rounded text-[11px] bg-surface-800 text-surface-400">Type {d.type}</span> },
    { key: "updateTime", label: "Updated", render: (d) => <span className="text-xs text-surface-400">{d.updateTime ? new Date(d.updateTime).toLocaleString() : "—"}</span> },
    { key: "memo", label: "Memo", render: (d) => d.memo || "—", cellClassName: "text-surface-400" },
    { key: "actions", label: "Actions", textAlign: "center", width: "96px", render: (d) => (
      <div className="flex items-center justify-center gap-1">
        <button onClick={()=>openEdit(d)} className="p-1.5 rounded hover:bg-surface-700 text-surface-400 hover:text-surface-50"><Edit2 className="w-3.5 h-3.5"/></button>
        <button onClick={()=>handleDelete(d.id)} className="p-1.5 rounded hover:bg-red-500/10 text-surface-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5"/></button>
      </div>
    )},
  ];

  return (<div className="p-6 space-y-6">
    <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-surface-50">Domain Management</h1><p className="text-surface-400 text-sm mt-1">{domains.length} DNS entries</p></div>
    <div className="flex items-center gap-2"><button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium"><Plus className="w-4 h-4"/>Add Domain</button><button onClick={fetchDomains} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-800 text-surface-300 hover:bg-surface-700 text-sm"><RefreshCw className={`w-4 h-4 ${loading?"animate-spin":""}`}/>Refresh</button></div></div>

    {error&&<div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

    <DataTable columns={columns} data={domains} searchKey="domain" loading={loading} emptyMessage="No domains found" emptyIcon={<Globe className="w-10 h-10 text-surface-600" />} pageSize={20} />

    {showModal&&(<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"><div className="bg-surface-900 border border-surface-700 rounded-2xl w-full max-w-md mx-4">
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-800"><h2 className="text-lg font-semibold text-surface-50">{editing?"Edit Domain":"Add Domain"}</h2><button onClick={()=>setShowModal(false)} className="p-1.5 rounded-lg hover:bg-surface-800 text-surface-500 hover:text-surface-50"><X className="w-5 h-5"/></button></div>
      <div className="px-6 py-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-xs font-medium text-surface-400 mb-1">Domain *</label><input value={form.domain} onChange={e=>setForm({...form,domain:e.target.value})} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm font-mono"/></div>
          <div><label className="block text-xs font-medium text-surface-400 mb-1">IP Address</label><input value={form.ip} onChange={e=>setForm({...form,ip:e.target.value})} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm font-mono"/></div>
        </div>
        <div><label className="block text-xs font-medium text-surface-400 mb-1">Type</label><input type="number" value={form.type} onChange={e=>setForm({...form,type:parseInt(e.target.value)||0})} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm"/></div>
        <div><label className="block text-xs font-medium text-surface-400 mb-1">Memo</label><textarea value={form.memo} onChange={e=>setForm({...form,memo:e.target.value})} rows={2} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm resize-none"/></div>
      </div>
      <div className="px-6 py-4 border-t border-surface-800 flex gap-3"><button onClick={()=>setShowModal(false)} className="flex-1 px-4 py-2 border border-surface-700 text-surface-300 rounded-lg text-sm hover:bg-surface-800">Cancel</button><button onClick={handleSave} disabled={!form.domain||saving} className="flex-1 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-surface-50 rounded-lg text-sm font-medium disabled:opacity-50">{saving?"Saving...":editing?"Update":"Create"}</button></div>
    </div></div>)}
  </div>);
}
