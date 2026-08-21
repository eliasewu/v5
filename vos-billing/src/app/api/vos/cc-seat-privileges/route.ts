import { NextRequest, NextResponse } from "next/server";
import { queryVos, executeVos } from "@/lib/vos-db";
import { nextMitId } from "@/lib/mit-ids";
import { verifySession } from "@/lib/auth";

export async function GET() {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const rows = await queryVos<any>("SELECT * FROM e_cc_seat_privilege ORDER BY id");
    return NextResponse.json({
      templates: (rows as any[]).map(r => ({
        id: Number(r.id), name: String(r.name || ""),
        privilege: String(r.privilege || ""), memo: String(r.memo || ""),
      })),
    });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed", templates: [] }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await request.json();
    if (!b.name) return NextResponse.json({ error: "Name required" }, { status: 400 });
    const id = await nextMitId();
    await executeVos(
      "INSERT INTO e_cc_seat_privilege (id, name, privilege, memo) VALUES (?,?,?,?)",
      [id, String(b.name), String(b.privilege || ""), String(b.memo || "")]
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
      "UPDATE e_cc_seat_privilege SET name=?, privilege=?, memo=? WHERE id=?",
      [String(b.name || ""), String(b.privilege || ""), String(b.memo || ""), Number(b.id)]
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
    await executeVos("DELETE FROM e_cc_seat_privilege WHERE id = ?", [Number(id)]);
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 }); }
}
