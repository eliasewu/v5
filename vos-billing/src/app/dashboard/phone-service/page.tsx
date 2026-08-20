"use client";

import { useState, useEffect } from "react";
import { PhoneCall, RefreshCw, Plus, Edit2, Trash2, X } from "lucide-react";
import DataTable, { type Column } from "@/components/DataTable";

interface Svc { id: number; name: string; vosname: string; configserialid: number; createtime: number; accesstime: number; accessip: string; socketid: number; memo: string; }

export default function PhoneServicePage() {
  const [services, setServices] = useState<Svc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Svc | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", vosname: "", configserialid: 0, accessip: "", socketid: 0, memo: "" });

  const fetchData = async () => {
    setLoading(true); setError("");
    try { const r = await fetch("/api/vos/phone-services"); const d = await r.json(); if (d.error) setError(d.error); else setServices(d.services || []); }
    catch { setError("Failed"); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    setSaving(true); setError("");
    try {
      const method = editing ? "PUT" : "POST";
      const body = editing ? { id: editing.id, ...form } : form;
      const r = await fetch("/api/vos/phone-services", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json();
      if (d.error) { setError(d.error); return; }
      setShowModal(false); setEditing(null); fetchData();
    } catch { setError("Failed"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this phone service?")) return;
    try { await fetch(`/api/vos/phone-services?id=${id}`, { method: "DELETE" }); fetchData(); } catch { }
  };

  const openEdit = (s: Svc) => { setEditing(s); setForm({ name: s.name, vosname: s.vosname, configserialid: s.configserialid, accessip: s.accessip, socketid: s.socketid, memo: s.memo }); setShowModal(true); };
  const openAdd = () => { setEditing(null); setForm({ name: "", vosname: "", configserialid: 0, accessip: "", socketid: 0, memo: "" }); setShowModal(true); };

  const columns: Column<Svc>[] = [
    { key: "name", label: "Name", cellClassName: "text-surface-50 font-medium text-xs" },
    { key: "vosname", label: "VOS Name", render: (s) => s.vosname || "—", cellClassName: "font-mono text-surface-400" },
    { key: "accessip", label: "Access IP", render: (s) => s.accessip || "—" },
    { key: "configserialid", label: "Config ID", textAlign: "center" as const, render: (s) => s.configserialid || "—" },
    { key: "socketid", label: "Socket ID", textAlign: "center" as const, render: (s) => s.socketid || "—" },
    { key: "memo", label: "Memo", render: (s) => s.memo || "—", cellClassName: "text-surface-400" },
    { key: "actions", label: "Actions", textAlign: "center", width: "90px", render: (s) => (
      <div className="flex items-center justify-center gap-1">
        <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-surface-700 text-surface-400 hover:text-surface-50"><Edit2 className="w-3.5 h-3.5" /></button>
        <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded hover:bg-red-500/10 text-surface-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    )},
  ];

  return (<div className="p-6 space-y-6">
    <div className="flex items-center justify-between">
      <div><h1 className="text-2xl font-bold text-surface-50">Phone Service Management</h1><p className="text-surface-400 text-sm mt-1">{services.length} phone services</p></div>
      <div className="flex items-center gap-2">
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium"><Plus className="w-4 h-4" />Add Service</button>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-800 text-surface-300 hover:bg-surface-700 text-sm"><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />Refresh</button>
      </div>
    </div>

    {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

    <DataTable columns={columns} data={services} searchKey="name" loading={loading} emptyMessage="No phone services" emptyIcon={<PhoneCall className="w-10 h-10 text-surface-600" />} pageSize={20} />

    {showModal && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"><div className="bg-surface-900 border border-surface-700 rounded-2xl w-full max-w-md mx-4">
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-800"><h2 className="text-lg font-semibold text-surface-50">{editing ? "Edit Phone Service" : "Add Phone Service"}</h2><button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-surface-800 text-surface-500 hover:text-surface-50"><X className="w-5 h-5" /></button></div>
      <div className="px-6 py-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-xs font-medium text-surface-400 mb-1">Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm" /></div>
          <div><label className="block text-xs font-medium text-surface-400 mb-1">VOS Name</label><input value={form.vosname} onChange={e => setForm({ ...form, vosname: e.target.value })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm font-mono" /></div>
          <div><label className="block text-xs font-medium text-surface-400 mb-1">Access IP</label><input value={form.accessip} onChange={e => setForm({ ...form, accessip: e.target.value })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm font-mono" /></div>
          <div><label className="block text-xs font-medium text-surface-400 mb-1">Config Serial ID</label><input type="number" value={form.configserialid} onChange={e => setForm({ ...form, configserialid: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm" /></div>
          <div><label className="block text-xs font-medium text-surface-400 mb-1">Socket ID</label><input type="number" value={form.socketid} onChange={e => setForm({ ...form, socketid: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm" /></div>
          <div className="col-span-2"><label className="block text-xs font-medium text-surface-400 mb-1">Memo</label><input value={form.memo} onChange={e => setForm({ ...form, memo: e.target.value })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm" /></div>
        </div>
      </div>
      <div className="px-6 py-4 border-t border-surface-800 flex gap-3">
        <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-surface-700 text-surface-300 rounded-lg text-sm hover:bg-surface-800">Cancel</button>
        <button onClick={handleSave} disabled={!form.name || saving} className="flex-1 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-surface-50 rounded-lg text-sm font-medium disabled:opacity-50">{saving ? "Saving..." : editing ? "Update" : "Create"}</button>
      </div>
    </div></div>)}
  </div>);
}
