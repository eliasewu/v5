import { NextRequest, NextResponse } from "next/server";
import { queryVos, executeVos } from "@/lib/vos-db";
import { verifySession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const id = request.nextUrl.searchParams.get("id");
    let ivrs: any[] = [], languages: any[] = [];
    try { ivrs = await queryVos<any>("SELECT id, name FROM e_ivr ORDER BY id"); } catch {}
    try { languages = await queryVos<any>("SELECT id, directory FROM e_language ORDER BY id"); } catch {}
    if (id) {
      const svc = await queryVos<any>("SELECT * FROM e_ivrservice WHERE id = ?", [Number(id)]);
      if (svc.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
      const menus = await queryVos<any>("SELECT * FROM e_ivrservicemenu WHERE ivrservice_id = ? ORDER BY flowindex", [Number(id)]);
      const audio = await queryVos<any>("SELECT * FROM e_ivraudio WHERE ivrservice_id = ? ORDER BY id", [Number(id)]);
      return NextResponse.json({ service: svc[0], menus, audio, ivrs, languages });
    }
    const rows = await queryVos<any>(
      `SELECT s.*, (SELECT COUNT(*) FROM e_ivrservicemenu m WHERE m.ivrservice_id = s.id) AS menu_count,
              (SELECT COUNT(*) FROM e_ivraudio a WHERE a.ivrservice_id = s.id) AS audio_count
       FROM e_ivrservice s ORDER BY s.id`
    );
    return NextResponse.json({
      services: (rows as any[]).map(r => ({
        id: Number(r.id), name: String(r.name || ""), type: Number(r.type) || 0,
        ivr_id: Number(r.ivr_id) || 0, language_id: Number(r.language_id) || 0,
        memo: String(r.memo || ""), menu_count: Number(r.menu_count) || 0, audio_count: Number(r.audio_count) || 0,
        calloutcalleerewriterules: String(r.calloutcalleerewriterules || ""),
        bitsofconfig: Number(r.bitsofconfig) || 0,
      })),
      ivrs, languages,
    });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed", services: [] }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await request.json();
    if (!b.name) return NextResponse.json({ error: "Name required" }, { status: 400 });
    const [maxRow] = await queryVos<any>("SELECT COALESCE(MAX(id),0)+1 AS next_id FROM e_ivrservice");
    const nextId = Number(maxRow?.next_id || 1);
    await executeVos(
      "INSERT INTO e_ivrservice (id, name, type, ivr_id, language_id, memo, bitsofconfig) VALUES (?,?,?,?,?,?,?)",
      [nextId, String(b.name), Number(b.type) || 0, Number(b.ivr_id) || 0, Number(b.language_id) || 0, String(b.memo || ""), Number(b.bitsofconfig) || 0]
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
      "UPDATE e_ivrservice SET name=?, type=?, ivr_id=?, language_id=?, memo=?, bitsofconfig=? WHERE id=?",
      [String(b.name || ""), Number(b.type) || 0, Number(b.ivr_id) || 0, Number(b.language_id) || 0, String(b.memo || ""), Number(b.bitsofconfig) || 0, Number(b.id)]
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
    await executeVos("DELETE FROM e_ivrservicemenu WHERE ivrservice_id = ?", [Number(id)]);
    await executeVos("DELETE FROM e_ivraudio WHERE ivrservice_id = ?", [Number(id)]);
    await executeVos("DELETE FROM e_ivrservice WHERE id = ?", [Number(id)]);
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 }); }
}
