"use client";

import { useState, useEffect } from "react";
import { Phone, RefreshCw, Plus, Edit2, Trash2, X, ListMusic, Music } from "lucide-react";
import DataTable, { type Column } from "@/components/DataTable";

interface IvrService {
  id: number; name: string; type: number; ivr_id: number; language_id: number;
  memo: string; menu_count: number; audio_count: number;
}

interface MenuRow { id: number; flowindex: string; identification: string; name: string; audioes: string; action: string; actionparameter: string; }
interface AudioRow { id: number; name: string; size: number; memo: string; }

export default function IvrPage() {
  const [services, setServices] = useState<IvrService[]>([]);
  const [ivrs, setIvrs] = useState<{ id: number; name: string }[]>([]);
  const [languages, setLanguages] = useState<{ id: number; directory: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<IvrService | null>(null);
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<{ service: IvrService; menus: MenuRow[]; audio: AudioRow[] } | null>(null);
  const [form, setForm] = useState({ name: "", type: 0, ivr_id: 0, language_id: 0, memo: "" });

  const fetchServices = async () => {
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/vos/ivr"); const d = await r.json();
      if (d.error) setError(d.error); else { setServices(d.services || []); setIvrs(d.ivrs || []); setLanguages(d.languages || []); }
    } catch { setError("Failed"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchServices(); }, []);

  const openDetail = async (svc: IvrService) => {
    setError("");
    try {
      const r = await fetch(`/api/vos/ivr?id=${svc.id}`); const d = await r.json();
      if (d.error) setError(d.error); else setDetail({ service: svc, menus: d.menus || [], audio: d.audio || [] });
    } catch { setError("Failed to load detail"); }
  };

  const handleSave = async () => {
    setSaving(true); setError("");
    try {
      const method = editing ? "PUT" : "POST";
      const body = editing ? { id: editing.id, ...form } : form;
      const r = await fetch("/api/vos/ivr", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json();
      if (d.error) { setError(d.error); return; }
      setShowModal(false); setEditing(null); setDetail(null); fetchServices();
    } catch { setError("Failed"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this IVR service and all its menus/audio?")) return;
    try { await fetch(`/api/vos/ivr?id=${id}`, { method: "DELETE" }); setDetail(null); fetchServices(); } catch { }
  };

  const openEdit = (s: IvrService) => {
    setEditing(s);
    setForm({ name: s.name, type: s.type, ivr_id: s.ivr_id, language_id: s.language_id, memo: s.memo });
    setShowModal(true);
  };
  const openAdd = () => { setEditing(null); setForm({ name: "", type: 0, ivr_id: 0, language_id: 0, memo: "" }); setShowModal(true); };

  const columns: Column<IvrService>[] = [
    { key: "name", label: "Name", cellClassName: "text-surface-50 font-medium text-xs" },
    { key: "type", label: "Type", textAlign: "center" as const, render: (s) => s.type === 0 ? "General" : s.type === 1 ? "Callback" : `Type ${s.type}` },
    { key: "ivr", label: "IVR", render: (s) => ivrs.find(i => i.id === s.ivr_id)?.name || "—" },
    { key: "language", label: "Language", render: (s) => languages.find(l => l.id === s.language_id)?.directory || "—" },
    { key: "menus", label: "Menus", textAlign: "center" as const, render: (s) => <span className="flex items-center justify-center gap-1 text-surface-400"><ListMusic className="w-3 h-3" />{s.menu_count}</span> },
    { key: "audio", label: "Audio", textAlign: "center" as const, render: (s) => <span className="flex items-center justify-center gap-1 text-surface-400"><Music className="w-3 h-3" />{s.audio_count}</span> },
    { key: "memo", label: "Memo", render: (s) => s.memo || "—", cellClassName: "text-surface-400" },
    { key: "actions", label: "Actions", textAlign: "center", width: "120px", render: (s) => (
      <div className="flex items-center justify-center gap-1">
        <button onClick={() => openDetail(s)} className="p-1.5 rounded hover:bg-surface-700 text-surface-400 hover:text-surface-50" title="View menus/audio"><ListMusic className="w-3.5 h-3.5" /></button>
        <button onClick={() => openEdit(s)} className="p-1.5 rounded hover:bg-surface-700 text-surface-400 hover:text-surface-50"><Edit2 className="w-3.5 h-3.5" /></button>
        <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded hover:bg-red-500/10 text-surface-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    )},
  ];

  return (<div className="p-6 space-y-6">
    <div className="flex items-center justify-between">
      <div><h1 className="text-2xl font-bold text-surface-50">IVR Service Management</h1><p className="text-surface-400 text-sm mt-1">{services.length} IVR services</p></div>
      <div className="flex items-center gap-2">
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium"><Plus className="w-4 h-4" />Add IVR Service</button>
        <button onClick={fetchServices} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-800 text-surface-300 hover:bg-surface-700 text-sm"><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />Refresh</button>
      </div>
    </div>

    {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

    <DataTable columns={columns} data={services} searchKey="name" loading={loading} emptyMessage="No IVR services — add one to configure interactive voice response" emptyIcon={<Phone className="w-10 h-10 text-surface-600" />} pageSize={20} />

    {detail && (
      <div className="bg-surface-900/60 border border-surface-800 rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-surface-50 flex items-center gap-2"><Phone className="w-4 h-4 text-brand-400" />{detail.service.name} — Menus &amp; Audio</h2>
          <button onClick={() => setDetail(null)} className="p-1.5 rounded-lg hover:bg-surface-800 text-surface-500 hover:text-surface-50"><X className="w-5 h-5" /></button>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-surface-400 mb-3 flex items-center gap-2"><ListMusic className="w-4 h-4" />Menu Flow ({detail.menus.length})</h3>
            <div className="space-y-2">
              {detail.menus.length === 0 && <p className="text-surface-500 text-sm">No menus defined.</p>}
              {detail.menus.map(m => (
                <div key={m.id} className="p-3 rounded-xl bg-surface-900 border border-surface-800">
                  <div className="flex items-center gap-2 text-sm"><span className="font-mono text-brand-400 text-xs">{m.flowindex || "—"}</span><span className="text-surface-50 font-medium">{m.name || m.identification || "Unnamed"}</span></div>
                  <div className="text-xs text-surface-500 mt-1">Action: <span className="font-mono text-surface-400">{m.action || "—"}</span>{m.actionparameter ? <span className="text-surface-500"> · {String(m.actionparameter).slice(0, 80)}</span> : null}</div>
                  {m.audioes && <div className="text-xs text-surface-500 mt-0.5">Audio: <span className="font-mono text-surface-400">{m.audioes}</span></div>}
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-surface-400 mb-3 flex items-center gap-2"><Music className="w-4 h-4" />Audio Files ({detail.audio.length})</h3>
            <div className="space-y-2">
              {detail.audio.length === 0 && <p className="text-surface-500 text-sm">No audio files uploaded.</p>}
              {detail.audio.map(a => (
                <div key={a.id} className="p-3 rounded-xl bg-surface-900 border border-surface-800 flex items-center justify-between">
                  <div className="text-sm text-surface-50 font-medium">{a.name || `Audio ${a.id}`}</div>
                  <div className="text-xs text-surface-500">{a.size ? `${Math.round(Number(a.size) / 1024)} KB` : "—"}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )}

    {showModal && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"><div className="bg-surface-900 border border-surface-700 rounded-2xl w-full max-w-md mx-4">
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-800"><h2 className="text-lg font-semibold text-surface-50">{editing ? "Edit IVR Service" : "Add IVR Service"}</h2><button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-surface-800 text-surface-500 hover:text-surface-50"><X className="w-5 h-5" /></button></div>
      <div className="px-6 py-4 space-y-4">
        <div><label className="block text-xs font-medium text-surface-400 mb-1">Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-xs font-medium text-surface-400 mb-1">Type</label>
            <select value={form.type} onChange={e => setForm({ ...form, type: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm">
              <option value={0}>General</option><option value={1}>Callback</option><option value={2}>Other</option>
            </select></div>
          <div><label className="block text-xs font-medium text-surface-400 mb-1">IVR</label>
            <select value={form.ivr_id} onChange={e => setForm({ ...form, ivr_id: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm">
              <option value={0}>— None —</option>{ivrs.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select></div>
          <div><label className="block text-xs font-medium text-surface-400 mb-1">Language</label>
            <select value={form.language_id} onChange={e => setForm({ ...form, language_id: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm">
              <option value={0}>— Default —</option>{languages.map(l => <option key={l.id} value={l.id}>{l.directory}</option>)}
            </select></div>
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
