import { NextRequest, NextResponse } from "next/server";
import { queryVos, executeVos } from "@/lib/vos-db";
import { verifySession } from "@/lib/auth";
import { nextMitId } from "@/lib/mit-ids";

function fmtDt(v: unknown): string {
  if (!v) return "";
  if (v instanceof Date) return v.toISOString().replace("T", " ").slice(0, 19);
  return String(v);
}

export async function GET() {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const rows = await queryVos<any>("SELECT id, name, vosname, configserialid, DATE_FORMAT(createtime,'%Y-%m-%d %H:%i:%s') AS createtime, DATE_FORMAT(accesstime,'%Y-%m-%d %H:%i:%s') AS accesstime, accessip, configips, parameter, socketid, memo FROM e_mbx ORDER BY id");
    return NextResponse.json({
      mailboxes: (rows as any[]).map(r => ({
        id: Number(r.id), name: String(r.name || ""), vosname: String(r.vosname || ""),
        configserialid: Number(r.configserialid) || 0,
        createtime: fmtDt(r.createtime),
        accesstime: fmtDt(r.accesstime),
        accessip: String(r.accessip || ""), configips: String(r.configips || ""),
        parameter: String(r.parameter || ""), socketid: Number(r.socketid) || 0,
        memo: String(r.memo || ""),
      })),
    });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed", mailboxes: [] }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await request.json();
    if (!b.name) return NextResponse.json({ error: "Name required" }, { status: 400 });
    // e_mbx.id is an MIT node id — allocate a globally-unique id.
    const nextId = await nextMitId();
    await executeVos(
      "INSERT INTO e_mbx (id, name, vosname, configserialid, accessip, configips, parameter, socketid, memo) VALUES (?,?,?,?,?,?,?,?,?)",
      [nextId, String(b.name), String(b.vosname || ""), Number(b.configserialid) || 0, String(b.accessip || ""),
       String(b.configips || ""), String(b.parameter || ""), Number(b.socketid) || 0, String(b.memo || "")]
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
      "UPDATE e_mbx SET name=?, vosname=?, configserialid=?, accessip=?, configips=?, parameter=?, socketid=?, memo=? WHERE id=?",
      [String(b.name || ""), String(b.vosname || ""), Number(b.configserialid) || 0, String(b.accessip || ""),
       String(b.configips || ""), String(b.parameter || ""), Number(b.socketid) || 0, String(b.memo || ""), Number(b.id)]
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
    await executeVos("DELETE FROM e_mbx WHERE id = ?", [Number(id)]);
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 }); }
}
