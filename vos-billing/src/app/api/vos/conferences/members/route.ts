import { NextRequest, NextResponse } from "next/server";
import { queryVos, executeVos } from "@/lib/vos-db";
import { verifySession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const roomId = request.nextUrl.searchParams.get("roomId");
    if (!roomId) return NextResponse.json({ error: "roomId required" }, { status: 400 });
    const rows = await queryVos<any>("SELECT * FROM e_conferencemember WHERE conferenceroom_id = ? ORDER BY id", [Number(roomId)]);
    return NextResponse.json({
      members: (rows as any[]).map(r => ({
        id: Number(r.id), e164: String(r.e164 || ""), type: Number(r.type) || 0,
        memo: String(r.memo || ""), conferenceroom_id: Number(r.conferenceroom_id) || 0,
      })),
    });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed", members: [] }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await request.json();
    if (!b.conferenceroom_id || !b.e164) return NextResponse.json({ error: "roomId and e164 required" }, { status: 400 });
    const [maxRow] = await queryVos<any>("SELECT COALESCE(MAX(id),0)+1 AS next_id FROM e_conferencemember");
    const nextId = Number(maxRow?.next_id || 1);
    await executeVos(
      "INSERT INTO e_conferencemember (id, e164, type, memo, conferenceroom_id) VALUES (?,?,?,?,?)",
      [nextId, String(b.e164), Number(b.type) || 0, String(b.memo || ""), Number(b.conferenceroom_id)]
    );
    return NextResponse.json({ success: true, id: nextId });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 }); }
}

export async function DELETE(request: NextRequest) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    await executeVos("DELETE FROM e_conferencemember WHERE id = ?", [Number(id)]);
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 }); }
}
