import { NextRequest, NextResponse } from "next/server";
import { queryVos, executeVos } from "@/lib/vos-db";
import { verifySession } from "@/lib/auth";

// VOS3000 alarm type mapping (based on e_alarm_setting.type values)
const TYPE_LABELS: Record<number, string> = {
  20001: "Network Alarm", 20002: "Disk Alarm", 20003: "Process Alarm", 20004: "Mapping Alarm",
  20005: "Routing Alarm", 20006: "Balance Alarm", 20040: "External Device Alarm",
};
const LEVEL_LABELS: Record<number, string> = { 1: "Info", 2: "Warning", 3: "Critical" };

export async function GET() {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const rows = await queryVos<any>("SELECT * FROM e_alarm_setting ORDER BY id");
    return NextResponse.json({
      settings: (rows as any[]).map(r => ({
        id: Number(r.id), moId: Number(r.moid) || 0, moType: Number(r.motype) || 0,
        startTime: Number(r.starttime) || 0, stopTime: Number(r.stoptime) || 0,
        type: Number(r.type) || 0, typeLabel: TYPE_LABELS[Number(r.type)] || `Type ${r.type}`,
        level: Number(r.level) || 0, levelLabel: LEVEL_LABELS[Number(r.level)] || `Level ${r.level}`,
        upper: Number(r.upper) || 0, lower: Number(r.lower) || 0, period: Number(r.period) || 0,
        enableVoice: Number(r.enablevoice) || 0, e164s: String(r.e164s || ""),
        enableEmail: Number(r.enableemail) || 0, email: String(r.email || ""),
      })),
    });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed", settings: [] }, { status: 500 }); }
}

export async function PUT(request: NextRequest) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await request.json();
    if (!b.id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    await executeVos(
      `UPDATE e_alarm_setting SET upper=?, lower=?, period=?, level=?, enablevoice=?, e164s=?, enableemail=?, email=? WHERE id=?`,
      [
        Number(b.upper) || 0, Number(b.lower) || 0, Number(b.period) || -1, Number(b.level) || 2,
        Number(b.enableVoice) || 0, b.e164s || "", Number(b.enableEmail) || 0, b.email || "",
        Number(b.id),
      ]);
    return NextResponse.json({ success: true });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed" }, { status: 500 }); }
}
