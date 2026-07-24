import { execSync } from "child_process";
import { NextResponse } from "next/server";

let cachedVersion: { tag: string; commit: string; date: string; behind: number; ahead: number } | null = null;

function run(cmd: string): string {
  return execSync(cmd, { shell: "/bin/bash" }).toString().trim();
}

function getVersion() {
  if (cachedVersion) return cachedVersion;

  try {
    const commit = run("git rev-parse --short HEAD");
    const tag = run("git describe --tags --exact-match 2>/dev/null || echo ''");
    const date = run("git log -1 --format=%cd --date=short");

    // Compare vs origin (local ref — no fetch for speed)
    let behind = 0;
    let ahead = 0;
    try {
      if (run("git config --get remote.origin.url 2>/dev/null || echo ''")) {
        const counts = run("git rev-list --left-right --count @{u}...HEAD 2>/dev/null || echo '0 0'");
        const parts = counts.split(/\s+/);
        behind = parseInt(parts[0]) || 0;
        ahead = parseInt(parts[1]) || 0;
      }
    } catch { /* ignore */ }

    cachedVersion = { tag: tag || "", commit, date, behind, ahead };
    return cachedVersion;
  } catch {
    return { tag: "dev", commit: "unknown", date: "", behind: 0, ahead: 0 };
  }
}

export async function GET() {
  return NextResponse.json(getVersion(), {
    headers: { "Cache-Control": "no-store" },
  });
}

// POST: force refresh (clears cache + fetches from origin)
export async function POST() {
  cachedVersion = null;
  try {
    run("git fetch origin --quiet 2>/dev/null || true");
  } catch { /* ignore */ }
  return NextResponse.json(getVersion(), {
    headers: { "Cache-Control": "no-store" },
  });
}
