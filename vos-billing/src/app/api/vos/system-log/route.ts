import { NextRequest, NextResponse } from "next/server";
import { queryVos } from "@/lib/vos-db";
import { verifySession } from "@/lib/auth";

const TYPE_LABELS: Record<number, string> = {
  0: "Info", 1: "Config", 2: "Warning", 3: "Error", 4: "Security", 5: "Debug",
};

export async function GET(request: NextRequest) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "500"), 2000);

    let where = "";
    const params: (string | number)[] = [];
    if (search) { where = " WHERE event LIKE ? OR source LIKE ? OR memo LIKE ?"; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    params.push(limit);

    const rows = await queryVos<any>(
      `SELECT * FROM e_syslog ${where} ORDER BY time DESC LIMIT ?`, params
    );
    return NextResponse.json({
      logs: (rows as any[]).map(r => ({
        id: Number(r.id), type: Number(r.type) || 0, typeLabel: TYPE_LABELS[Number(r.type)] || `Type ${r.type}`,
        time: Number(r.time) || 0, source: String(r.source || ""), event: String(r.event || ""),
        format: String(r.format || ""), memo: String(r.memo || ""),
        infoOld: String(r.infoold || ""), infoNew: String(r.infonew || ""),
      })),
    });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed", logs: [] }, { status: 500 }); }
}
