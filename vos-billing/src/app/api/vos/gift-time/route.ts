import { NextRequest, NextResponse } from "next/server";
import { queryVos, executeVos } from "@/lib/vos-db";
import { nextMitId } from "@/lib/mit-ids";
import { verifySession } from "@/lib/auth";

export async function GET() {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const rows = await queryVos<any>(
      `SELECT g.*, s.name AS suite_name FROM e_gifttime g
       LEFT JOIN e_suite s ON s.id = g.suite_id ORDER BY g.id`
    );
    return NextResponse.json({
      rules: (rows as any[]).map(r => ({
        id: Number(r.id), prefix: String(r.prefix || ""),
        starttime: Number(r.starttime) || 0, endtime: Number(r.endtime) || 0,
        gifttime: Number(r.gifttime) || 0, billingtime: Number(r.billingtime) || 0,
        memo: String(r.memo || ""), suite_id: Number(r.suite_id) || 0,
        suite_name: String(r.suite_name || ""),
      })),
    });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed", rules: [] }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await request.json();
    if (!b.prefix) return NextResponse.json({ error: "Prefix required" }, { status: 400 });
    const id = await nextMitId();
    await executeVos(
      "INSERT INTO e_gifttime (id, prefix, starttime, endtime, gifttime, billingtime, memo, suite_id) VALUES (?,?,?,?,?,?,?,?)",
      [id, String(b.prefix), Number(b.starttime) || 0, Number(b.endtime) || 0,
       Number(b.gifttime) || 0, Number(b.billingtime) || 0, String(b.memo || ""), Number(b.suite_id) || 0]
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
      "UPDATE e_gifttime SET prefix=?, starttime=?, endtime=?, gifttime=?, billingtime=?, memo=?, suite_id=? WHERE id=?",
      [String(b.prefix || ""), Number(b.starttime) || 0, Number(b.endtime) || 0,
       Number(b.gifttime) || 0, Number(b.billingtime) || 0, String(b.memo || ""), Number(b.suite_id) || 0, Number(b.id)]
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
    await executeVos("DELETE FROM e_gifttime WHERE id = ?", [Number(id)]);
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 }); }
}
