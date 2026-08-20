"use client";
import { Bell, AlarmClock, History, SlidersHorizontal } from "lucide-react";
import Link from "next/link";

export default function AlarmsPage() {
  const items = [
    { href: "/dashboard/alarms/current", icon: Bell, label: "Current Alarm", desc: "Active alarms right now" },
    { href: "/dashboard/alarms/history", icon: History, label: "History Alarm", desc: "Past alarm records" },
    { href: "/dashboard/alarms/settings", icon: SlidersHorizontal, label: "Alarm Settings", desc: "Thresholds and notification settings" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-50 flex items-center gap-2">
          <AlarmClock className="w-6 h-6 text-amber-400" />
          Alarm Management
        </h1>
        <p className="text-surface-400 text-sm mt-1">Current, historical, and configured alarms</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.map(item => (
          <Link key={item.href} href={item.href}
            className="bg-surface-900 border border-surface-700/50 rounded-xl p-6 hover:border-brand-500/30 hover:bg-surface-800/50 transition-all duration-200 group">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4 group-hover:bg-amber-500/20 transition-colors">
              <item.icon className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="text-surface-50 font-semibold mb-1">{item.label}</h3>
            <p className="text-surface-400 text-sm">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
