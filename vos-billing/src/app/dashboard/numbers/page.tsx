"use client";
import { Hash, MapPin, Globe, Layers, ShieldCheck, Ban, ListChecks } from "lucide-react";
import Link from "next/link";

export default function NumbersPage() {
  const items = [
    { href: "/dashboard/numbers/sections", icon: Hash, label: "Number Section Query", desc: "Query and manage E.164 number sections" },
    { href: "/dashboard/numbers/mobile-area", icon: MapPin, label: "Mobile Area", desc: "Mobile prefixes mapped to areas and cities" },
    { href: "/dashboard/numbers/city-code", icon: Globe, label: "City Code", desc: "City codes with province and E.164 length rules" },
    { href: "/dashboard/numbers/area-info", icon: MapPin, label: "Area Information", desc: "Area codes with billing increments" },
    { href: "/dashboard/numbers/limit-groups", icon: Layers, label: "Black/White List Group", desc: "E.164 groups for call restrictions" },
    { href: "/dashboard/numbers/system-whitelist", icon: ShieldCheck, label: "System White List", desc: "System-wide allowed E.164 numbers" },
    { href: "/dashboard/numbers/terminal-blacklist", icon: Ban, label: "Terminal Blacklist Policy", desc: "Policies applied to terminal blacklists" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-50 flex items-center gap-2">
          <ListChecks className="w-6 h-6 text-amber-400" />
          Number Management
        </h1>
        <p className="text-surface-400 text-sm mt-1">Number sections, area codes, and call restriction lists</p>
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
