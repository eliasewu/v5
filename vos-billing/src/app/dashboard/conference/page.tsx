"use client";

import { useState, useEffect } from "react";
import { Users, RefreshCw, Plus, Edit2, Trash2, X, Video, UserPlus } from "lucide-react";
import DataTable, { type Column } from "@/components/DataTable";

interface Room {
  id: number; name: string; password: string; customerpassword: string; capacity: number;
  record: number; memo: string; customer_id: number; customer_name: string; member_count: number;
}
interface Member { id: number; e164: string; type: number; memo: string; conferenceroom_id: number; }

export default function ConferencePage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Room | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", password: "", customerpassword: "", capacity: 50, record: 0, memo: "" });
  const [selected, setSelected] = useState<Room | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [memberForm, setMemberForm] = useState({ e164: "", type: 0, memo: "" });

  const fetchRooms = async () => {
    setLoading(true); setError("");
    try { const r = await fetch("/api/vos/conferences"); const d = await r.json(); if (d.error) setError(d.error); else setRooms(d.rooms || []); }
    catch { setError("Failed"); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchRooms(); }, []);

  const fetchMembers = async (room: Room) => {
    setSelected(room);
    try { const r = await fetch(`/api/vos/conferences/members?roomId=${room.id}`); const d = await r.json(); setMembers(d.members || []); } catch { setMembers([]); }
  };

  const addMember = async () => {
    if (!memberForm.e164 || !selected) return;
    try {
      await fetch("/api/vos/conferences/members", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conferenceroom_id: selected.id, e164: memberForm.e164, type: memberForm.type, memo: memberForm.memo }) });
      setMemberForm({ e164: "", type: 0, memo: "" }); fetchMembers(selected); fetchRooms();
    } catch { }
  };

  const removeMember = async (id: number) => {
    if (!confirm("Remove this member?")) return;
    try { await fetch(`/api/vos/conferences/members?id=${id}`, { method: "DELETE" }); if (selected) fetchMembers(selected); fetchRooms(); } catch { }
  };

  const handleSave = async () => {
    setSaving(true); setError("");
    try {
      const method = editing ? "PUT" : "POST";
      const body = editing ? { id: editing.id, ...form } : form;
      const r = await fetch("/api/vos/conferences", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json();
      if (d.error) { setError(d.error); return; }
      setShowModal(false); setEditing(null); fetchRooms();
    } catch { setError("Failed"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this conference room and its members?")) return;
    try { await fetch(`/api/vos/conferences?id=${id}`, { method: "DELETE" }); if (selected?.id === id) setSelected(null); fetchRooms(); } catch { }
  };

  const openEdit = (r: Room) => { setEditing(r); setForm({ name: r.name, password: r.password, customerpassword: r.customerpassword, capacity: r.capacity, record: r.record, memo: r.memo }); setShowModal(true); };
  const openAdd = () => { setEditing(null); setForm({ name: "", password: "", customerpassword: "", capacity: 50, record: 0, memo: "" }); setShowModal(true); };

  const columns: Column<Room>[] = [
    { key: "name", label: "Room Name", cellClassName: "text-surface-50 font-medium text-xs" },
    { key: "capacity", label: "Capacity", textAlign: "center" as const, render: (r) => r.capacity || "—" },
    { key: "record", label: "Record", textAlign: "center" as const, render: (r) => r.record === 1 ? <span className="text-emerald-400">On</span> : <span className="text-surface-500">Off</span> },
    { key: "customer", label: "Customer", render: (r) => r.customer_name || "—" },
    { key: "members", label: "Members", textAlign: "center" as const, render: (r) => r.member_count },
    { key: "memo", label: "Memo", render: (r) => r.memo || "—", cellClassName: "text-surface-400" },
    { key: "actions", label: "Actions", textAlign: "center", width: "120px", render: (r) => (
      <div className="flex items-center justify-center gap-1">
        <button onClick={() => fetchMembers(r)} className="p-1.5 rounded hover:bg-surface-700 text-surface-400 hover:text-surface-50" title="View members"><Users className="w-3.5 h-3.5" /></button>
        <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-surface-700 text-surface-400 hover:text-surface-50"><Edit2 className="w-3.5 h-3.5" /></button>
        <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded hover:bg-red-500/10 text-surface-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    )},
  ];

  return (<div className="p-6 space-y-6">
    <div className="flex items-center justify-between">
      <div><h1 className="text-2xl font-bold text-surface-50">Conference Management</h1><p className="text-surface-400 text-sm mt-1">{rooms.length} conference rooms</p></div>
      <div className="flex items-center gap-2">
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium"><Plus className="w-4 h-4" />Add Room</button>
        <button onClick={fetchRooms} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-800 text-surface-300 hover:bg-surface-700 text-sm"><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />Refresh</button>
      </div>
    </div>

    {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

    <DataTable columns={columns} data={rooms} searchKey="name" loading={loading} emptyMessage="No conference rooms" emptyIcon={<Video className="w-10 h-10 text-surface-600" />} pageSize={20} />

    {selected && (
      <div className="bg-surface-900/60 border border-surface-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-surface-50 flex items-center gap-2"><Video className="w-4 h-4 text-brand-400" />{selected.name} — Members ({members.length}/{selected.capacity})</h2>
          <button onClick={() => setSelected(null)} className="p-1.5 rounded-lg hover:bg-surface-800 text-surface-500 hover:text-surface-50"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex items-end gap-3">
          <div className="flex-1"><label className="block text-xs font-medium text-surface-400 mb-1">E164 / Number</label><input value={memberForm.e164} onChange={e => setMemberForm({ ...memberForm, e164: e.target.value })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm font-mono" placeholder="e.g. 12025550123" /></div>
          <div className="w-32"><label className="block text-xs font-medium text-surface-400 mb-1">Type</label>
            <select value={memberForm.type} onChange={e => setMemberForm({ ...memberForm, type: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm">
              <option value={0}>General</option><option value={1}>Moderator</option>
            </select></div>
          <button onClick={addMember} disabled={!memberForm.e164} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-surface-50 text-sm font-medium disabled:opacity-50"><UserPlus className="w-4 h-4" />Add Member</button>
        </div>
        <div className="space-y-2">
          {members.length === 0 && <p className="text-surface-500 text-sm">No members.</p>}
          {members.map(m => (
            <div key={m.id} className="p-3 rounded-xl bg-surface-900 border border-surface-800 flex items-center justify-between">
              <div className="flex items-center gap-3 text-sm"><span className="font-mono text-surface-50">{m.e164}</span>{m.type === 1 && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">Moderator</span>}<span className="text-surface-500 text-xs">{m.memo}</span></div>
              <button onClick={() => removeMember(m.id)} className="p-1.5 rounded hover:bg-red-500/10 text-surface-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      </div>
    )}

    {showModal && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"><div className="bg-surface-900 border border-surface-700 rounded-2xl w-full max-w-md mx-4">
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-800"><h2 className="text-lg font-semibold text-surface-50">{editing ? "Edit Room" : "Add Room"}</h2><button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-surface-800 text-surface-500 hover:text-surface-50"><X className="w-5 h-5" /></button></div>
      <div className="px-6 py-4 space-y-4">
        <div><label className="block text-xs font-medium text-surface-400 mb-1">Room Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-xs font-medium text-surface-400 mb-1">Password</label><input value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm" /></div>
          <div><label className="block text-xs font-medium text-surface-400 mb-1">Customer Password</label><input value={form.customerpassword} onChange={e => setForm({ ...form, customerpassword: e.target.value })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm" /></div>
          <div><label className="block text-xs font-medium text-surface-400 mb-1">Capacity</label><input type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm" /></div>
          <div><label className="block text-xs font-medium text-surface-400 mb-1">Recording</label>
            <select value={form.record} onChange={e => setForm({ ...form, record: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm">
              <option value={0}>Off</option><option value={1}>On</option>
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
