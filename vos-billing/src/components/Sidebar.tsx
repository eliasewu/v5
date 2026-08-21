"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  DollarSign,
  Layers,
  Package,
  Clock,
  Calendar,
  Building2,
  Users,
  Wallet,
  UserCog,
  FileText,
  Key,
  Hash,
  Server,
  ArrowLeftRight,
  GitBranch,
  Network,
  Phone,
  TrendingUp,
  Activity,
  BarChart3,
  Database,
  Search,
  Receipt,
  LogIn,
  ClipboardList,
  PieChart,
  CalendarDays,
  UserCheck,
  CreditCard,
  Radio,
  Bell,
  Settings,
  SlidersHorizontal,
  Route,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Zap,
  Shield,
  X,
  Mail,
  RefreshCw,
  Rocket,
  Globe,
  ScrollText,
  AlarmClock,
  History,
  KeySquare,
  ShieldCheck,
  MapPin,
  ListChecks,
  Ban,
  Wifi,
  PhoneCall,
  MonitorDot,
  Cpu,
  HardDrive,
  Headset,
  Mailbox,
  Video,
  Link2,
  Eraser,
  ListMusic,
  Music,
  PhoneForwarded,
  UserPlus,
  Gift,
} from "lucide-react";
import { useState, useEffect } from "react";

