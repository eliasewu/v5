"use client";

import { useState, useEffect } from "react";
import { Layers, RefreshCw, Plus, Edit2, Trash2, X } from "lucide-react";
import DataTable, { type Column } from "@/components/DataTable";

interface Group { id: number; name: string; memo: string; e164Count: number; }
interface Member { id: number; e164: string; memo: string; groupId: number; }

export default function LimitGroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<{ kind: "group" | "member"; id?: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name:"", memo:"", e164:"", groupId:0 });

  const fetchAll = async () => {
    setLoading(true); setError("");
    try { const r=await fetch("/api/vos/limit-e164-groups"); const d=await r.json(); if(d.error)setError(d.error); else { setGroups(d.groups||[]); setMembers(d.members||[]); } } catch { setError("Failed"); }
    finally { setLoading(false); }
  };

  useEffect(()=>{fetchAll();},[]);

  const handleSave = async () => {
    setSaving(true); setError("");
    try {
      const kind = editing?.kind || "group";
      const method = editing?.id ? "PUT" : "POST";
      const body: Record<string, unknown> = editing?.id ? { id: editing.id, ...form } : { ...form };
      const r = await fetch("/api/vos/limit-e164-groups", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json();
      if (d.error) { setError(d.error); return; }
      setShowModal(false); setEditing(null); setForm({ name:"", memo:"", e164:"", groupId:0 }); fetchAll();
    } catch { setError("Failed"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id:number, kind:"group"|"member") => {
    if(!confirm(`Delete this ${kind}?`))return;
    try { await fetch(`/api/vos/limit-e164-groups?id=${id}&type=${kind}`,{method:"DELETE"}); fetchAll(); } catch {}
  };

  const openAddGroup = () => { setEditing({ kind: "group" }); setForm({ name:"", memo:"", e164:"", groupId:0 }); setShowModal(true); };
  const openEditGroup = (g:Group) => { setEditing({ kind: "group", id: g.id }); setForm({ name:g.name, memo:g.memo, e164:"", groupId:g.id }); setShowModal(true); };
  const openAddMember = (g:Group) => { setEditing({ kind: "member" }); setForm({ name:"", memo:"", e164:"", groupId:g.id }); setShowModal(true); };
  const openEditMember = (m:Member) => { setEditing({ kind: "member", id: m.id }); setForm({ name:"", memo:m.memo, e164:m.e164, groupId:m.groupId }); setShowModal(true); };

  const groupColumns: Column<Group>[] = [
    { key: "id", label: "#", render: (g) => <span className="text-surface-500 text-xs">{g.id}</span> },
    { key: "name", label: "Group Name", cellClassName: "text-surface-50 font-medium" },
    { key: "e164Count", label: "Members", textAlign: "center" as const, render: (g) => <span className="px-2 py-0.5 rounded text-[11px] bg-brand-500/10 text-brand-400">{g.e164Count}</span> },
    { key: "memo", label: "Memo", render: (g) => g.memo || "—", cellClassName: "text-surface-400" },
    { key: "actions", label: "Actions", textAlign: "center", width: "96px", render: (g) => (
      <div className="flex items-center justify-center gap-1">
        <button onClick={()=>openAddMember(g)} className="p-1.5 rounded hover:bg-surface-700 text-surface-400 hover:text-emerald-400" title="Add member"><Plus className="w-3.5 h-3.5"/></button>
        <button onClick={()=>openEditGroup(g)} className="p-1.5 rounded hover:bg-surface-700 text-surface-400 hover:text-surface-50"><Edit2 className="w-3.5 h-3.5"/></button>
        <button onClick={()=>handleDelete(g.id,"group")} className="p-1.5 rounded hover:bg-red-500/10 text-surface-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5"/></button>
      </div>
    )},
  ];

  const memberColumns: Column<Member>[] = [
    { key: "e164", label: "E164", cellClassName: "text-surface-50 font-mono font-medium text-xs" },
    { key: "groupId", label: "Group", render: (m) => <span className="text-surface-300 text-xs">{groups.find(g=>g.id===m.groupId)?.name || `Group #${m.groupId}`}</span> },
    { key: "memo", label: "Memo", render: (m) => m.memo || "—", cellClassName: "text-surface-400" },
    { key: "actions", label: "Actions", textAlign: "center", width: "96px", render: (m) => (
      <div className="flex items-center justify-center gap-1">
        <button onClick={()=>openEditMember(m)} className="p-1.5 rounded hover:bg-surface-700 text-surface-400 hover:text-surface-50"><Edit2 className="w-3.5 h-3.5"/></button>
        <button onClick={()=>handleDelete(m.id,"member")} className="p-1.5 rounded hover:bg-red-500/10 text-surface-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5"/></button>
      </div>
    )},
  ];

  return (<div className="p-6 space-y-6">
    <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-surface-50">Black/White List Group</h1><p className="text-surface-400 text-sm mt-1">{groups.length} groups • {members.length} members</p></div>
    <div className="flex items-center gap-2"><button onClick={openAddGroup} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium"><Plus className="w-4 h-4"/>Add Group</button><button onClick={fetchAll} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-800 text-surface-300 hover:bg-surface-700 text-sm"><RefreshCw className={`w-4 h-4 ${loading?"animate-spin":""}`}/>Refresh</button></div></div>

    {error&&<div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

    <div>
      <h2 className="text-sm font-semibold text-surface-400 uppercase tracking-wider mb-2">Groups</h2>
      <DataTable columns={groupColumns} data={groups} searchKey="name" loading={loading} emptyMessage="No groups found" emptyIcon={<Layers className="w-10 h-10 text-surface-600" />} pageSize={10} />
    </div>
    <div>
      <h2 className="text-sm font-semibold text-surface-400 uppercase tracking-wider mb-2">Group Members</h2>
      <DataTable columns={memberColumns} data={members} searchKey="e164" loading={loading} emptyMessage="No members found" emptyIcon={<Layers className="w-10 h-10 text-surface-600" />} pageSize={10} />
    </div>

    {showModal&&(<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"><div className="bg-surface-900 border border-surface-700 rounded-2xl w-full max-w-md mx-4">
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-800"><h2 className="text-lg font-semibold text-surface-50">
        {editing?.kind==="member" ? (editing.id ? "Edit Member" : "Add Member") : (editing?.id ? "Edit Group" : "Add Group")}
      </h2><button onClick={()=>setShowModal(false)} className="p-1.5 rounded-lg hover:bg-surface-800 text-surface-500 hover:text-surface-50"><X className="w-5 h-5"/></button></div>
      <div className="px-6 py-4 space-y-4">
        {editing?.kind==="member" ? (
          <>
            <div><label className="block text-xs font-medium text-surface-400 mb-1">E164 Number *</label><input value={form.e164} onChange={e=>setForm({...form,e164:e.target.value})} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm font-mono"/></div>
            <div><label className="block text-xs font-medium text-surface-400 mb-1">Group</label><select value={form.groupId} onChange={e=>setForm({...form,groupId:parseInt(e.target.value)})} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm"><option value={0}>Select group...</option>{groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></div>
          </>
        ) : (
          <>
            <div><label className="block text-xs font-medium text-surface-400 mb-1">Group Name *</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm"/></div>
          </>
        )}
        <div><label className="block text-xs font-medium text-surface-400 mb-1">Memo</label><textarea value={form.memo} onChange={e=>setForm({...form,memo:e.target.value})} rows={2} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm resize-none"/></div>
      </div>
      <div className="px-6 py-4 border-t border-surface-800 flex gap-3"><button onClick={()=>setShowModal(false)} className="flex-1 px-4 py-2 border border-surface-700 text-surface-300 rounded-lg text-sm hover:bg-surface-800">Cancel</button><button onClick={handleSave} disabled={saving||(editing?.kind==="member"?!form.e164:!form.name)} className="flex-1 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-surface-50 rounded-lg text-sm font-medium disabled:opacity-50">{saving?"Saving...":editing?.id?"Update":"Create"}</button></div>
    </div></div>)}
  </div>);
}
