"use client";

import { useState, useEffect } from "react";
import { Package, RefreshCw, Plus, Edit2, Trash2, X } from "lucide-react";
import DataTable, { type Column } from "@/components/DataTable";

interface Suite { id: number; name: string; rentperiod: number; renttype: number; renttype_label: string; nonholonomicorder: number; rentfee: number; minconsumption: number; lowerconsumption: number; giftmoney: number; memo: string; user_id: number; }

export default function SuitesPage() {
  const [suites, setSuites] = useState<Suite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Suite | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", rentperiod: 1, renttype: 0, nonholonomicorder: 0, rentfee: 0, minconsumption: 0, lowerconsumption: 0, giftmoney: 0, memo: "" });

  const fetchData = async () => {
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/vos/suites");
      const d = await r.json();
      if (d.error) setError(d.error); else setSuites(d.suites || []);
    } catch { setError("Failed"); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const openAdd = () => { setEditing(null); setForm({ name: "", rentperiod: 1, renttype: 0, nonholonomicorder: 0, rentfee: 0, minconsumption: 0, lowerconsumption: 0, giftmoney: 0, memo: "" }); setShowModal(true); };
  const openEdit = (s: Suite) => { setEditing(s); setForm({ name: s.name, rentperiod: s.rentperiod, renttype: s.renttype, nonholonomicorder: s.nonholonomicorder, rentfee: s.rentfee, minconsumption: s.minconsumption, lowerconsumption: s.lowerconsumption, giftmoney: s.giftmoney, memo: s.memo }); setShowModal(true); };

  const handleSave = async () => {
    setSaving(true); setError("");
    try {
      const method = editing ? "PUT" : "POST";
      const payload = editing ? { id: editing.id, ...form } : form;
      const r = await fetch("/api/vos/suites", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const d = await r.json();
      if (d.error) { setError(d.error); return; }
      setShowModal(false); setEditing(null); fetchData();
    } catch { setError("Failed"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this suite?")) return;
    try { await fetch(`/api/vos/suites?id=${id}`, { method: "DELETE" }); fetchData(); } catch { }
  };

  const fmtMoney = (n: number) => n ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—";

  const columns: Column<Suite>[] = [
    { key: "name", label: "Suite Name", cellClassName: "text-surface-50 font-medium text-xs" },
    { key: "rent", label: "Rent", render: (s) => `${s.rentperiod} ${s.renttype_label.toLowerCase()}(s)` },
    { key: "rentfee", label: "Rent Fee", textAlign: "right", render: (s) => fmtMoney(s.rentfee) },
    { key: "giftmoney", label: "Gift Money", textAlign: "right", render: (s) => fmtMoney(s.giftmoney) },
    { key: "minconsumption", label: "Min Consump.", textAlign: "right", render: (s) => fmtMoney(s.minconsumption) },
    { key: "lowerconsumption", label: "Lower Consump.", textAlign: "right", render: (s) => fmtMoney(s.lowerconsumption) },
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
      <div><h1 className="text-2xl font-bold text-surface-50">Suite Management</h1><p className="text-surface-400 text-sm mt-1">{suites.length} suite{suites.length !== 1 ? "s" : ""} — rent plans with minimum consumption and gift money</p></div>
      <div className="flex items-center gap-2">
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium"><Plus className="w-4 h-4" />Add Suite</button>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-800 text-surface-300 hover:bg-surface-700 text-sm"><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />Refresh</button>
      </div>
    </div>

    {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

    <DataTable columns={columns} data={suites} searchKey="name" loading={loading} emptyMessage="No suites — create a rent suite plan" emptyIcon={<Package className="w-10 h-10 text-surface-600" />} pageSize={20} />

    {showModal && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"><div className="bg-surface-900 border border-surface-700 rounded-2xl w-full max-w-lg mx-4">
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-800"><h2 className="text-lg font-semibold text-surface-50">{editing ? "Edit" : "Add"} Suite</h2><button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-surface-800 text-surface-500 hover:text-surface-50"><X className="w-5 h-5" /></button></div>
      <div className="px-6 py-4 space-y-4">
        <div><label className="block text-xs font-medium text-surface-400 mb-1">Suite Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-xs font-medium text-surface-400 mb-1">Rent Period</label><input type="number" value={form.rentperiod} onChange={e => setForm({ ...form, rentperiod: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm" /></div>
          <div><label className="block text-xs font-medium text-surface-400 mb-1">Rent Type</label>
            <select value={form.renttype} onChange={e => setForm({ ...form, renttype: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm">
              <option value={0}>Month</option><option value={1}>Week</option><option value={2}>Day</option><option value={3}>Hour</option>
            </select></div>
          <div><label className="block text-xs font-medium text-surface-400 mb-1">Rent Fee</label><input type="number" step="0.01" value={form.rentfee} onChange={e => setForm({ ...form, rentfee: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm" /></div>
          <div><label className="block text-xs font-medium text-surface-400 mb-1">Gift Money</label><input type="number" step="0.01" value={form.giftmoney} onChange={e => setForm({ ...form, giftmoney: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm" /></div>
          <div><label className="block text-xs font-medium text-surface-400 mb-1">Min Consumption</label><input type="number" step="0.01" value={form.minconsumption} onChange={e => setForm({ ...form, minconsumption: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm" /></div>
          <div><label className="block text-xs font-medium text-surface-400 mb-1">Lower Consumption</label><input type="number" step="0.01" value={form.lowerconsumption} onChange={e => setForm({ ...form, lowerconsumption: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm" /></div>
          <div className="col-span-2"><label className="block text-xs font-medium text-surface-400 mb-1">Non-Holonomic Order</label>
            <select value={form.nonholonomicorder} onChange={e => setForm({ ...form, nonholonomicorder: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm">
              <option value={0}>Disallowed</option><option value={1}>Allowed</option>
            </select></div>
          <div className="col-span-2"><label className="block text-xs font-medium text-surface-400 mb-1">Memo</label><input value={form.memo} onChange={e => setForm({ ...form, memo: e.target.value })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm" /></div>
        </div>
      </div>
      <div className="px-6 py-4 border-t border-surface-800 flex gap-3">
        <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-surface-700 text-surface-300 rounded-lg text-sm hover:bg-surface-800">Cancel</button>
        <button onClick={handleSave} disabled={saving || !form.name} className="flex-1 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-surface-50 rounded-lg text-sm font-medium disabled:opacity-50">{saving ? "Saving..." : editing ? "Update" : "Create"}</button>
      </div>
    </div></div>)}
  </div>);
}
