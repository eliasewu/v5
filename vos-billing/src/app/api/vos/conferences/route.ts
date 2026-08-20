import { NextRequest, NextResponse } from "next/server";
import { queryVos, executeVos } from "@/lib/vos-db";
import { verifySession } from "@/lib/auth";

export async function GET() {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const rows = await queryVos<any>(
      `SELECT r.*, c.name AS customer_name,
              (SELECT COUNT(*) FROM e_conferencemember m WHERE m.conferenceroom_id = r.id) AS member_count
       FROM e_conferenceroom r LEFT JOIN e_customer c ON r.customer_id = c.id ORDER BY r.id`
    );
    return NextResponse.json({
      rooms: (rows as any[]).map(r => ({
        id: Number(r.id), name: String(r.name || ""), password: String(r.password || ""),
        customerpassword: String(r.customerpassword || ""), capacity: Number(r.capacity) || 0,
        record: Number(r.record) || 0, memo: String(r.memo || ""),
        customer_id: Number(r.customer_id) || 0, customer_name: String(r.customer_name || ""),
        ivrservice_id: Number(r.ivrservice_id) || 0, ivr_id: Number(r.ivr_id) || 0,
        member_count: Number(r.member_count) || 0,
      })),
    });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed", rooms: [] }, { status: 500 }); }
}

export async function POST(request: NextRequest) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await request.json();
    if (!b.name) return NextResponse.json({ error: "Name required" }, { status: 400 });
    const [maxRow] = await queryVos<any>("SELECT COALESCE(MAX(id),0)+1 AS next_id FROM e_conferenceroom");
    const nextId = Number(maxRow?.next_id || 1);
    await executeVos(
      "INSERT INTO e_conferenceroom (id, name, password, customerpassword, capacity, record, memo, customer_id, ivrservice_id, ivr_id) VALUES (?,?,?,?,?,?,?,?,?,?)",
      [nextId, String(b.name), String(b.password || ""), String(b.customerpassword || ""), Number(b.capacity) || 0,
       Number(b.record) || 0, String(b.memo || ""), Number(b.customer_id) || 0, Number(b.ivrservice_id) || 0, Number(b.ivr_id) || 0]
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
      "UPDATE e_conferenceroom SET name=?, password=?, customerpassword=?, capacity=?, record=?, memo=?, customer_id=?, ivrservice_id=?, ivr_id=? WHERE id=?",
      [String(b.name || ""), String(b.password || ""), String(b.customerpassword || ""), Number(b.capacity) || 0,
       Number(b.record) || 0, String(b.memo || ""), Number(b.customer_id) || 0, Number(b.ivrservice_id) || 0, Number(b.ivr_id) || 0, Number(b.id)]
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
    await executeVos("DELETE FROM e_conferencemember WHERE conferenceroom_id = ?", [Number(id)]);
    await executeVos("DELETE FROM e_conferenceroom WHERE id = ?", [Number(id)]);
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 }); }
}