function VersionDisplay({ collapsed }: { collapsed: boolean }) {
  const [version, setVersion] = useState<{ tag: string; commit: string; date: string; behind: number; ahead: number } | null>(null);
  const [checking, setChecking] = useState(false);

  const [deploying, setDeploying] = useState(false);
  const [deployMsg, setDeployMsg] = useState("");

  const fetchVersion = () => {
    fetch("/api/version")
      .then(r => r.json())
      .then(d => setVersion(d))
      .catch(() => {});
  };

  useEffect(() => { fetchVersion(); }, []);

  const checkUpdates = async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/version", { method: "POST" });
      const data = await res.json();
      setVersion(data);
    } catch { /* ignore */ }
    finally { setChecking(false); }
  };

  const triggerDeploy = async () => {
    if (!confirm("Deploy the latest code to production? This will rebuild and restart the service.")) return;
    setDeploying(true);
    setDeployMsg("");
    try {
      const res = await fetch("/api/deploy", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setDeployMsg("✅ Deployed! Refresh to see new version.");
        setTimeout(() => setDeployMsg(""), 8000);
      } else {
        setDeployMsg(`❌ ${data.error || "Deploy failed"}`);
      }
    } catch {
      setDeployMsg("❌ Deploy request failed");
    }
    setDeploying(false);
  };

  if (!version) return null;

  const label = version.tag || version.commit;
  const hasUpdates = version.behind > 0;
  const unpushed = version.ahead > 0;

  return (
    <div className="border-t border-brand-500 px-3 py-2">
      {collapsed ? (
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-mono text-white/40" title={`${label} (${version.date})`}>
            {version.commit}
          </span>
          <button
            onClick={checkUpdates}
            disabled={checking}
            className="p-0.5 rounded hover:bg-white/10 text-white/30 hover:text-white/60 transition-colors"
            title="Check for updates"
          >
            <RefreshCw className={`w-3 h-3 ${checking ? "animate-spin" : ""}`} />
          </button>
          {hasUpdates && <span className="text-[8px] text-amber-400 font-bold">↓{version.behind}</span>}
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-white/50">{label}</span>
            <div className="flex items-center gap-1">
              {unpushed && (
                <span className="text-[8px] text-amber-400/70 font-mono" title={`${version.ahead} unpushed`}>
                  ↑{version.ahead}
                </span>
              )}
              {hasUpdates && (
                <span className="text-[8px] text-amber-400 font-bold" title={`${version.behind} update(s) available`}>
                  ↓{version.behind}
                </span>
              )}
              <span className="text-[9px] text-white/30">{version.date}</span>
              <button
                onClick={checkUpdates}
                disabled={checking}
                className="p-0.5 rounded hover:bg-white/10 text-white/30 hover:text-white/60 transition-colors"
                title="Check for updates (fetch from origin)"
              >
                <RefreshCw className={`w-3 h-3 ${checking ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
          {hasUpdates && (
            <div className="mt-1 text-[9px] text-amber-400/80">
              {version.behind} update{version.behind !== 1 ? "s" : ""} available — run deploy.sh
            </div>
          )}
          {hasUpdates && !collapsed && (
            <button
              onClick={triggerDeploy}
              disabled={deploying}
              className="mt-1 w-full flex items-center justify-center gap-1 px-2 py-1 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 transition-colors disabled:opacity-50"
            >
              <Rocket className={`w-3 h-3 ${deploying ? "animate-pulse" : ""}`} />
              {deploying ? "Deploying..." : "Deploy Now"}
            </button>
          )}
          {deployMsg && (
            <div className={`mt-1 text-[9px] ${deployMsg.startsWith("✅") ? "text-emerald-400" : "text-red-400"}`}>
              {deployMsg}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children: (NavItem | NavSection)[];
}

type MenuItem = NavItem | NavSection;

function isNavSection(item: MenuItem): item is NavSection {
  return "children" in item && !("href" in item);
}

const TOP_LEVEL_SECTIONS = new Set([
  "Rate Management", "Package Management", "Account Management",
  "Operation Management", "Data Query", "Data Report",
  "CDR Analysis", "Cards Management", "Number Management",
  "Interface Management", "Alarm Management", "System Management"
]);

// Map URL path prefixes to the top-level section that should be expanded
const PATH_TO_SECTION: [string, string][] = [
  ["/dashboard/rates", "Rate Management"],
  ["/dashboard/packages", "Package Management"],
  ["/dashboard/accounts", "Account Management"],
  ["/dashboard/clearing", "Account Management"],
  ["/dashboard/operation", "Operation Management"],
  ["/dashboard/online-routing", "Operation Management"],
  ["/dashboard/online-mapping", "Operation Management"],
  ["/dashboard/gateway-status", "Operation Management"],
  ["/dashboard/active-calls", "Operation Management"],
  ["/dashboard/active-phone-cards", "Operation Management"],
  ["/dashboard/cdr-analysis", "CDR Analysis"],
  ["/dashboard/data-query", "Data Query"],
  ["/dashboard/bill-query", "Data Query"],
  ["/dashboard/clearing-query", "Data Query"],
  ["/dashboard/reports", "Data Report"],
  ["/dashboard/cards", "Cards Management"],
  ["/dashboard/phone-card", "Cards Management"],
  ["/dashboard/numbers", "Number Management"],
  ["/dashboard/interface", "Interface Management"],
  ["/dashboard/alarms", "Alarm Management"],
  ["/dashboard/system", "System Management"],
];

function getExpandedSection(pathname: string): string | null {
  for (const [prefix, section] of PATH_TO_SECTION) {
    if (pathname === prefix || pathname.startsWith(prefix + "/") || pathname.startsWith(prefix + "?")) {
      return section;
    }
  }
  return null;
}

const menuSections: MenuItem[] = [
  // Dashboard
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },

  // Rate Management
  {
    label: "Rate Management",
    icon: DollarSign,
    children: [
      { href: "/dashboard/rates/groups", label: "Rate Group Management", icon: Layers },
      { href: "/dashboard/rates", label: "Rate Management", icon: DollarSign },
      { href: "/dashboard/rates/wizard", label: "Rate Wizard", icon: Zap },
      { href: "/dashboard/rates/quick-start", label: "Quick Start Wizard", icon: Zap },
      { href: "/dashboard/rates/suites", label: "Suite Management", icon: Package },
      { href: "/dashboard/rates/suites/assigned", label: "Assigned Suites", icon: ClipboardList },
      { href: "/dashboard/rates/gift-time", label: "Gift Time Rules", icon: Gift },
    ],
  },

  // Package Management
  {
    label: "Package Management",
    icon: Package,
    children: [
      { href: "/dashboard/packages/groups", label: "Package Group Management", icon: Layers },
      { href: "/dashboard/packages/free-duration", label: "Package Free Duration", icon: Clock },
      { href: "/dashboard/packages/period-rate", label: "Package Period Rate", icon: Calendar },
    ],
  },

  // Account Management
  {
    label: "Account Management",
    icon: Building2,
    children: [
      { href: "/dashboard/accounts/general", label: "General Account", icon: Users },
      { href: "/dashboard/accounts/payment", label: "Payment", icon: Wallet },
      { href: "/dashboard/accounts/agent", label: "Agent Account", icon: UserCog },
      { href: "/dashboard/accounts/billing", label: "Billing", icon: FileText },
      { href: "/dashboard/clearing", label: "Clearing Account", icon: Shield },
      { href: "/dashboard/accounts/auth", label: "Authorization Mgmt", icon: Key },
      { href: "/dashboard/accounts/number-limit", label: "Number Section Limit", icon: Hash },
      { href: "/dashboard/accounts/invoice", label: "Invoice Generator", icon: Receipt },
    ],
  },

  // Operation Management
  {
    label: "Operation Management",
    icon: Radio,
    children: [
      {
        label: "Gateway Operation",
        icon: Server,
        children: [
          { href: "/dashboard/operation/gateways/routing", label: "Routing Gateway", icon: ArrowLeftRight },
          { href: "/dashboard/operation/gateways/mapping", label: "Mapping Gateway", icon: GitBranch },
          { href: "/dashboard/operation/gateways/group", label: "Gateway Group", icon: Network },
          { href: "/dashboard/online-routing", label: "Online Routing Gateway", icon: ArrowLeftRight },
          { href: "/dashboard/online-mapping", label: "Online Mapping Gateway", icon: GitBranch },
          { href: "/dashboard/gateway-status", label: "Gateway Status", icon: Activity },
          { href: "/dashboard/operation/ip-whitelist", label: "IP Whitelist Firewall", icon: Shield },
        ],
      },
      {
        label: "Phone Operation",
        icon: Phone,
        children: [
          { href: "/dashboard/operation/phone", label: "Phone Management", icon: Phone },
          { href: "/dashboard/active-phone-cards", label: "Online Phone", icon: Radio },
        ],
      },
      {
        label: "Business Analysis",
        icon: TrendingUp,
        children: [
          { href: "/dashboard/operation/business-analysis", label: "Routing Analysis", icon: TrendingUp },
          { href: "/dashboard/operation/network-test", label: "Network Test", icon: Wifi },
          { href: "/dashboard/operation/call-performance", label: "Call Analysis", icon: BarChart3 },
        ],
      },
      { href: "/dashboard/operation/current-call", label: "Current Call", icon: Activity },
      { href: "/dashboard/operation/registration", label: "Registration Management", icon: PhoneCall },
      { href: "/dashboard/operation/domains", label: "Domain Management", icon: Globe },
      { href: "/dashboard/system/routes", label: "Route Management", icon: Route },
    ],
  },

  // Data Query
  {
    label: "Data Query",
    icon: Database,
    children: [
      { href: "/dashboard/data-query/recent-cdr", label: "Recent CDR", icon: Clock },
      { href: "/dashboard/data-query/cdr", label: "CDR", icon: Search },
      { href: "/dashboard/data-query/payment", label: "Payment Record", icon: Receipt },
      {
        label: "Bill Query",
        icon: FileText,
        children: [
          { href: "/dashboard/bill-query/revenue-detail", label: "Revenue Detail", icon: DollarSign },
          { href: "/dashboard/bill-query/gateway-bill", label: "Gateway Bill", icon: Server },
          { href: "/dashboard/bill-query/phone-bill", label: "Phone Bill", icon: Phone },
          { href: "/dashboard/bill-query/area-detail", label: "Area Detail", icon: MapPin },
          { href: "/dashboard/bill-query/account-area", label: "Account Area", icon: Building2 },
          { href: "/dashboard/bill-query/account-balance", label: "Account Balance", icon: Wallet },
        ],
      },
      {
        label: "Clearing Query",
        icon: Shield,
        children: [
          { href: "/dashboard/clearing-query/account-detail", label: "Clearing Account Detail", icon: Shield },
          { href: "/dashboard/clearing-query/gateway-detail", label: "Clearing Gateway Detail", icon: Server },
          { href: "/dashboard/clearing-query/account-balance", label: "Account Clearing Balance", icon: Wallet },
        ],
      },
    ],
  },

  // Data Report
  {
    label: "Data Report",
    icon: PieChart,
    children: [
      {
        label: "Bill Report",
        icon: FileText,
        children: [
          { href: "/dashboard/reports/daily", label: "Revenue Detail Report", icon: Calendar },
          { href: "/dashboard/reports/monthly", label: "Monthly Report", icon: CalendarDays },
          { href: "/dashboard/reports/agent", label: "Agent Income Report", icon: UserCheck },
        ],
      },
      { href: "/dashboard/clearing/reports", label: "Clearing Report", icon: Shield },
      {
        label: "Analysis Report",
        icon: BarChart3,
        children: [
          { href: "/dashboard/cdr-analysis/mapping-performance", label: "Mapping Gateway Analysis", icon: GitBranch },
          { href: "/dashboard/cdr-analysis/routing-performance", label: "Routing Gateway Analysis", icon: ArrowLeftRight },
          { href: "/dashboard/cdr-analysis/mapping-area-analysis", label: "Mapping Gateway Area Analysis", icon: MapPin },
          { href: "/dashboard/cdr-analysis/routing-area-analysis", label: "Routing Gateway Area Analysis", icon: MapPin },
          { href: "/dashboard/cdr-analysis/mapping-cross-analysis", label: "Gateway Cross Area Analysis", icon: Network },
        ],
      },
      { href: "/dashboard/reports/management", label: "Report Management", icon: ClipboardList },
    ],
  },

  // CDR Analysis
  {
    label: "CDR Analysis",
    icon: BarChart3,
    children: [
      {
        label: "Mapping Gateway",
        icon: GitBranch,
        children: [
          { href: "/dashboard/cdr-analysis/mapping-performance", label: "Performance", icon: TrendingUp },
          { href: "/dashboard/cdr-analysis/mapping-call-analysis", label: "Call Analysis", icon: Phone },
          { href: "/dashboard/cdr-analysis/mapping-fail-analysis", label: "Fail Analysis", icon: X },
          { href: "/dashboard/cdr-analysis/mapping-call-daily", label: "Call Daily", icon: Calendar },
          { href: "/dashboard/cdr-analysis/mapping-area-analysis", label: "Area Analysis", icon: Network },
          { href: "/dashboard/cdr-analysis/mapping-cross-analysis", label: "Cross Analysis", icon: GitBranch },
        ],
      },
      {
        label: "Routing Gateway",
        icon: ArrowLeftRight,
        children: [
          { href: "/dashboard/cdr-analysis/routing-performance", label: "Performance", icon: TrendingUp },
          { href: "/dashboard/cdr-analysis/routing-call-analysis", label: "Call Analysis", icon: Phone },
          { href: "/dashboard/cdr-analysis/routing-fail-analysis", label: "Fail Analysis", icon: X },
          { href: "/dashboard/cdr-analysis/routing-call-daily", label: "Call Daily", icon: Calendar },
          { href: "/dashboard/cdr-analysis/routing-area-analysis", label: "Area Analysis", icon: Network },
          { href: "/dashboard/cdr-analysis/routing-cross-analysis", label: "Cross Analysis", icon: GitBranch },
        ],
      },
    ],
  },

  // Cards Management
  {
    label: "Cards Management",
    icon: CreditCard,
    children: [
      { href: "/dashboard/phone-card", label: "Phone Card", icon: CreditCard },
      { href: "/dashboard/cards/suite", label: "Suite Management", icon: Layers },
      { href: "/dashboard/cards/management", label: "Cards Management", icon: CreditCard },
      { href: "/dashboard/cards/active", label: "Active Management", icon: Radio },
    ],
  },

  // Number Management
  {
    label: "Number Management",
    icon: Hash,
    children: [
      { href: "/dashboard/numbers/sections", label: "Number Section Query", icon: Hash },
      { href: "/dashboard/numbers/mobile-area", label: "Mobile Area", icon: MapPin },
      { href: "/dashboard/numbers/city-code", label: "City Code", icon: Globe },
      { href: "/dashboard/numbers/area-info", label: "Area Information", icon: MapPin },
      { href: "/dashboard/numbers/limit-groups", label: "Black/White List Group", icon: ListChecks },
      { href: "/dashboard/numbers/system-whitelist", label: "System White List", icon: ShieldCheck },
      { href: "/dashboard/numbers/terminal-blacklist", label: "Terminal Blacklist Policy", icon: Ban },
    ],
  },

  // Interface Management
  {
    label: "Interface Management",
    icon: Server,
    children: [
      { href: "/dashboard/interface/web-access", label: "Web Access Control", icon: Shield },
      { href: "/dashboard/interface/equipment", label: "Web Service Equipment", icon: Server },
    ],
  },

  // Value-Added Services
  {
    label: "Value-Added Services",
    icon: PhoneCall,
    children: [
      { href: "/dashboard/ivr", label: "IVR Service", icon: Phone },
      { href: "/dashboard/conference", label: "Conference", icon: Video },
      { href: "/dashboard/call-center", label: "Call Center", icon: Headset },
      { href: "/dashboard/mailbox", label: "Mailbox", icon: Mailbox },
      { href: "/dashboard/phone-service", label: "Phone Service", icon: PhoneCall },
      { href: "/dashboard/e164-group", label: "E164 Group", icon: Link2 },
      { href: "/dashboard/interface-agent", label: "Interface Agent", icon: Server },
      { href: "/dashboard/axb-cdr", label: "AXB CDR Query", icon: PhoneForwarded },
    ],
  },

  // Alarm Management
  {
    label: "Alarm Management",
    icon: Bell,
    children: [
      { href: "/dashboard/alarms/settings", label: "Alarm Settings", icon: SlidersHorizontal },
      { href: "/dashboard/alarms/current", label: "Current Alarm", icon: Bell },
      { href: "/dashboard/alarms/history", label: "History Alarm", icon: History },
    ],
  },

  // System Management
  {
    label: "System Management",
    icon: Settings,
    children: [
      { href: "/dashboard/system/users", label: "User Management", icon: Users },
      { href: "/dashboard/system/log", label: "System Log", icon: ScrollText },
      { href: "/dashboard/system/parameters", label: "System Parameter", icon: SlidersHorizontal },
      { href: "/dashboard/system/calendar", label: "Work Calendar", icon: CalendarDays },
      { href: "/dashboard/system/online-users", label: "Online User", icon: UserCheck },
      { href: "/dashboard/system/privileges", label: "User Privilege Template", icon: KeySquare },
      { href: "/dashboard/system/routes", label: "Route Management", icon: Route },
      { href: "/dashboard/system/numbers", label: "Number Management", icon: Hash },
      { href: "/dashboard/system/smtp", label: "SMTP Configuration", icon: Mail },
      { href: "/dashboard/system/prefixes", label: "Prefix Database", icon: Hash },
      { href: "/dashboard/system/auto-clean", label: "Auto Clean", icon: Eraser },
      { href: "/dashboard/system/lerg", label: "LERG Database", icon: Database },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => {
    const section = getExpandedSection(pathname);
    return new Set(section ? [section] : []);
  });

  // Auto-expand the section containing current page when navigating
  useEffect(() => {
    const section = getExpandedSection(pathname);
    if (!section) return;
    setExpandedSections(prev => {
      // Skip if already correct (avoids redundant re-render on initial mount)
      if (prev.has(section) && [...prev].every(s => !TOP_LEVEL_SECTIONS.has(s) || s === section)) {
        return prev;
      }
      const next = new Set(prev);
      // Only close other top-level sections (accordion behavior)
      for (const topLabel of TOP_LEVEL_SECTIONS) {
        if (topLabel !== section) next.delete(topLabel);
      }
      next.add(section);
      return next;
    });
  }, [pathname]);

  const toggleSection = (label: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      
      if (next.has(label)) {
        // Close this section
        next.delete(label);
      } else {
        // If it's a top-level section, close all other top-level sections (accordion)
        if (TOP_LEVEL_SECTIONS.has(label)) {
          for (const topLabel of TOP_LEVEL_SECTIONS) {
            next.delete(topLabel);
          }
        }
        next.add(label);
      }
      return next;
    });
  };

  const isActive = (href: string) => {
    const [base, query] = href.split("?");
    if (query) {
      const params = new URLSearchParams(query);
      const typeMatch = params.get("type") === searchParams.get("type");
      return pathname === base && typeMatch;
    }
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname === href || pathname.startsWith(href + "/") || pathname.startsWith(href + "?");
  };

  const renderItem = (item: NavItem, depth = 0) => {
    const Icon = item.icon;
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        prefetch={!active}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
          active
            ? "bg-white/20 text-white font-bold"
            : "text-white/70 hover:bg-white/10 hover:text-white font-bold"
        }`}
        style={{ paddingLeft: `${12 + depth * 14}px` }}
        title={collapsed ? item.label : undefined}
      >
        <Icon className="w-[18px] h-[18px] flex-shrink-0" />
        {!collapsed && <span className="truncate text-xs">{item.label}</span>}
      </Link>
    );
  };

  const renderChildren = (children: (NavItem | NavSection)[], depth: number) => {
    return children.map((child) => {
      if (isNavSection(child)) {
        const section = child as NavSection;
        const SectionIcon = section.icon;
        const isExpanded = expandedSections.has(section.label);
        return (
          <div key={section.label}>
            {!collapsed && (
              <button
                onClick={() => toggleSection(section.label)}
                className="w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs font-bold text-white/50 hover:bg-white/10 hover:text-white/80 transition-colors"
                style={{ paddingLeft: `${12 + depth * 14}px` }}
              >
                <SectionIcon className="w-[14px] h-[14px] flex-shrink-0" />
                <span className="truncate flex-1 text-left">{section.label}</span>
                <ChevronDown
                  className={`w-3 h-3 flex-shrink-0 transition-transform ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
              </button>
            )}
            {isExpanded && (
              <div className="mt-0.5">
                {renderChildren(section.children, depth + 1)}
              </div>
            )}
          </div>
        );
      }
      return renderItem(child as NavItem, depth);
    });
  };

  return (
    <aside
      className={`${
        collapsed ? "w-[68px]" : "w-[250px]"
      } bg-gradient-to-b from-blue-600 to-blue-900 border-r border-brand-500 flex flex-col transition-all duration-300 ease-in-out min-h-screen sticky top-0`}
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-brand-500">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="whitespace-nowrap">
              <div className="font-bold text-sm text-white">Net2App</div>
              <div className="text-[10px] text-white/60">V5 Billing</div>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {menuSections.map((item) => {
          if (isNavSection(item)) {
            const section = item as NavSection;
            const SecIcon = section.icon;
            const isExpanded = expandedSections.has(section.label);
            return (
              <div key={section.label}>
                {!collapsed ? (
                  <button
                    onClick={() => toggleSection(section.label)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <SecIcon className="w-[18px] h-[18px] flex-shrink-0" />
                    <span className="truncate flex-1 text-left">{section.label}</span>
                    <ChevronDown
                      className={`w-4 h-4 flex-shrink-0 transition-transform ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                ) : (
                  <div
                    className="flex items-center justify-center px-3 py-2 rounded-lg text-white/70"
                    title={section.label}
                  >
                    <SecIcon className="w-[18px] h-[18px] flex-shrink-0" />
                  </div>
                )}
                {isExpanded && renderChildren(section.children, 1)}
              </div>
            );
          }
          return renderItem(item as NavItem);
        })}
      </nav>

      {/* Version */}
      <VersionDisplay collapsed={collapsed} />

      {/* Collapse Toggle */}
      <div className="border-t border-brand-500 p-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-colors text-sm font-bold"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
