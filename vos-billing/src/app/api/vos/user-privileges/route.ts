import { NextRequest, NextResponse } from "next/server";
import { queryVos, executeVos } from "@/lib/vos-db";
import { verifySession } from "@/lib/auth";

export async function GET() {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const rows = await queryVos<any>(
      `SELECT p.id, p.name, p.privilege, p.classprivilege, p.memo, p.create_user_id, u.username AS creator_name
       FROM e_user_privilege p
       LEFT JOIN e_user u ON p.create_user_id = u.id
       ORDER BY p.name`
    );
    return NextResponse.json({
      privileges: (rows as any[]).map(r => ({
        id: Number(r.id), name: String(r.name || ""), privilege: Number(r.privilege) || 0,
        classPrivilege: String(r.classprivilege || ""), memo: String(r.memo || ""),
        createUserId: Number(r.create_user_id) || 0, creatorName: String(r.creator_name || ""),
      })),
    });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed", privileges: [] }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await request.json();
    const [maxRow] = await queryVos<any>("SELECT COALESCE(MAX(id),0)+1 AS next_id FROM e_user_privilege");
    const nextId = Number(maxRow?.next_id || 1);
    await executeVos(
      "INSERT INTO e_user_privilege (id, name, privilege, classprivilege, memo, create_user_id) VALUES (?,?,?,?,?,?)",
      [nextId, b.name || "", Number(b.privilege) || 0, b.classPrivilege || "", b.memo || "", user.id]);
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
      "UPDATE e_user_privilege SET name=?, privilege=?, classprivilege=?, memo=? WHERE id=?",
      [b.name || "", Number(b.privilege) || 0, b.classPrivilege || "", b.memo || "", Number(b.id)]);
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 }); }
}

export async function DELETE(request: NextRequest) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    await executeVos("DELETE FROM e_user_privilege WHERE id = ?", [Number(id)]);
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 }); }
}
