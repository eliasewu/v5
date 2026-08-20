import { NextRequest, NextResponse } from "next/server";
import { queryVos } from "@/lib/vos-db";
import { verifySession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const search = (request.nextUrl.searchParams.get("search") || "").trim();
    const limit = Math.min(Number(request.nextUrl.searchParams.get("limit")) || 200, 500);

    const where = search
      ? "WHERE npanxx LIKE ? OR state LIKE ? OR company LIKE ? OR ratecenter LIKE ? OR ocn LIKE ?"
      : "";
    const like = `%${search}%`;
    const params = search ? [like, like, like, like, like] : [];

    const [totalRow] = await queryVos<any>(`SELECT COUNT(*) AS cnt FROM e_lerg ${where}`, params);
    const rows = await queryVos<any>(`SELECT * FROM e_lerg ${where} ORDER BY npanxx LIMIT ${limit}`, params);

    return NextResponse.json({
      total: Number(totalRow?.cnt || 0),
      records: (rows as any[]).map(r => ({
        id: Number(r.id), state: String(r.state || ""), npanxx: String(r.npanxx || ""),
        ocn: String(r.ocn || ""), company: String(r.company || ""), ratecenter: String(r.ratecenter || ""),
        effectivedate: String(r.effectivedate || ""), used: String(r.used || ""),
        assigndate: String(r.assigndate || ""), initialorgrowth: String(r.initialorgrowth || ""),
      })),
    });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed", records: [] }, { status: 500 }); }
}
