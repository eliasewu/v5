import { NextResponse } from "next/server";
import { queryVos } from "@/lib/vos-db";
import { verifySession } from "@/lib/auth";

export async function GET() {
  const user = await verifySession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const rows = await queryVos<any>(
      `SELECT u.socketid, u.loginip, u.logintime, u.user_id, e.loginname, e.username
       FROM e_userlogin u
       LEFT JOIN e_user e ON u.user_id = e.id
       ORDER BY u.logintime DESC`
    );
    return NextResponse.json({
      users: (rows as any[]).map(r => ({
        socketId: Number(r.socketid) || 0, loginIp: String(r.loginip || ""),
        loginTime: Number(r.logintime) || 0, userId: Number(r.user_id) || 0,
        loginName: String(r.loginname || ""), userName: String(r.username || ""),
      })),
    });
  } catch (e: any) { return NextResponse.json({ error: e?.message || "Failed", users: [] }, { status: 500 }); }
}
