import { NextResponse } from "next/server";
import { queryVos } from "@/lib/vos-db";
import { verifySession } from "@/lib/auth";

const NEVER = 9000000000000000000; // 9223372036854775807 sentinel = never expires

function fmtEpoch(sec: number | null | undefined): string | null {
  if (!sec || sec <= 0) return null;
  if (sec >= NEVER) return "Never";
  const d = new Date(Number(sec) * 1000);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().replace("T", " ").slice(0, 19);
}

const RENT_TYPE_LABELS: Record<number, string> = {
  0: "Month", 1: "Week", 2: "Day", 3: "Hour",
};

export async function GET() {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const [current, orders] = await Promise.all([
      queryVos<any>(
        `SELECT cs.*, c.name AS customer_name, c.account AS customer_account
         FROM e_currentsuite cs
         LEFT JOIN e_customer c ON cs.customer_id = c.id
         ORDER BY cs.customer_id, cs.id`
      ),
      queryVos<any>(
        `SELECT so.*, c.name AS customer_name, c.account AS customer_account, s.name AS suite_name
         FROM e_suiteorder so
         LEFT JOIN e_customer c ON so.customer_id = c.id
         LEFT JOIN e_suite s ON so.suite_id = s.id
         ORDER BY so.customer_id, so.priority, so.id`
      ),
    ]);
    return NextResponse.json({
      current: (current as any[]).map(r => ({
        id: Number(r.id), name: String(r.name || ""),
        rentperiod: Number(r.rentperiod) || 0,
        renttype: Number(r.renttype) || 0,
        renttype_label: RENT_TYPE_LABELS[Number(r.renttype)] || `Type ${r.renttype}`,
        availabletime: fmtEpoch(r.availabletime),
        expiretime: fmtEpoch(r.expiretime),
        currentconsumption: Number(r.currentconsumption) || 0,
        minconsumption: Number(r.minconsumption) || 0,
        lowerconsumption: Number(r.lowerconsumption) || 0,
        giftmoney: Number(r.giftmoney) || 0,
        suiteoderid: Number(r.suiteoderid) || 0,
        suiteid: Number(r.suiteid) || 0,
        customer_id: Number(r.customer_id) || 0,
        customer_name: String(r.customer_name || ""),
        customer_account: String(r.customer_account || ""),
      })),
      orders: (orders as any[]).map(r => ({
        id: Number(r.id),
        availabletime: fmtEpoch(r.availabletime),
        expiretime: fmtEpoch(r.expiretime),
        priority: Number(r.priority) || 0,
        failedprocessmode: Number(r.failedprocessmode) || 0,
        rentpercent: Number(r.rentpercent) || 0,
        memo: String(r.memo || ""),
        suite_id: Number(r.suite_id) || 0,
        suite_name: String(r.suite_name || ""),
        customer_id: Number(r.customer_id) || 0,
        customer_name: String(r.customer_name || ""),
        customer_account: String(r.customer_account || ""),
      })),
    });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed", current: [], orders: [] }, { status: 500 }); }
}
