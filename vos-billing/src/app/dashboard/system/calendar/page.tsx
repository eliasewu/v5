"use client";

import { useState, useEffect } from "react";
import { CalendarDays, RefreshCw, Plus, Edit2, Trash2, X } from "lucide-react";
import DataTable, { type Column } from "@/components/DataTable";

interface Calendar { id: number; name: string; memo: string; }

export default function WorkCalendarPage() {
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Calendar | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name:"", memo:"" });

  const fetchCalendars = async () => {
    setLoading(true); setError("");
    try { const r=await fetch("/api/vos/calendars"); const d=await r.json(); if(d.error)setError(d.error); else setCalendars(d.calendars||[]); } catch { setError("Failed"); }
    finally { setLoading(false); }
  };

  useEffect(()=>{fetchCalendars();},[]);

  const handleSave = async () => {
    setSaving(true); setError("");
    try {
      const method = editing ? "PUT" : "POST";
      const body = editing ? { id: editing.id, ...form } : form;
      const r = await fetch("/api/vos/calendars", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json();
      if (d.error) { setError(d.error); return; }
      setShowModal(false); setEditing(null); fetchCalendars();
    } catch { setError("Failed"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id:number) => {
    if(!confirm("Delete this calendar?"))return;
    try { await fetch(`/api/vos/calendars?id=${id}`,{method:"DELETE"}); fetchCalendars(); } catch {}
  };

  const openEdit = (c:Calendar) => { setEditing(c); setForm({ name:c.name, memo:c.memo||"" }); setShowModal(true); };
  const openAdd = () => { setEditing(null); setForm({ name:"", memo:"" }); setShowModal(true); };

  const columns: Column<Calendar>[] = [
    { key: "id", label: "#", render: (c) => <span className="text-surface-500 text-xs">{c.id}</span> },
    { key: "name", label: "Calendar Name", cellClassName: "text-surface-50 font-medium" },
    { key: "memo", label: "Memo", render: (c) => c.memo || "—", cellClassName: "text-surface-400" },
    { key: "actions", label: "Actions", textAlign: "center", width: "96px", render: (c) => (
      <div className="flex items-center justify-center gap-1">
        <button onClick={()=>openEdit(c)} className="p-1.5 rounded hover:bg-surface-700 text-surface-400 hover:text-surface-50"><Edit2 className="w-3.5 h-3.5"/></button>
        <button onClick={()=>handleDelete(c.id)} className="p-1.5 rounded hover:bg-red-500/10 text-surface-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5"/></button>
      </div>
    )},
  ];

  return (<div className="p-6 space-y-6">
    <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-surface-50">Work Calendar</h1><p className="text-surface-400 text-sm mt-1">{calendars.length} calendars</p></div>
    <div className="flex items-center gap-2"><button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium"><Plus className="w-4 h-4"/>Add Calendar</button><button onClick={fetchCalendars} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-800 text-surface-300 hover:bg-surface-700 text-sm"><RefreshCw className={`w-4 h-4 ${loading?"animate-spin":""}`}/>Refresh</button></div></div>

    {error&&<div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

    <DataTable columns={columns} data={calendars} searchKey="name" loading={loading} emptyMessage="No calendars found" emptyIcon={<CalendarDays className="w-10 h-10 text-surface-600" />} pageSize={20} />

    {showModal&&(<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"><div className="bg-surface-900 border border-surface-700 rounded-2xl w-full max-w-md mx-4">
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-800"><h2 className="text-lg font-semibold text-surface-50">{editing?"Edit Calendar":"Add Calendar"}</h2><button onClick={()=>setShowModal(false)} className="p-1.5 rounded-lg hover:bg-surface-800 text-surface-500 hover:text-surface-50"><X className="w-5 h-5"/></button></div>
      <div className="px-6 py-4 space-y-4">
        <div><label className="block text-xs font-medium text-surface-400 mb-1">Calendar Name *</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm"/></div>
        <div><label className="block text-xs font-medium text-surface-400 mb-1">Memo</label><textarea value={form.memo} onChange={e=>setForm({...form,memo:e.target.value})} rows={2} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm resize-none"/></div>
      </div>
      <div className="px-6 py-4 border-t border-surface-800 flex gap-3"><button onClick={()=>setShowModal(false)} className="flex-1 px-4 py-2 border border-surface-700 text-surface-300 rounded-lg text-sm hover:bg-surface-800">Cancel</button><button onClick={handleSave} disabled={!form.name||saving} className="flex-1 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-surface-50 rounded-lg text-sm font-medium disabled:opacity-50">{saving?"Saving...":editing?"Update":"Create"}</button></div>
    </div></div>)}
  </div>);
}
