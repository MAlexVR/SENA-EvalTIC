import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// ── Rate limiter en memoria ────────────────────────────────────────────────
// Nota: se resetea en cold starts — usar Upstash Redis para producción real
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, maxRequests = 30, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}

// ── Generación de nonce (Web Crypto — compatible con Edge runtime) ──────────
function generateNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes));
}

// ── CSP con nonce ─────────────────────────────────────────────────────────
function buildCsp(nonce: string): string {
  const scriptSrc =
    process.env.NODE_ENV === "production"
      ? `script-src 'self' 'nonce-${nonce}'`
      : `script-src 'self' 'nonce-${nonce}' 'unsafe-eval'`; // Turbopack hot reload

  return [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://res.cloudinary.com",
    "font-src 'self' data:",
    "connect-src 'self' https://api.cloudinary.com",
    "frame-ancestors 'none'",
  ].join("; ");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Rate limit en endpoints públicos de evaluación ──────────────────────
  if (pathname.startsWith("/api/evaluacion/")) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Intenta de nuevo en un minuto." },
        { status: 429 },
      );
    }
  }

  // ── Proteger panel del instructor ───────────────────────────────────────
  if (pathname.startsWith("/instructor/") && !pathname.startsWith("/instructor/login")) {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (!token) {
      const signInUrl = new URL("/instructor/login", request.url);
      signInUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  // ── CSP con nonce para todas las respuestas HTML ────────────────────────
  const nonce = generateNonce();
  const csp = buildCsp(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("content-security-policy", csp);
  return response;
}

export const config = {
  matcher: [
    // Aplica a todas las rutas excepto assets estáticos y prefetch de Next.js
    {
      source: "/((?!_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
