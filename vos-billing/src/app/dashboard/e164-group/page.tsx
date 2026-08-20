"use client";

import { useState, useEffect } from "react";
import { Hash, RefreshCw, Plus, Edit2, Trash2, X, Link2 } from "lucide-react";
import DataTable, { type Column } from "@/components/DataTable";

interface Group { id: number; routinggatewaycalleee164: string; phonee164: string; mappinggatewaycallere164: string; memo: string; }

export default function E164GroupPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Group | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ routinggatewaycalleee164: "", phonee164: "", mappinggatewaycallere164: "", memo: "" });

  const fetchData = async () => {
    setLoading(true); setError("");
    try { const r = await fetch("/api/vos/e164-groups"); const d = await r.json(); if (d.error) setError(d.error); else setGroups(d.groups || []); }
    catch { setError("Failed"); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    setSaving(true); setError("");
    try {
      const method = editing ? "PUT" : "POST";
      const body = editing ? { id: editing.id, ...form } : form;
      const r = await fetch("/api/vos/e164-groups", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json();
      if (d.error) { setError(d.error); return; }
      setShowModal(false); setEditing(null); fetchData();
    } catch { setError("Failed"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this E164 group?")) return;
    try { await fetch(`/api/vos/e164-groups?id=${id}`, { method: "DELETE" }); fetchData(); } catch { }
  };

  const openEdit = (g: Group) => { setEditing(g); setForm({ routinggatewaycalleee164: g.routinggatewaycalleee164, phonee164: g.phonee164, mappinggatewaycallere164: g.mappinggatewaycallere164, memo: g.memo }); setShowModal(true); };
  const openAdd = () => { setEditing(null); setForm({ routinggatewaycalleee164: "", phonee164: "", mappinggatewaycallere164: "", memo: "" }); setShowModal(true); };

  const columns: Column<Group>[] = [
    { key: "phonee164", label: "Phone E164", cellClassName: "text-surface-50 font-mono font-medium text-xs" },
    { key: "routinggatewaycalleee164", label: "Routing Gateway Callee", render: (g) => g.routinggatewaycalleee164 || "—", cellClassName: "font-mono text-surface-400" },
    { key: "mappinggatewaycallere164", label: "Mapping Gateway Caller", render: (g) => g.mappinggatewaycallere164 || "—", cellClassName: "font-mono text-surface-400" },
    { key: "memo", label: "Memo", render: (g) => g.memo || "—", cellClassName: "text-surface-400" },
    { key: "actions", label: "Actions", textAlign: "center", width: "90px", render: (g) => (
      <div className="flex items-center justify-center gap-1">
        <button onClick={() => openEdit(g)} className="p-1.5 rounded hover:bg-surface-700 text-surface-400 hover:text-surface-50"><Edit2 className="w-3.5 h-3.5" /></button>
        <button onClick={() => handleDelete(g.id)} className="p-1.5 rounded hover:bg-red-500/10 text-surface-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    )},
  ];

  return (<div className="p-6 space-y-6">
    <div className="flex items-center justify-between">
      <div><h1 className="text-2xl font-bold text-surface-50">E164 Group Management</h1><p className="text-surface-400 text-sm mt-1">{groups.length} E164 groups — bind phone numbers to routing/mapping gateway E164s</p></div>
      <div className="flex items-center gap-2">
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium"><Plus className="w-4 h-4" />Add Group</button>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-800 text-surface-300 hover:bg-surface-700 text-sm"><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />Refresh</button>
      </div>
    </div>

    {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

    <DataTable columns={columns} data={groups} searchKey="phonee164" loading={loading} emptyMessage="No E164 groups" emptyIcon={<Link2 className="w-10 h-10 text-surface-600" />} pageSize={20} />

    {showModal && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"><div className="bg-surface-900 border border-surface-700 rounded-2xl w-full max-w-md mx-4">
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-800"><h2 className="text-lg font-semibold text-surface-50 flex items-center gap-2"><Hash className="w-4 h-4 text-brand-400" />{editing ? "Edit E164 Group" : "Add E164 Group"}</h2><button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-surface-800 text-surface-500 hover:text-surface-50"><X className="w-5 h-5" /></button></div>
      <div className="px-6 py-4 space-y-4">
        <div><label className="block text-xs font-medium text-surface-400 mb-1">Phone E164</label><input value={form.phonee164} onChange={e => setForm({ ...form, phonee164: e.target.value })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm font-mono" placeholder="e.g. 8613800138000" /></div>
        <div><label className="block text-xs font-medium text-surface-400 mb-1">Routing Gateway Callee E164</label><input value={form.routinggatewaycalleee164} onChange={e => setForm({ ...form, routinggatewaycalleee164: e.target.value })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm font-mono" /></div>
        <div><label className="block text-xs font-medium text-surface-400 mb-1">Mapping Gateway Caller E164</label><input value={form.mappinggatewaycallere164} onChange={e => setForm({ ...form, mappinggatewaycallere164: e.target.value })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm font-mono" /></div>
        <div><label className="block text-xs font-medium text-surface-400 mb-1">Memo</label><input value={form.memo} onChange={e => setForm({ ...form, memo: e.target.value })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm" /></div>
      </div>
      <div className="px-6 py-4 border-t border-surface-800 flex gap-3">
        <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-surface-700 text-surface-300 rounded-lg text-sm hover:bg-surface-800">Cancel</button>
        <button onClick={handleSave} disabled={saving || (!form.phonee164 && !form.routinggatewaycalleee164)} className="flex-1 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-surface-50 rounded-lg text-sm font-medium disabled:opacity-50">{saving ? "Saving..." : editing ? "Update" : "Create"}</button>
      </div>
    </div></div>)}
  </div>);
}
