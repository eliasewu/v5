import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Must match the secret used in lib/auth.ts exactly
const rawSecret = process.env.JWT_SECRET || "";
if (!rawSecret) {
  console.warn("[middleware] JWT_SECRET not set — auth will fail until configured");
}
const JWT_SECRET = new TextEncoder().encode(rawSecret);

// ─── Rate Limiter (in-memory, per-IP) ───
const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 100;         // max requests
const RATE_WINDOW_MS = 10_000;  // per 10 seconds

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count++;
  if (entry.count > RATE_LIMIT) return true;
  return false;
}

// Clean stale entries every 5 minutes (globalThis guard prevents duplicates on hot reload)
if (!(globalThis as any).__rateCleaner) {
  (globalThis as any).__rateCleaner = setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateMap) {
      if (now > entry.resetAt) rateMap.delete(ip);
    }
  }, 300_000);
}

// ─── User-Agent Block List ───
const BLOCKED_AGENTS = [
  "HTTrack", "httrack", "WebCopier", "WebZIP", "WebSnake",
  "SiteSucker", "Offline Explorer", "Teleport Pro", "WebStripper",
  "wget", "curl", "python-requests", "Go-http-client",
  "zgrab", "masscan", "nmap", "sqlmap", "nikto",
  "WPScan", "acunetix", "burpsuite", "nessus",
];

function isBlockedAgent(ua: string): boolean {
  if (!ua) return false;
  return BLOCKED_AGENTS.some((agent) => ua.toLowerCase().includes(agent.toLowerCase()));
}

// ─── Security Headers ───
function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; font-src 'self'"
  );
  return response;
}

// ─── Main Middleware ───
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/robots.txt") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js|woff2?)$/)
  ) {
    return NextResponse.next();
  }

  // Exempt health check endpoint — used by systemd ExecStartPost (which runs curl)
  if (pathname === "/api/health") {
    return addSecurityHeaders(NextResponse.next());
  }

  // ── Layer 1: User-Agent Blocking ──
  const ua = request.headers.get("user-agent") || "";
  if (isBlockedAgent(ua)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // ── Layer 2: Rate Limiting ──
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    (request as any).socket?.remoteAddress?.replace(/^::ffff:/, "") ||
    "unknown";
  if (isRateLimited(ip)) {
    return new NextResponse("Too Many Requests", { status: 429 });
  }

  // ── Layer 3: Security Headers ──
  // Applied to the response after processing the route

  // ── Layer 4: JWT Auth for /dashboard ──
  if (pathname.startsWith("/dashboard")) {
    const isRscRequest = request.headers.get("rsc") === "1" || request.nextUrl.searchParams.has("_rsc");
    if (isRscRequest) {
      return addSecurityHeaders(NextResponse.next());
    }

    const token = request.cookies.get("vos_session")?.value;
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      return addSecurityHeaders(NextResponse.redirect(loginUrl));
    }

    try {
      await jwtVerify(token, JWT_SECRET);
      return addSecurityHeaders(NextResponse.next());
    } catch {
      const loginUrl = new URL("/login", request.url);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete("vos_session");
      return addSecurityHeaders(response);
    }
  }

  // API routes: only apply rate limiting + security headers (auth handled by verifySession)
  return addSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
