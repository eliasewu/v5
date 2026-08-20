import { NextRequest, NextResponse } from "next/server";
import { queryVos, executeVos } from "@/lib/vos-db";
import { verifySession } from "@/lib/auth";
import { nextMitId } from "@/lib/mit-ids";

export async function GET() {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    // Cap to the most recent 2000 areas — table can exceed 100k rows
    const rows = await queryVos<any>("SELECT * FROM e_areacode ORDER BY location LIMIT 2000");
    return NextResponse.json({
      areas: (rows as any[]).map(r => ({
        id: Number(r.id), areacode: String(r.areacode || ""), location: String(r.location || ""),
        memo: String(r.memo || ""), initialBilling: Number(r.initial_billing) || 0,
        incrementalBilling: Number(r.incremental_billing) || 0,
      })),
    });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed", areas: [] }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await request.json();
    // e_areacode.id is an MIT node id — allocate a globally-unique id.
    const nextId = await nextMitId();
    await executeVos(
      "INSERT INTO e_areacode (id, areacode, location, memo, initial_billing, incremental_billing) VALUES (?,?,?,?,?,?)",
      [nextId, b.areacode || "", b.location || "", b.memo || "", Number(b.initialBilling) || 0, Number(b.incrementalBilling) || 0]);
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
      "UPDATE e_areacode SET areacode=?, location=?, memo=?, initial_billing=?, incremental_billing=? WHERE id=?",
      [b.areacode || "", b.location || "", b.memo || "", Number(b.initialBilling) || 0, Number(b.incrementalBilling) || 0, Number(b.id)]);
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 }); }
}

export async function DELETE(request: NextRequest) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    await executeVos("DELETE FROM e_areacode WHERE id = ?", [Number(id)]);
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 }); }
}
