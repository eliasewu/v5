import { NextRequest, NextResponse } from "next/server";
import { queryVos, executeVos } from "@/lib/vos-db";
import { verifySession } from "@/lib/auth";

const TYPE_LABELS: Record<number, string> = {
  1: "Alarm History", 2: "CDR", 3: "Consumption", 4: "Payment History",
  5: "System Log", 6: "Conference Record", 7: "AXB CDR", 8: "Report Data",
};

export async function GET() {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const rows = await queryVos<any>("SELECT * FROM e_autoclean ORDER BY id");
    return NextResponse.json({
      rules: (rows as any[]).map(r => ({
        id: Number(r.id), type: Number(r.type) || 0, enabled: Number(r.enabled) || 0,
        content: Number(r.content) || 0, expiredays: Number(r.expiredays) || 0,
        type_label: TYPE_LABELS[Number(r.type)] || `Type ${r.type}`,
      })),
    });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed", rules: [] }, { status: 500 }); }
}

export async function PUT(request: NextRequest) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await request.json();
    if (!b.id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    await executeVos(
      "UPDATE e_autoclean SET enabled=?, content=?, expiredays=? WHERE id=?",
      [Number(b.enabled) || 0, Number(b.content) || 0, Number(b.expiredays) || 0, Number(b.id)]
    );
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 }); }
}
