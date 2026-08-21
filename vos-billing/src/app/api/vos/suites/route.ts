import { NextRequest, NextResponse } from "next/server";
import { queryVos, executeVos } from "@/lib/vos-db";
import { nextMitId } from "@/lib/mit-ids";
import { verifySession } from "@/lib/auth";

const RENT_TYPE_LABELS: Record<number, string> = {
  0: "Month", 1: "Week", 2: "Day", 3: "Hour",
};

export async function GET() {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const rows = await queryVos<any>("SELECT * FROM e_suite ORDER BY id");
    return NextResponse.json({
      suites: (rows as any[]).map(r => ({
        id: Number(r.id), name: String(r.name || ""),
        rentperiod: Number(r.rentperiod) || 0, renttype: Number(r.renttype) || 0,
        nonholonomicorder: Number(r.nonholonomicorder) || 0,
        rentfee: Number(r.rentfee) || 0, minconsumption: Number(r.minconsumption) || 0,
        lowerconsumption: Number(r.lowerconsumption) || 0, giftmoney: Number(r.giftmoney) || 0,
        memo: String(r.memo || ""), user_id: Number(r.user_id) || 0,
        renttype_label: RENT_TYPE_LABELS[Number(r.renttype)] || `Type ${r.renttype}`,
      })),
    });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed", suites: [] }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await request.json();
    if (!b.name) return NextResponse.json({ error: "Name required" }, { status: 400 });
    const id = await nextMitId();
    await executeVos(
      `INSERT INTO e_suite (id, name, rentperiod, renttype, nonholonomicorder, rentfee,
        minconsumption, lowerconsumption, giftmoney, memo, user_id) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [id, String(b.name), Number(b.rentperiod) || 0, Number(b.renttype) || 0,
       Number(b.nonholonomicorder) || 0, Number(b.rentfee) || 0, Number(b.minconsumption) || 0,
       Number(b.lowerconsumption) || 0, Number(b.giftmoney) || 0, String(b.memo || ""), Number(b.user_id) || 0]
    );
    return NextResponse.json({ success: true, id });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 }); }
}

export async function PUT(request: NextRequest) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await request.json();
    if (!b.id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    await executeVos(
      `UPDATE e_suite SET name=?, rentperiod=?, renttype=?, nonholonomicorder=?, rentfee=?,
        minconsumption=?, lowerconsumption=?, giftmoney=?, memo=?, user_id=? WHERE id=?`,
      [String(b.name || ""), Number(b.rentperiod) || 0, Number(b.renttype) || 0,
       Number(b.nonholonomicorder) || 0, Number(b.rentfee) || 0, Number(b.minconsumption) || 0,
       Number(b.lowerconsumption) || 0, Number(b.giftmoney) || 0, String(b.memo || ""), Number(b.user_id) || 0,
       Number(b.id)]
    );
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 }); }
}

export async function DELETE(request: NextRequest) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    await executeVos("DELETE FROM e_suite WHERE id = ?", [Number(id)]);
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 }); }
}
