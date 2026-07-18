// middleware.ts — root of Next.js project (same level as package.json)
//
// PHILOSOPHY: Grassroots Sports Pro is a discovery-first platform.
// Visitors and unregistered users can browse the ENTIRE app and see all
// features. Registration is only triggered when a user tries to PERFORM
// an action (submit a form, save data, upload a video, etc.).
//
// Page routes are ALL PUBLIC by default.
// API routes are ALL PROTECTED by default — except the explicit public list below.

import { NextRequest, NextResponse } from "next/server";

// ─── Pages that logged-in users should NOT see ────────────────────────────────
const AUTH_ONLY_PAGES = ["/login", "/register"];

// ─── API routes that are always PUBLIC (no auth required) ─────────────────────
// Exact matches — these specific paths bypass auth
const PUBLIC_API_EXACT = new Set([
  "/api/auth/login",              // login endpoint
  "/api/payments/paynow/webhook", // Paynow calls this (HMAC-verified, no JWT)
  "/api/payments/match-donate/webhook", // Paynow donation webhook
  "/api/payments/match-donate",   // public donation form submission
  "/api/thuto/whatsapp",          // WhatsApp/Meta webhook (signature-verified)
  "/api/test-isports",            // public test endpoint
]);

// Prefix matches — any route starting with these is public
const PUBLIC_API_PREFIXES = [
  "/api/drills",    // /api/drills and /api/drills/all — browsable content
  "/api/download/", // /api/download/apk — public APK download
  "/api/cron/",     // cron jobs called by Render scheduler
];

function isPublicApi(pathname: string): boolean {
  if (PUBLIC_API_EXACT.has(pathname)) return true;
  return PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p));
}

// ─── Middleware ───────────────────────────────────────────────────────────────
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Token from cookie or Authorization header
  const token =
    request.cookies.get("auth_token")?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "") ||
    null;

  const isLoggedIn = !!token;

  // 1. Redirect logged-in users away from login/register
  if (isLoggedIn && AUTH_ONLY_PAGES.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // 2. Protect all /api/ routes except the public whitelist
  if (pathname.startsWith("/api/") && !isPublicApi(pathname)) {
    if (!isLoggedIn) {
      return NextResponse.json(
        { message: "Please sign in to use this feature.", code: "UNAUTHENTICATED" },
        { status: 401 },
      );
    }
  }

  // 3. All page routes are public — let through
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)).*)",
  ],
};
