import { NextRequest, NextResponse } from "next/server";
import { queryVos, executeVos } from "@/lib/vos-db";
import { nextMitId } from "@/lib/mit-ids";
import { verifySession } from "@/lib/auth";

export async function GET() {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const rows = await queryVos<any>("SELECT * FROM e_cc_seat ORDER BY id");
    return NextResponse.json({
      seats: (rows as any[]).map(r => ({
        id: Number(r.id), e164: String(r.e164 || ""), level: Number(r.level) || 0,
        password: String(r.password || ""), jobid: String(r.jobid || ""), locktype: Number(r.locktype) || 0,
        status: Number(r.status) || 0, name: String(r.name || ""), priority: Number(r.priority) || 0,
        record: Number(r.record) || 0, memo: String(r.memo || ""),
        ivr_id: Number(r.ivr_id) || 0, cc_seat_privilege_id: Number(r.cc_seat_privilege_id) || 0,
        arealimit: String(r.arealimit || ""),
      })),
    });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed", seats: [] }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await request.json();
    if (!b.e164) return NextResponse.json({ error: "E164 required" }, { status: 400 });
    const nextId = await nextMitId();
    await executeVos(
      "INSERT INTO e_cc_seat (id, e164, level, password, jobid, locktype, status, arealimit, name, priority, record, memo, ivr_id, cc_seat_privilege_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      [nextId, String(b.e164), Number(b.level) || 0, String(b.password || ""), String(b.jobid || ""), Number(b.locktype) || 0,
       Number(b.status) || 0, String(b.arealimit || ""), String(b.name || ""), Number(b.priority) || 0, Number(b.record) || 0,
       String(b.memo || ""), Number(b.ivr_id) || 0, Number(b.cc_seat_privilege_id) || 0]
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
      "UPDATE e_cc_seat SET e164=?, level=?, password=?, jobid=?, locktype=?, status=?, arealimit=?, name=?, priority=?, record=?, memo=?, ivr_id=?, cc_seat_privilege_id=? WHERE id=?",
      [String(b.e164 || ""), Number(b.level) || 0, String(b.password || ""), String(b.jobid || ""), Number(b.locktype) || 0,
       Number(b.status) || 0, String(b.arealimit || ""), String(b.name || ""), Number(b.priority) || 0, Number(b.record) || 0,
       String(b.memo || ""), Number(b.ivr_id) || 0, Number(b.cc_seat_privilege_id) || 0, Number(b.id)]
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
    await executeVos("DELETE FROM e_cc_seat WHERE id = ?", [Number(id)]);
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 }); }
}
