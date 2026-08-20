import { execSync } from "child_process";
import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await verifySession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    execSync("/home/kunshiweb/vos-billing/deploy.sh --force", {
      cwd: "/home/kunshiweb/vos-billing",
      shell: "/bin/bash",
      timeout: 120_000,
      stdio: "pipe",
    });
    return NextResponse.json({ success: true, message: "Deploy complete" });
  } catch (e: any) {
    const msg = e?.stderr?.toString() || e?.message || "Unknown error";
    return NextResponse.json({ success: false, error: msg.slice(0, 200) }, { status: 500 });
  }
}
