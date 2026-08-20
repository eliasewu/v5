import { NextRequest, NextResponse } from "next/server";
import { queryVos } from "@/lib/vos-db";
import { verifySession } from "@/lib/auth";

function dateKey(date: string): string {
  const d = date || new Date().toISOString().slice(0, 10);
  return d.replace(/-/g, "");
}

export async function GET(request: NextRequest) {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const date = request.nextUrl.searchParams.get("date") || new Date().toISOString().slice(0, 10);
    const search = (request.nextUrl.searchParams.get("search") || "").trim();
    const limit = Math.min(Number(request.nextUrl.searchParams.get("limit")) || 200, 500);

    const table = `e_axb_cdr_${dateKey(date)}`;
    const tables = await queryVos<any>(`SHOW TABLES LIKE '${table}%'`);
    if (tables.length === 0) {
      return NextResponse.json({ cdrs: [], total: 0, table, note: `No AXB CDR table for ${date}` });
    }

    const where = search
      ? "WHERE anumber LIKE ? OR xnumber LIKE ? OR bnumber LIKE ? OR customername LIKE ? OR callere164 LIKE ? OR xaccountname LIKE ?"
      : "";
    const like = `%${search}%`;
    const params = search ? [like, like, like, like, like, like] : [];

    const [totalRow] = await queryVos<any>(`SELECT COUNT(*) AS cnt FROM ${table} ${where}`, params);
    const rows = await queryVos<any>(`SELECT * FROM ${table} ${where} ORDER BY starttime DESC LIMIT ${limit}`, params);

    return NextResponse.json({
      total: Number(totalRow?.cnt || 0),
      table,
      cdrs: (rows as any[]).map(r => ({
        id: Number(r.id), callere164: String(r.callere164 || ""), callergatewayid: String(r.callergatewayid || ""),
        callertype: Number(r.callertype) || 0, calleegatewayid: String(r.calleegatewayid || ""),
        anumber: String(r.anumber || ""), xnumber: String(r.xnumber || ""), bnumber: String(r.bnumber || ""),
        starttime: Number(r.starttime) || 0, stoptime: Number(r.stoptime) || 0,
        holdtime: Number(r.holdtime) || 0, enddirection: Number(r.enddirection) || 0,
        endreason: Number(r.endreason) || 0, fee: Number(r.fee) || 0, feetime: Number(r.feetime) || 0,
        customeraccount: String(r.customeraccount || ""), customername: String(r.customername || ""),
        agentfee: Number(r.agentfee) || 0, agentaccount: String(r.agentaccount || ""), agentname: String(r.agentname || ""),
        xfee: Number(r.xfee) || 0, xaccount: String(r.xaccount || ""), xaccountname: String(r.xaccountname || ""),
        xinterface: String(r.xinterface || ""), flowno: Number(r.flowno) || 0,
      })),
    });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed", cdrs: [] }, { status: 500 }); }
}
