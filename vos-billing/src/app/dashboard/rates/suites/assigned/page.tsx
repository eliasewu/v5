"use client";

import { useState, useEffect } from "react";
import { Layers, RefreshCw, ClipboardList, User } from "lucide-react";
import DataTable, { type Column } from "@/components/DataTable";

interface CurrentSuite { id: number; name: string; rentperiod: number; renttype_label: string; availabletime: string | null; expiretime: string | null; currentconsumption: number; minconsumption: number; lowerconsumption: number; giftmoney: number; suiteoderid: number; suiteid: number; customer_id: number; customer_name: string; customer_account: string; }
interface SuiteOrder { id: number; availabletime: string | null; expiretime: string | null; priority: number; failedprocessmode: number; rentpercent: number; memo: string; suite_id: number; suite_name: string; customer_id: number; customer_name: string; customer_account: string; }

const fmtMoney = (n: number) => n ? n.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—";

export default function AssignedSuitesPage() {
  const [tab, setTab] = useState<"current" | "orders">("current");
  const [current, setCurrent] = useState<CurrentSuite[]>([]);
  const [orders, setOrders] = useState<SuiteOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true); setError("");
    try {
      const r = await fetch("/api/vos/customer-suites");
      const d = await r.json();
      if (d.error) setError(d.error); else { setCurrent(d.current || []); setOrders(d.orders || []); }
    } catch { setError("Failed"); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchData(); }, []);

  const customerCell = (c: string, a: string) => (
    <div className="flex items-center gap-2">
      <User className="w-3.5 h-3.5 text-surface-500" />
      <div>
        <div className="text-surface-50 text-xs font-medium">{c || `Customer #${0}`}</div>
        {a && <div className="text-surface-500 text-[10px] font-mono">{a}</div>}
      </div>
    </div>
  );

  const currentColumns: Column<CurrentSuite>[] = [
    { key: "customer", label: "Customer", render: (s) => customerCell(s.customer_name, s.customer_account) },
    { key: "name", label: "Suite", render: (s) => s.name || `#${s.suiteid}`, cellClassName: "text-surface-50 font-medium text-xs" },
    { key: "rent", label: "Rent", textAlign: "center", render: (s) => `${s.rentperiod} ${s.renttype_label.toLowerCase()}(s)` },
    { key: "available", label: "Available", render: (s) => s.availabletime || "—", cellClassName: "text-surface-400 font-mono text-[11px]" },
    { key: "expires", label: "Expires", render: (s) => s.expiretime || "—", cellClassName: "text-surface-400 font-mono text-[11px]" },
    { key: "consumption", label: "Consumption", textAlign: "right", render: (s) => fmtMoney(s.currentconsumption) },
    { key: "giftmoney", label: "Gift Money", textAlign: "right", render: (s) => fmtMoney(s.giftmoney) },
  ];

  const orderColumns: Column<SuiteOrder>[] = [
    { key: "customer", label: "Customer", render: (o) => customerCell(o.customer_name, o.customer_account) },
    { key: "suite", label: "Suite", render: (o) => o.suite_name || `#${o.suite_id}`, cellClassName: "text-surface-50 font-medium text-xs" },
    { key: "priority", label: "Priority", textAlign: "center", render: (o) => o.priority || "—" },
    { key: "rentpercent", label: "Rent %", textAlign: "right", render: (o) => o.rentpercent ? `${o.rentpercent}%` : "—" },
    { key: "available", label: "Available", render: (o) => o.availabletime || "—", cellClassName: "text-surface-400 font-mono text-[11px]" },
    { key: "expires", label: "Expires", render: (o) => o.expiretime || "—", cellClassName: "text-surface-400 font-mono text-[11px]" },
    { key: "failedmode", label: "Fail Mode", textAlign: "center", render: (o) => o.failedprocessmode === 0 ? "Stop" : o.failedprocessmode === 1 ? "Continue" : o.failedprocessmode === 2 ? "Next" : `Mode ${o.failedprocessmode}` },
    { key: "memo", label: "Memo", render: (o) => o.memo || "—", cellClassName: "text-surface-400" },
  ];

  return (<div className="p-6 space-y-6">
    <div className="flex items-center justify-between">
      <div><h1 className="text-2xl font-bold text-surface-50">Assigned Suites</h1><p className="text-surface-400 text-sm mt-1">{tab === "current" ? current.length : orders.length} assignment{tab === "current" ? (current.length !== 1 ? "s" : "") : (orders.length !== 1 ? "s" : "")} — read-only view of suites assigned per customer</p></div>
      <button onClick={fetchData} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-800 text-surface-300 hover:bg-surface-700 text-sm"><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />Refresh</button>
    </div>

    <div className="flex gap-2 border-b border-surface-800 pb-px">
      <button onClick={() => setTab("current")} className={`px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 -mb-px ${tab === "current" ? "border-brand-500 text-surface-50 bg-surface-900" : "border-transparent text-surface-500 hover:text-surface-300"}`}>Current Suites</button>
      <button onClick={() => setTab("orders")} className={`px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 -mb-px ${tab === "orders" ? "border-brand-500 text-surface-50 bg-surface-900" : "border-transparent text-surface-500 hover:text-surface-300"}`}>Suite Orders</button>
    </div>

    {error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

    {tab === "current" ? (
      <DataTable columns={currentColumns} data={current} searchKey="customer_name" loading={loading} emptyMessage="No current suites assigned — assign a suite via the core or suite orders" emptyIcon={<Layers className="w-10 h-10 text-surface-600" />} pageSize={20} />
    ) : (
      <DataTable columns={orderColumns} data={orders} searchKey="customer_name" loading={loading} emptyMessage="No suite orders — create suite orders to assign suites to customers" emptyIcon={<ClipboardList className="w-10 h-10 text-surface-600" />} pageSize={20} />
    )}
  </div>);
}
