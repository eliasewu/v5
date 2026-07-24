import { execSync } from "child_process";
import { NextResponse } from "next/server";

let cachedVersion: { tag: string; commit: string; date: string } | null = null;

function run(cmd: string): string {
  return execSync(cmd, { shell: "/bin/bash" }).toString().trim();
}

function getVersion() {
  if (cachedVersion) return cachedVersion;

  try {
    const commit = run("git rev-parse --short HEAD");
    const tag = run("git describe --tags --exact-match 2>/dev/null || echo ''");
    const date = run("git log -1 --format=%cd --date=short");

    cachedVersion = { tag: tag || "", commit, date };
    return cachedVersion;
  } catch {
    return { tag: "dev", commit: "unknown", date: "" };
  }
}

export async function GET() {
  return NextResponse.json(getVersion(), {
    headers: { "Cache-Control": "no-store" },
  });
}
