import { NextRequest, NextResponse } from "next/server";
import { queryVos, executeVos } from "@/lib/vos-db";
import { verifySession } from "@/lib/auth";

export async function GET() {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const rows = await queryVos<any>("SELECT * FROM e_cc_seat_group ORDER BY id");
    return NextResponse.json({
      groups: (rows as any[]).map(r => ({
        id: Number(r.id), name: String(r.name || ""), password: String(r.password || ""),
        capacity: Number(r.capacity) || 0, seatuplimit: Number(r.seatuplimit) || 0,
        record: Number(r.record) || 0, schedulingtype: Number(r.schedulingtype) || 0,
        accesse164s: String(r.accesse164s || ""), blackwhitelist: String(r.blackwhitelist || ""),
        welcome: String(r.welcome || ""), schedulingdelay: Number(r.schedulingdelay) || 0,
        memo: String(r.memo || ""), ivr_id: Number(r.ivr_id) || 0,
      })),
    });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed", groups: [] }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await request.json();
    if (!b.name) return NextResponse.json({ error: "Name required" }, { status: 400 });
    const [maxRow] = await queryVos<any>("SELECT COALESCE(MAX(id),0)+1 AS next_id FROM e_cc_seat_group");
    const nextId = Number(maxRow?.next_id || 1);
    await executeVos(
      "INSERT INTO e_cc_seat_group (id, name, password, capacity, seatuplimit, record, schedulingtype, accesse164s, blackwhitelist, welcome, schedulingdelay, memo, ivr_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
      [nextId, String(b.name), String(b.password || ""), Number(b.capacity) || 0, Number(b.seatuplimit) || 0,
       Number(b.record) || 0, Number(b.schedulingtype) || 0, String(b.accesse164s || ""), String(b.blackwhitelist || ""),
       String(b.welcome || ""), Number(b.schedulingdelay) || 0, String(b.memo || ""), Number(b.ivr_id) || 0]
    );
    return NextResponse.json({ success: true, id: nextId });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 }); }
}

export async function PUT(request: NextRequest) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await request.json();
    if (!b.id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    await executeVos(
      "UPDATE e_cc_seat_group SET name=?, password=?, capacity=?, seatuplimit=?, record=?, schedulingtype=?, accesse164s=?, blackwhitelist=?, welcome=?, schedulingdelay=?, memo=?, ivr_id=? WHERE id=?",
      [String(b.name || ""), String(b.password || ""), Number(b.capacity) || 0, Number(b.seatuplimit) || 0,
       Number(b.record) || 0, Number(b.schedulingtype) || 0, String(b.accesse164s || ""), String(b.blackwhitelist || ""),
       String(b.welcome || ""), Number(b.schedulingdelay) || 0, String(b.memo || ""), Number(b.ivr_id) || 0, Number(b.id)]
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
    await executeVos("DELETE FROM e_cc_seat_group WHERE id = ?", [Number(id)]);
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 }); }
}
