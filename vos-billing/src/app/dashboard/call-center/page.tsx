"use client";

import { useState, useEffect } from "react";
import { Headset, RefreshCw, Plus, Edit2, Trash2, X, Users } from "lucide-react";
import DataTable, { type Column } from "@/components/DataTable";

interface Seat { id: number; e164: string; level: number; password: string; jobid: string; locktype: number; status: number; name: string; priority: number; record: number; memo: string; ivr_id: number; cc_seat_privilege_id: number; arealimit: string; }
interface SeatGroup { id: number; name: string; password: string; capacity: number; seatuplimit: number; record: number; schedulingtype: number; accesse164s: string; welcome: string; schedulingdelay: number; memo: string; ivr_id: number; }

export default function CallCenterPage() {
  const [tab, setTab] = useState<"seats" | "groups">("seats");
  const [seats, setSeats] = useState<Seat[]>([]);
  const [groups, setGroups] = useState<SeatGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Seat | SeatGroup | null>(null);
  const [saving, setSaving] = useState(false);
  const [seatForm, setSeatForm] = useState({ e164: "", name: "", password: "", jobid: "", level: 0, locktype: 0, status: 0, priority: 0, record: 0, memo: "" });
  const [groupForm, setGroupForm] = useState({ name: "", password: "", capacity: 10, seatuplimit: 100, record: 0, schedulingtype: 0, accesse164s: "", welcome: "", schedulingdelay: 0, memo: "" });

  const fetchData = async () => {
    setLoading(true); setError("");
    try {
      const [sr, gr] = await Promise.all([fetch("/api/vos/cc-seats"), fetch("/api/vos/cc-seat-groups")]);
      const sd = await sr.json(); const gd = await gr.json();
      if (sd.error) setError(sd.error); else setSeats(sd.seats || []);
      if (gd.error) setError(gd.error); else setGroups(gd.groups || []);
    } catch { setError("Failed"); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const openAdd = () => { setEditing(null); setSeatForm({ e164: "", name: "", password: "", jobid: "", level: 0, locktype: 0, status: 0, priority: 0, record: 0, memo: "" }); setGroupForm({ name: "", password: "", capacity: 10, seatuplimit: 100, record: 0, schedulingtype: 0, accesse164s: "", welcome: "", schedulingdelay: 0, memo: "" }); setShowModal(true); };
  const openEditSeat = (s: Seat) => { setEditing(s); setSeatForm({ e164: s.e164, name: s.name, password: s.password, jobid: s.jobid, level: s.level, locktype: s.locktype, status: s.status, priority: s.priority, record: s.record, memo: s.memo }); setShowModal(true); };
  const openEditGroup = (g: SeatGroup) => { setEditing(g); setGroupForm({ name: g.name, password: g.password, capacity: g.capacity, seatuplimit: g.seatuplimit, record: g.record, schedulingtype: g.schedulingtype, accesse164s: g.accesse164s, welcome: g.welcome, schedulingdelay: g.schedulingdelay, memo: g.memo }); setShowModal(true); };

  const handleSave = async () => {
    setSaving(true); setError("");
    try {
      const isSeat = tab === "seats";
      const endpoint = isSeat ? "/api/vos/cc-seats" : "/api/vos/cc-seat-groups";
      const form = isSeat ? seatForm : groupForm;
      const method = editing ? "PUT" : "POST";
      const body = editing ? { id: editing.id, ...form } : form;
      const r = await fetch(endpoint, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await r.json();
      if (d.error) { setError(d.error); return; }
      setShowModal(false); setEditing(null); fetchData();
    } catch { setError("Failed"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(`Delete this ${tab === "seats" ? "seat" : "seat group"}?`)) return;
    try { await fetch(tab === "seats" ? `/api/vos/cc-seats?id=${id}` : `/api/vos/cc-seat-groups?id=${id}`, { method: "DELETE" }); fetchData(); } catch { }
  };

  const seatColumns: Column<Seat>[] = [
    { key: "e164", label: "Seat E164", cellClassName: "text-surface-50 font-mono font-medium text-xs" },
    { key: "name", label: "Name", render: (s) => s.name || "—" },
    { key: "level", label: "Level", textAlign: "center" as const, render: (s) => s.level },
    { key: "status", label: "Status", textAlign: "center" as const, render: (s) => s.status === 0 ? <span className="text-emerald-400">Active</span> : <span className="text-surface-500">Locked</span> },
    { key: "record", label: "Record", textAlign: "center" as const, render: (s) => s.record === 1 ? <span className="text-emerald-400">On</span> : "—" },
    { key: "memo", label: "Memo", render: (s) => s.memo || "—", cellClassName: "text-surface-400" },
    { key: "actions", label: "Actions", textAlign: "center", width: "90px", render: (s) => (
      <div className="flex items-center justify-center gap-1">
        <button onClick={() => openEditSeat(s)} className="p-1.5 rounded hover:bg-surface-700 text-surface-400 hover:text-surface-50"><Edit2 className="w-3.5 h-3.5" /></button>
        <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded hover:bg-red-500/10 text-surface-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    )},
  ];

  const groupColumns: Column<SeatGroup>[] = [
    { key: "name", label: "Group Name", cellClassName: "text-surface-50 font-medium text-xs" },
    { key: "capacity", label: "Capacity", textAlign: "center" as const, render: (g) => g.capacity || "—" },
    { key: "seatuplimit", label: "Seat Up Limit", textAlign: "center" as const, render: (g) => g.seatuplimit || "—" },
    { key: "scheduling", label: "Scheduling", textAlign: "center" as const, render: (g) => g.schedulingtype === 0 ? "Sequential" : g.schedulingtype === 1 ? "Random" : `Type ${g.schedulingtype}` },
    { key: "record", label: "Record", textAlign: "center" as const, render: (g) => g.record === 1 ? <span className="text-emerald-400">On</span> : "—" },
    { key: "welcome", label: "Welcome", render: (g) => g.welcome || "—", cellClassName: "text-surface-400" },
    { key: "actions", label: "Actions", textAlign: "center", width: "90px", render: (g) => (
      <div className="flex items-center justify-center gap-1">
        <button onClick={() => openEditGroup(g)} className="p-1.5 rounded hover:bg-surface-700 text-surface-400 hover:text-surface-50"><Edit2 className="w-3.5 h-3.5" /></button>
        <button onClick={() => handleDelete(g.id)} className="p-1.5 rounded hover:bg-red-500/10 text-surface-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    )},
  ];

  return (<div className="p-6 space-y-6">
    <div className="flex items-center justify-between">
      <div><h1 className="text-2xl font-bold text-surface-50">Call Center Management</h1><p className="text-surface-400 text-sm mt-1">{tab === "seats" ? seats.length : groups.length} {tab === "seats" ? "seats" : "seat groups"}</p></div>
      <div className="flex items-center gap-2">
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium"><Plus className="w-4 h-4" />Add {tab === "seats" ? "Seat" : "Seat Group"}</button>
        <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-800 text-surface-300 hover:bg-surface-700 text-sm"><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />Refresh</button>
      </div>
    </div>

    <div className="flex gap-2 border-b border-surface-800 pb-px">
      <button onClick={() => setTab("seats")} className={`px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 -mb-px ${tab === "seats" ? "border-brand-500 text-surface-50 bg-surface-900" : "border-transparent text-surface-500 hover:text-surface-300"}`}>Seats</button>
      <button onClick={() => setTab("groups")} className={`px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 -mb-px ${tab === "groups" ? "border-brand-500 text-surface-50 bg-surface-900" : "border-transparent text-surface-500 hover:text-surface-300"}`}>Seat Groups</button>
    </div>

    {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

    {tab === "seats" ? (
      <DataTable columns={seatColumns} data={seats} searchKey="e164" loading={loading} emptyMessage="No call center seats" emptyIcon={<Headset className="w-10 h-10 text-surface-600" />} pageSize={20} />
    ) : (
      <DataTable columns={groupColumns} data={groups} searchKey="name" loading={loading} emptyMessage="No seat groups" emptyIcon={<Users className="w-10 h-10 text-surface-600" />} pageSize={20} />
    )}

    {showModal && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"><div className="bg-surface-900 border border-surface-700 rounded-2xl w-full max-w-md mx-4">
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-800"><h2 className="text-lg font-semibold text-surface-50">{editing ? "Edit" : "Add"} {tab === "seats" ? "Seat" : "Seat Group"}</h2><button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-surface-800 text-surface-500 hover:text-surface-50"><X className="w-5 h-5" /></button></div>
      <div className="px-6 py-4 space-y-4">
        {tab === "seats" ? (
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-medium text-surface-400 mb-1">Seat E164 *</label><input value={seatForm.e164} onChange={e => setSeatForm({ ...seatForm, e164: e.target.value })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm font-mono" /></div>
            <div><label className="block text-xs font-medium text-surface-400 mb-1">Name</label><input value={seatForm.name} onChange={e => setSeatForm({ ...seatForm, name: e.target.value })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm" /></div>
            <div><label className="block text-xs font-medium text-surface-400 mb-1">Password</label><input value={seatForm.password} onChange={e => setSeatForm({ ...seatForm, password: e.target.value })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm" /></div>
            <div><label className="block text-xs font-medium text-surface-400 mb-1">Job ID</label><input value={seatForm.jobid} onChange={e => setSeatForm({ ...seatForm, jobid: e.target.value })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm" /></div>
            <div><label className="block text-xs font-medium text-surface-400 mb-1">Level</label><input type="number" value={seatForm.level} onChange={e => setSeatForm({ ...seatForm, level: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm" /></div>
            <div><label className="block text-xs font-medium text-surface-400 mb-1">Priority</label><input type="number" value={seatForm.priority} onChange={e => setSeatForm({ ...seatForm, priority: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm" /></div>
            <div><label className="block text-xs font-medium text-surface-400 mb-1">Status</label>
              <select value={seatForm.status} onChange={e => setSeatForm({ ...seatForm, status: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm">
                <option value={0}>Active</option><option value={1}>Locked</option>
              </select></div>
            <div><label className="block text-xs font-medium text-surface-400 mb-1">Recording</label>
              <select value={seatForm.record} onChange={e => setSeatForm({ ...seatForm, record: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm">
                <option value={0}>Off</option><option value={1}>On</option>
              </select></div>
            <div className="col-span-2"><label className="block text-xs font-medium text-surface-400 mb-1">Memo</label><input value={seatForm.memo} onChange={e => setSeatForm({ ...seatForm, memo: e.target.value })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm" /></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs font-medium text-surface-400 mb-1">Group Name *</label><input value={groupForm.name} onChange={e => setGroupForm({ ...groupForm, name: e.target.value })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm" /></div>
            <div><label className="block text-xs font-medium text-surface-400 mb-1">Password</label><input value={groupForm.password} onChange={e => setGroupForm({ ...groupForm, password: e.target.value })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm" /></div>
            <div><label className="block text-xs font-medium text-surface-400 mb-1">Capacity</label><input type="number" value={groupForm.capacity} onChange={e => setGroupForm({ ...groupForm, capacity: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm" /></div>
            <div><label className="block text-xs font-medium text-surface-400 mb-1">Seat Up Limit</label><input type="number" value={groupForm.seatuplimit} onChange={e => setGroupForm({ ...groupForm, seatuplimit: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm" /></div>
            <div><label className="block text-xs font-medium text-surface-400 mb-1">Scheduling</label>
              <select value={groupForm.schedulingtype} onChange={e => setGroupForm({ ...groupForm, schedulingtype: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm">
                <option value={0}>Sequential</option><option value={1}>Random</option>
              </select></div>
            <div><label className="block text-xs font-medium text-surface-400 mb-1">Recording</label>
              <select value={groupForm.record} onChange={e => setGroupForm({ ...groupForm, record: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm">
                <option value={0}>Off</option><option value={1}>On</option>
              </select></div>
            <div className="col-span-2"><label className="block text-xs font-medium text-surface-400 mb-1">Access E164s</label><input value={groupForm.accesse164s} onChange={e => setGroupForm({ ...groupForm, accesse164s: e.target.value })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm font-mono" /></div>
            <div className="col-span-2"><label className="block text-xs font-medium text-surface-400 mb-1">Welcome Audio</label><input value={groupForm.welcome} onChange={e => setGroupForm({ ...groupForm, welcome: e.target.value })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm" /></div>
            <div className="col-span-2"><label className="block text-xs font-medium text-surface-400 mb-1">Memo</label><input value={groupForm.memo} onChange={e => setGroupForm({ ...groupForm, memo: e.target.value })} className="w-full px-3 py-2 bg-surface-800 border border-surface-700/50 rounded-lg text-surface-50 text-sm" /></div>
          </div>
        )}
      </div>
      <div className="px-6 py-4 border-t border-surface-800 flex gap-3">
        <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-surface-700 text-surface-300 rounded-lg text-sm hover:bg-surface-800">Cancel</button>
        <button onClick={handleSave} disabled={saving || (tab === "seats" ? !seatForm.e164 : !groupForm.name)} className="flex-1 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-surface-50 rounded-lg text-sm font-medium disabled:opacity-50">{saving ? "Saving..." : editing ? "Update" : "Create"}</button>
      </div>
    </div></div>)}
  </div>);
}
