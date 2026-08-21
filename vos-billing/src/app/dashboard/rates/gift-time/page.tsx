"use client";

import { useState, useEffect } from "react";
import { Gift, RefreshCw, Plus, Edit2, Trash2, X } from "lucide-react";
import DataTable, { type Column } from "@/components/DataTable";

interface GiftRule { id: number; prefix: string; starttime: number; endtime: number; gifttime: number; billingtime: number; memo: string; suite_id: number; suite_name: string; }
interface SuiteOption { id: number; name: string; }

function fmtSecs(sec: number): string {
  if (!sec) return "—";
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
function parseSecs(v: string): number {
  const m = v.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return 0;
  return Number(m[1]) * 3600 + Number(m[2]) * 60;
}

export default function GiftTimePage() {
  const [rules, setRules] = useState<GiftRule[]>([]);
  const [suites, setSuites] = useState<SuiteOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<GiftRule | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ prefix: "", starttime: "", endtime: "", gifttime: 0, billingtime: 0, memo: "", suite_id: 0 });

  const fetchData = async () => {
    setLoading(true); setError("");
    try {
      const [rr, sr] = await Promise.all([fetch("/api/vos/gift-time"), fetch("/api/vos/suites")]);
      const rd = await rr.json(); const sd = await sr.json();
      if (rd.error) setError(rd.error); else setRules(rd.rules || []);
      if (sd.error) console.warn(sd.error); else setSuites((sd.suites || []).map((s: any) => ({ id: Number(s.id), name: String(s.name) })));
    } catch { setError("Failed"); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const openAdd = () => { setEditing(null); setForm({ prefix: "", starttime: "00:00", endtime: "23:59", gifttime: 60, billingtime: 60, memo: "", suite_id: suites[0]?.id || 0 }); setShowModal(true); };
  const openEdit = (r: GiftRule) => { setEditing(r); setForm({ prefix: r.prefix, starttime: fmtSecs(r.starttime) === "—" ? "00:00" : fmtSecs(r.starttime), endtime: fmtSecs(r.endtime) === "—" ? "23:59" : fmtSecs(r.endtime), gifttime: r.gifttime, billingtime: r.billingtime, memo: r.memo, suite_id: r.suite_id }); setShowModal(true); };

  const handleSave = async () => {
    setSaving(true); setError("");
    try {
      const body = { prefix: form.prefix, starttime: parseSecs(form.starttime), endtime: parseSecs(form.endtime), gifttime: form.gifttime, billingtime: form.billingtime, memo: form.memo, suite_id: form.suite_id };
      const method = editing ? "PUT" : "POST";
      const payload = editing ? { id: editing.id, ...body } : body;
      const r = await fetch("/api/vos/gift-time", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const d = await r.json();
      if (d.error) { setError(d.error); return; }
      setShowModal(false); setEditing(null); fetchData();
    } catch { setError("Failed"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this gift-time rule?")) return;
    try { await fetch(`/api/vos/gift-time?id=${id}`, { method: "DELETE" }); fetchData(); } catch { }
  };

  const columns: Column<GiftRule>[] = [
    { key: "prefix", label: "Prefix", cellClassName: "text-surface-50 font-mono font-medium text-xs", render: (r) => r.prefix || "*" },
    { key: "window", label: "Time Window", textAlign: "center", render: (r) => <span className="font-mono text-xs">{fmtSecs(r.starttime)} – {fmtSecs(r.endtime)}</span> },
    { key: "gifttime", label: "Gift (sec)", textAlign: "center", render: (r) => r.gifttime || "—" },
    { key: "billingtime", label: "Billing (sec)", textAlign: "center", render: (r) => r.billingtime || "—" },
    { key: "suite", label: "Suite", render: (r) => r.suite_name || `#${r.suite_id}` || "—", cellClassName: "text-surface-400" },
    { key: "memo", label: "Memo", render: (r) => r.memo || "—", cellClassName: "text-surface-400" },
    { key: "actions", label: "Actions", textAlign: "center", width: "90px", render: (r) => (
      <div className="flex items-center justify-center gap-1">
        <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-surface-700 text-surface-400 hover:text-surface-50"><Edit2 className="w-3.5 h-3.5" /></button>
        <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded hover:bg-red-500/10 text-surface-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    )},
  ];

  return (<div className="p-6 space-y-6">
    <div className="flex items-center justify-between">
      <div><h1 className="text-2xl font-bold text-surface-50">Gift Time Rules</h1><p className="text-surface-400 text-sm mt-1">{rules.length} rule{rules.length !== 1 ? "s" : ""} — free call time granted on calls to matching prefixes</p></div>
      <div className="flex items-center gap-2">
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium"><Plus className="w-4 h-4" />Add Rule</button>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-800 text-surface-300 hover:bg-surface-700 text-sm"><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />Refresh</button>
      </div>
    </div>

    {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

    <DataTable columns={columns} data={rules} searchKey="prefix" loading={loading} emptyMessage="No gift-time rules" emptyIcon={<Gift className="w-10 h-10 text-surface-600" />} pageSize={20} />

    {showModal && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"><div className="bg-surface-900 border border-surface-700 rounded-2xl w-full max-w-md mx-4">
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-800"><h2 className="text-lg font-semibold text-surface-50">{editing ? "Edit" : "Add"} Gift-Time Rule</h2><button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-surface-800 text-surface-500 hover:text-surface-50"><X className="w-5 h-5" /></button></div>
      <div className="px-6 py-4 space-y-4">
        <div><label className="block text-xs font-medium text-surface-400 mb-1">Prefix *</label><input value={form.prefix} onChange={e => setForm({ ...form, prefix: e.target.value })} placeholder="e.g. 009 or 8801" className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm font-mono" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-xs font-medium text-surface-400 mb-1">Start Time (HH:MM)</label><input value={form.starttime} onChange={e => setForm({ ...form, starttime: e.target.value })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm font-mono" /></div>
          <div><label className="block text-xs font-medium text-surface-400 mb-1">End Time (HH:MM)</label><input value={form.endtime} onChange={e => setForm({ ...form, endtime: e.target.value })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm font-mono" /></div>
          <div><label className="block text-xs font-medium text-surface-400 mb-1">Gift Time (sec)</label><input type="number" value={form.gifttime} onChange={e => setForm({ ...form, gifttime: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm" /></div>
          <div><label className="block text-xs font-medium text-surface-400 mb-1">Billing Time (sec)</label><input type="number" value={form.billingtime} onChange={e => setForm({ ...form, billingtime: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm" /></div>
        </div>
        <div><label className="block text-xs font-medium text-surface-400 mb-1">Suite</label>
          <select value={form.suite_id} onChange={e => setForm({ ...form, suite_id: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm">
            <option value={0}>— No suite —</option>
            {suites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select></div>
        <div><label className="block text-xs font-medium text-surface-400 mb-1">Memo</label><input value={form.memo} onChange={e => setForm({ ...form, memo: e.target.value })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm" /></div>
      </div>
      <div className="px-6 py-4 border-t border-surface-800 flex gap-3">
        <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-surface-700 text-surface-300 rounded-lg text-sm hover:bg-surface-800">Cancel</button>
        <button onClick={handleSave} disabled={saving || !form.prefix} className="flex-1 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-surface-50 rounded-lg text-sm font-medium disabled:opacity-50">{saving ? "Saving..." : editing ? "Update" : "Create"}</button>
      </div>
    </div></div>)}
  </div>);
}
