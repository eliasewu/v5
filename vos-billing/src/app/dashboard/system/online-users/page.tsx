"use client";

import { useState, useEffect } from "react";
import { UserCheck, RefreshCw, Wifi } from "lucide-react";
import DataTable, { type Column } from "@/components/DataTable";

interface OnlineUser { socketId: number; loginIp: string; loginTime: number; userId: number; loginName: string; userName: string; }

export default function OnlineUsersPage() {
  const [users, setUsers] = useState<OnlineUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchUsers = async () => {
    setLoading(true); setError("");
    try { const r=await fetch("/api/vos/online-users"); const d=await r.json(); if(d.error)setError(d.error); else setUsers(d.users||[]); } catch { setError("Failed"); }
    finally { setLoading(false); }
  };

  useEffect(()=>{fetchUsers();},[]);

  const fmtTime = (t:number) => t ? new Date(t * 1000).toLocaleString("en-US", { year:"numeric", month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" }) : "—";

  const columns: Column<OnlineUser>[] = [
    { key: "loginName", label: "Login", cellClassName: "text-surface-50 font-medium font-mono text-xs" },
    { key: "userName", label: "Name", render: (u) => u.userName || "—" },
    { key: "loginIp", label: "Login IP", render: (u) => <span className="flex items-center gap-1 font-mono text-xs"><Wifi className="w-3 h-3 text-emerald-400"/>{u.loginIp || "—"}</span> },
    { key: "loginTime", label: "Login Time", render: (u) => <span className="text-xs text-surface-400">{fmtTime(u.loginTime)}</span> },
    { key: "socketId", label: "Socket", textAlign: "center" as const, render: (u) => <span className="font-mono text-xs">{u.socketId}</span> },
  ];

  return (<div className="p-6 space-y-6">
    <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold text-surface-50">Online User</h1><p className="text-surface-400 text-sm mt-1">{users.length} users currently logged in</p></div>
    <button onClick={fetchUsers} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-800 text-surface-300 hover:bg-surface-700 text-sm"><RefreshCw className={`w-4 h-4 ${loading?"animate-spin":""}`}/>Refresh</button></div>

    {error&&<div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

    <DataTable columns={columns} data={users} searchKey="loginName" loading={loading} emptyMessage="No users online" emptyIcon={<UserCheck className="w-10 h-10 text-surface-600" />} pageSize={20} />
  </div>);
}
