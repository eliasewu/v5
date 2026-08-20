import { NextRequest, NextResponse } from "next/server";
import { queryVos, executeVos } from "@/lib/vos-db";
import { verifySession } from "@/lib/auth";

export async function GET() {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const rows = await queryVos<any>("SELECT * FROM e_phoneservice ORDER BY id");
    return NextResponse.json({
      services: (rows as any[]).map(r => ({
        id: Number(r.id), name: String(r.name || ""), vosname: String(r.vosname || ""),
        configserialid: Number(r.configserialid) || 0, createtime: Number(r.createtime) || 0,
        accesstime: Number(r.accesstime) || 0, accessip: String(r.accessip || ""),
        socketid: Number(r.socketid) || 0, memo: String(r.memo || ""),
      })),
    });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed", services: [] }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await request.json();
    if (!b.name) return NextResponse.json({ error: "Name required" }, { status: 400 });
    const [maxRow] = await queryVos<any>("SELECT COALESCE(MAX(id),0)+1 AS next_id FROM e_phoneservice");
    const nextId = Number(maxRow?.next_id || 1);
    await executeVos(
      "INSERT INTO e_phoneservice (id, name, vosname, configserialid, accessip, socketid, memo) VALUES (?,?,?,?,?,?,?)",
      [nextId, String(b.name), String(b.vosname || ""), Number(b.configserialid) || 0, String(b.accessip || ""), Number(b.socketid) || 0, String(b.memo || "")]
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
      "UPDATE e_phoneservice SET name=?, vosname=?, configserialid=?, accessip=?, socketid=?, memo=? WHERE id=?",
      [String(b.name || ""), String(b.vosname || ""), Number(b.configserialid) || 0, String(b.accessip || ""), Number(b.socketid) || 0, String(b.memo || ""), Number(b.id)]
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
    await executeVos("DELETE FROM e_phoneservice WHERE id = ?", [Number(id)]);
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 }); }
}
