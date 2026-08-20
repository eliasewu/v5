import { NextRequest, NextResponse } from "next/server";
import { queryVos } from "@/lib/vos-db";
import { verifySession } from "@/lib/auth";

const LEVEL_LABELS: Record<number, string> = { 1: "Info", 2: "Warning", 3: "Critical" };

export async function GET(request: NextRequest) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const level = searchParams.get("level") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "500"), 2000);

    let where = "";
    const params: (string | number)[] = [];
    if (search) { where = " WHERE name LIKE ?"; params.push(`%${search}%`); }
    if (level) {
      where += where ? " AND level = ?" : " WHERE level = ?";
      params.push(parseInt(level));
    }
    params.push(limit);

    const rows = await queryVos<any>(
      `SELECT * FROM e_alarm_history ${where} ORDER BY starttime DESC LIMIT ?`, params
    );
    return NextResponse.json({
      alarms: (rows as any[]).map(r => ({
        id: Number(r.id), moId: Number(r.moid) || 0, moType: Number(r.motype) || 0,
        name: String(r.name || ""), type: Number(r.type) || 0, level: Number(r.level) || 0,
        levelLabel: LEVEL_LABELS[Number(r.level)] || `Level ${r.level}`,
        startTime: Number(r.starttime) || 0, stopTime: Number(r.stoptime) || 0,
        value: Number(r.value) || 0, upper: Number(r.upper) || 0, lower: Number(r.lower) || 0,
        confirmUser: String(r.confirmuser || ""), confirmTime: Number(r.confirmtime) || 0,
        confirmMemo: String(r.confirmmemo || ""), clearUser: String(r.clearuser || ""),
        clearTime: Number(r.cleartime) || 0,
      })),
    });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed", alarms: [] }, { status: 500 }); }
}
