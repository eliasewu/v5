import { NextRequest, NextResponse } from "next/server";
import { queryVos, executeVos } from "@/lib/vos-db";
import { verifySession } from "@/lib/auth";

export async function GET() {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const groups = await queryVos<any>(
      `SELECT g.id, g.name, g.memo, COUNT(m.id) AS e164_count
       FROM e_limit_e164_group g
       LEFT JOIN e_limit_e164 m ON m.limit_e164_group_id = g.id
       GROUP BY g.id, g.name, g.memo ORDER BY g.name`
    );
    const members = await queryVos<any>("SELECT id, e164, memo, limit_e164_group_id FROM e_limit_e164 ORDER BY e164");
    return NextResponse.json({
      groups: (groups as any[]).map(g => ({
        id: Number(g.id), name: String(g.name || ""), memo: String(g.memo || ""),
        e164Count: Number(g.e164_count) || 0,
      })),
      members: (members as any[]).map(m => ({
        id: Number(m.id), e164: String(m.e164 || ""), memo: String(m.memo || ""),
        groupId: Number(m.limit_e164_group_id) || 0,
      })),
    });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed", groups: [], members: [] }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await request.json();
    if (b.e164 !== undefined) {
      // Add member to a group
      if (!b.groupId) return NextResponse.json({ error: "Group ID required" }, { status: 400 });
      const [maxRow] = await queryVos<any>("SELECT COALESCE(MAX(id),0)+1 AS next_id FROM e_limit_e164");
      const nextId = Number(maxRow?.next_id || 1);
      await executeVos("INSERT INTO e_limit_e164 (id, e164, memo, limit_e164_group_id) VALUES (?,?,?,?)",
        [nextId, b.e164 || "", b.memo || "", Number(b.groupId)]);
      return NextResponse.json({ success: true, id: nextId });
    }
    // Create group
    const [maxRow] = await queryVos<any>("SELECT COALESCE(MAX(id),0)+1 AS next_id FROM e_limit_e164_group");
    const nextId = Number(maxRow?.next_id || 1);
    await executeVos("INSERT INTO e_limit_e164_group (id, name, memo) VALUES (?,?,?)",
      [nextId, b.name || "", b.memo || ""]);
    return NextResponse.json({ success: true, id: nextId });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 }); }
}

export async function PUT(request: NextRequest) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await request.json();
    if (!b.id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    if (b.e164 !== undefined) {
      await executeVos("UPDATE e_limit_e164 SET e164=?, memo=?, limit_e164_group_id=? WHERE id=?",
        [b.e164 || "", b.memo || "", Number(b.groupId) || 0, Number(b.id)]);
    } else {
      await executeVos("UPDATE e_limit_e164_group SET name=?, memo=? WHERE id=?",
        [b.name || "", b.memo || "", Number(b.id)]);
    }
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 }); }
}

export async function DELETE(request: NextRequest) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const id = request.nextUrl.searchParams.get("id");
    const type = request.nextUrl.searchParams.get("type") || "member";
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    if (type === "group") {
      await executeVos("DELETE FROM e_limit_e164_group WHERE id = ?", [Number(id)]);
      await executeVos("DELETE FROM e_limit_e164 WHERE limit_e164_group_id = ?", [Number(id)]);
    } else {
      await executeVos("DELETE FROM e_limit_e164 WHERE id = ?", [Number(id)]);
    }
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 }); }
}
