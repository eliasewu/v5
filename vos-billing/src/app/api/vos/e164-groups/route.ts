import { NextRequest, NextResponse } from "next/server";
import { queryVos, executeVos } from "@/lib/vos-db";
import { verifySession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const rows = await queryVos<any>("SELECT * FROM e_groupe164 ORDER BY id");
    return NextResponse.json({
      groups: (rows as any[]).map(r => ({
        id: Number(r.id), routinggatewaycalleee164: String(r.routinggatewaycalleee164 || ""),
        phonee164: String(r.phonee164 || ""), mappinggatewaycallere164: String(r.mappinggatewaycallere164 || ""),
        memo: String(r.memo || ""),
      })),
    });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed", groups: [] }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await request.json();
    if (!b.phonee164 && !b.routinggatewaycalleee164) return NextResponse.json({ error: "At least one E164 required" }, { status: 400 });
    const [maxRow] = await queryVos<any>("SELECT COALESCE(MAX(id),0)+1 AS next_id FROM e_groupe164");
    const nextId = Number(maxRow?.next_id || 1);
    await executeVos(
      "INSERT INTO e_groupe164 (id, routinggatewaycalleee164, phonee164, mappinggatewaycallere164, memo) VALUES (?,?,?,?,?)",
      [nextId, String(b.routinggatewaycalleee164 || ""), String(b.phonee164 || ""), String(b.mappinggatewaycallere164 || ""), String(b.memo || "")]
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
      "UPDATE e_groupe164 SET routinggatewaycalleee164=?, phonee164=?, mappinggatewaycallere164=?, memo=? WHERE id=?",
      [String(b.routinggatewaycalleee164 || ""), String(b.phonee164 || ""), String(b.mappinggatewaycallere164 || ""), String(b.memo || ""), Number(b.id)]
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
    await executeVos("DELETE FROM e_groupe164 WHERE id = ?", [Number(id)]);
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 }); }
}
