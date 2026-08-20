import { NextResponse } from "next/server";
import { queryVos } from "@/lib/vos-db";
import { verifySession } from "@/lib/auth";

const CATEGORY_LABELS: Record<number, string> = {
  1: "Core Switch", 2: "Softswitch", 3: "Web Server", 4: "Media Record", 5: "Web Server", 6: "Database",
};

export async function GET() {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const rows = await queryVos<any>("SELECT * FROM e_equipment ORDER BY id");
    return NextResponse.json({
      equipment: (rows as any[]).map(r => ({
        id: Number(r.id), category: Number(r.catagory) || 0, categoryLabel: CATEGORY_LABELS[Number(r.catagory)] || "Unknown",
        type: Number(r.type) || 0, name: String(r.name || ""), vosName: String(r.vosname || ""),
        configSerialId: Number(r.configserialid) || 0, createTime: Number(r.createtime) || 0,
        accessTime: Number(r.accesstime) || 0, accessIp: String(r.accessip || ""),
        socketId: Number(r.socketid) || 0, memo: String(r.memo || ""),
      })),
    });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed", equipment: [] }, { status: 500 }); }
}
