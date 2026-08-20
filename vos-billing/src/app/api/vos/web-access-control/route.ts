import { NextRequest, NextResponse } from "next/server";
import { queryVos, executeVos } from "@/lib/vos-db";
import { verifySession } from "@/lib/auth";

export async function GET() {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const rows = await queryVos<any>(
      `SELECT w.id, w.path, w.allowip, w.memo, w.equipment_id, e.name AS equipment_name
       FROM e_web_access_control w
       LEFT JOIN e_equipment e ON w.equipment_id = e.id
       ORDER BY w.id`
    );
    return NextResponse.json({
      rules: (rows as any[]).map(r => ({
        id: Number(r.id), path: String(r.path || ""), allowIp: String(r.allowip || ""),
        memo: String(r.memo || ""), equipmentId: Number(r.equipment_id) || 0,
        equipmentName: String(r.equipment_name || ""),
      })),
    });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed", rules: [] }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await request.json();
    const [maxRow] = await queryVos<any>("SELECT COALESCE(MAX(id),0)+1 AS next_id FROM e_web_access_control");
    const nextId = Number(maxRow?.next_id || 1);
    await executeVos(
      "INSERT INTO e_web_access_control (id, path, allowip, memo, equipment_id) VALUES (?,?,?,?,?)",
      [nextId, b.path || "", b.allowIp || "", b.memo || "", Number(b.equipmentId) || 0]);
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
      "UPDATE e_web_access_control SET path=?, allowip=?, memo=?, equipment_id=? WHERE id=?",
      [b.path || "", b.allowIp || "", b.memo || "", Number(b.equipmentId) || 0, Number(b.id)]);
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 }); }
}

export async function DELETE(request: NextRequest) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    await executeVos("DELETE FROM e_web_access_control WHERE id = ?", [Number(id)]);
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 }); }
}
