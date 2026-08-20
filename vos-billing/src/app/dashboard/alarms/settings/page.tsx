"use client";

import { useState, useEffect } from "react";
import { SlidersHorizontal, RefreshCw, Save, X } from "lucide-react";
import DataTable, { type Column } from "@/components/DataTable";

interface AlarmSetting { id: number; moId: number; moType: number; startTime: number; stopTime: number; type: number; typeLabel: string; level: number; levelLabel: string; upper: number; lower: number; period: number; enableVoice: number; e164s: string; enableEmail: number; email: string; }

export default function AlarmSettingsPage() {
  const [settings, setSettings] = useState<AlarmSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState<AlarmSetting | null>(null);
  const [form, setForm] = useState({ upper:0, lower:0, period:-1, level:2, enableVoice:0, e164s:"", enableEmail:0, email:"" });
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    setLoading(true); setError("");
    try { const r=await fetch("/api/vos/alarm-settings"); const d=await r.json(); if(d.error)setError(d.error); else setSettings(d.settings||[]); } catch { setError("Failed"); }
    finally { setLoading(false); }
  };

  useEffect(()=>{fetchSettings();},[]);

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true); setError(""); setSuccess("");
    try {
      const r = await fetch("/api/vos/alarm-settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editing.id, ...form }) });
      const d = await r.json();
      if (d.error) { setError(d.error); return; }
      setSuccess(`Setting #${editing.id} saved`); setEditing(null); fetchSettings();
      setTimeout(() => setSuccess(""), 3000);
    } catch { setError("Failed"); }
    finally { setSaving(false); }
  };

  const openEdit = (s:AlarmSetting) => {
    setEditing(s);
    setForm({ upper: s.upper, lower: s.lower, period: s.period, level: s.level, enableVoice: s.enableVoice, e164s: s.e164s, enableEmail: s.enableEmail, email: s.email });
  };

  const columns: Column<AlarmSetting>[] = [
    { key: "id", label: "#", render: (s) => <span className="text-surface-500 text-xs">{s.id}</span> },
    { key: "typeLabel", label: "Alarm Type", cellClassName: "text-surface-50 font-medium" },
    { key: "moId", label: "MO ID", textAlign: "center" as const, render: (s) => <span className="font-mono text-xs">{s.moId}</span> },
    { key: "levelLabel", label: "Level", textAlign: "center" as const, render: (s) => <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${s.level >= 3 ? "bg-red-500/10 text-red-400" : s.level === 2 ? "bg-amber-500/10 text-amber-400" : "bg-blue-500/10 text-blue-400"}`}>{s.levelLabel}</span> },
    { key: "upper", label: "Upper", textAlign: "right" as const, render: (s) => <span className="font-mono text-xs">{s.upper}</span> },
    { key: "lower", label: "Lower", textAlign: "right" as const, render: (s) => <span className="font-mono text-xs">{s.lower}</span> },
    { key: "period", label: "Period (s)", textAlign: "right" as const, render: (s) => <span className="font-mono text-xs">{s.period}</span> },
    { key: "enableEmail", label: "Email", textAlign: "center" as const, render: (s) => s.enableEmail === 1 ? <span className="px-2 py-0.5 rounded text-[11px] bg-emerald-500/10 text-emerald-400">On</span> : <span className="px-2 py-0.5 rounded text-[11px] bg-surface-800 text-surface-500">Off</span> },
    { key: "actions", label: "", textAlign: "center", width: "56px", render: (s) => (
      <button onClick={()=>openEdit(s)} className="p-1.5 rounded hover:bg-surface-700 text-surface-400 hover:text-amber-400" title="Edit"><SlidersHorizontal className="w-3.5 h-3.5"/></button>
    )},
  ];

  return (<div className="p-6 space-y-6">
    <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-surface-50">Alarm Settings</h1><p className="text-surface-400 text-sm mt-1">{settings.length} configured alarms</p></div>
    <button onClick={fetchSettings} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-800 text-surface-300 hover:bg-surface-700 text-sm"><RefreshCw className={`w-4 h-4 ${loading?"animate-spin":""}`}/>Refresh</button></div>

    {error&&<div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}
    {success&&<div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">{success}</div>}

    <DataTable columns={columns} data={settings} searchKey="typeLabel" loading={loading} emptyMessage="No alarm settings found" emptyIcon={<SlidersHorizontal className="w-10 h-10 text-surface-600" />} pageSize={20} />

    {editing&&(<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"><div className="bg-surface-900 border border-surface-700 rounded-2xl w-full max-w-md mx-4">
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-800"><h2 className="text-lg font-semibold text-surface-50">Edit Alarm Setting #{editing.id} — {editing.typeLabel}</h2><button onClick={()=>setEditing(null)} className="p-1.5 rounded-lg hover:bg-surface-800 text-surface-500 hover:text-surface-50"><X className="w-5 h-5"/></button></div>
      <div className="px-6 py-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-xs font-medium text-surface-400 mb-1">Upper Threshold</label><input type="number" value={form.upper} onChange={e=>setForm({...form,upper:parseInt(e.target.value)||0})} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm"/></div>
          <div><label className="block text-xs font-medium text-surface-400 mb-1">Lower Threshold</label><input type="number" value={form.lower} onChange={e=>setForm({...form,lower:parseInt(e.target.value)||0})} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm"/></div>
          <div><label className="block text-xs font-medium text-surface-400 mb-1">Period (s)</label><input type="number" value={form.period} onChange={e=>setForm({...form,period:parseInt(e.target.value)||-1})} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm"/></div>
          <div><label className="block text-xs font-medium text-surface-400 mb-1">Level</label><select value={form.level} onChange={e=>setForm({...form,level:parseInt(e.target.value)})} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm"><option value={1}>Info</option><option value={2}>Warning</option><option value={3}>Critical</option></select></div>
          <div><label className="block text-xs font-medium text-surface-400 mb-1">Voice Alert</label><select value={form.enableVoice} onChange={e=>setForm({...form,enableVoice:parseInt(e.target.value)})} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm"><option value={0}>Off</option><option value={1}>On</option></select></div>
          <div><label className="block text-xs font-medium text-surface-400 mb-1">Email Alert</label><select value={form.enableEmail} onChange={e=>setForm({...form,enableEmail:parseInt(e.target.value)})} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm"><option value={0}>Off</option><option value={1}>On</option></select></div>
        </div>
        <div><label className="block text-xs font-medium text-surface-400 mb-1">Voice E164s</label><input value={form.e164s} onChange={e=>setForm({...form,e164s:e.target.value})} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm"/></div>
        <div><label className="block text-xs font-medium text-surface-400 mb-1">Alert Email</label><input value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm"/></div>
      </div>
      <div className="px-6 py-4 border-t border-surface-800 flex gap-3"><button onClick={()=>setEditing(null)} className="flex-1 px-4 py-2 border border-surface-700 text-surface-300 rounded-lg text-sm hover:bg-surface-800">Cancel</button><button onClick={handleSave} disabled={saving} className="flex-1 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-surface-50 rounded-lg text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50">{saving?"Saving...":<><Save className="w-4 h-4"/>Save</>}</button></div>
    </div></div>)}
  </div>);
}
