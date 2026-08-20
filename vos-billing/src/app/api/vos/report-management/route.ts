import { NextResponse } from "next/server";
import { queryVos } from "@/lib/vos-db";
import { verifySession } from "@/lib/auth";

export async function GET() {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const rows = await queryVos<any>("SELECT * FROM e_reportmanagement ORDER BY date DESC, createtime DESC LIMIT 500");
    return NextResponse.json({
      reports: (rows as any[]).map(r => ({
        id: Number(r.id), date: String(r.date || ""), createTime: Number(r.createtime) || 0,
        loginName: String(r.loginname || ""), types: Number(r.types) || 0, memo: String(r.memo || ""),
      })),
    });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed", reports: [] }, { status: 500 }); }
}
