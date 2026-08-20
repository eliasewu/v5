import { NextRequest, NextResponse } from "next/server";
import { queryVos, executeVos } from "@/lib/vos-db";
import { verifySession } from "@/lib/auth";
import { nextMitId } from "@/lib/mit-ids";

export async function GET() {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const rows = await queryVos<any>("SELECT * FROM e_dns ORDER BY domain");
    return NextResponse.json({
      domains: (rows as any[]).map(r => ({
        id: Number(r.id), domain: String(r.domain || ""), ip: String(r.ip || ""),
        type: Number(r.type) || 0, updateTime: r.updatetime ? new Date(r.updatetime).toISOString() : "",
        memo: String(r.memo || ""),
      })),
    });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed", domains: [] }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await request.json();
    // e_dns.id is an MIT node id — allocate a globally-unique id.
    const nextId = await nextMitId();
    await executeVos(
      "INSERT INTO e_dns (id, domain, ip, type, memo) VALUES (?,?,?,?,?)",
      [nextId, b.domain || "", b.ip || "", Number(b.type) || 0, b.memo || ""]);
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
      "UPDATE e_dns SET domain=?, ip=?, type=?, memo=? WHERE id=?",
      [b.domain || "", b.ip || "", Number(b.type) || 0, b.memo || "", Number(b.id)]);
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 }); }
}

export async function DELETE(request: NextRequest) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    await executeVos("DELETE FROM e_dns WHERE id = ?", [Number(id)]);
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 }); }
}
