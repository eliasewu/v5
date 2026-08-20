import { NextRequest, NextResponse } from "next/server";
import { queryVos, executeVos } from "@/lib/vos-db";
import { verifySession } from "@/lib/auth";

export async function GET() {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const rows = await queryVos<any>("SELECT * FROM e_citycode ORDER BY citycode");
    return NextResponse.json({
      codes: (rows as any[]).map(r => ({
        id: Number(r.id), citycode: String(r.citycode || ""), province: String(r.province || ""),
        city: String(r.city || ""), callere164length: Number(r.callere164length) || 0,
        calleee164length: Number(r.calleee164length) || 0, location: String(r.location || ""),
      })),
    });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed", codes: [] }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await request.json();
    const [maxRow] = await queryVos<any>("SELECT COALESCE(MAX(id),0)+1 AS next_id FROM e_citycode");
    const nextId = Number(maxRow?.next_id || 1);
    await executeVos(
      "INSERT INTO e_citycode (id, citycode, province, city, callere164length, calleee164length, location) VALUES (?,?,?,?,?,?,?)",
      [nextId, b.citycode || "", b.province || "", b.city || "", Number(b.callere164length) || 0, Number(b.calleee164length) || 0, b.location || ""]);
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
      "UPDATE e_citycode SET citycode=?, province=?, city=?, callere164length=?, calleee164length=?, location=? WHERE id=?",
      [b.citycode || "", b.province || "", b.city || "", Number(b.callere164length) || 0, Number(b.calleee164length) || 0, b.location || "", Number(b.id)]);
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 }); }
}

export async function DELETE(request: NextRequest) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    await executeVos("DELETE FROM e_citycode WHERE id = ?", [Number(id)]);
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 }); }
}
