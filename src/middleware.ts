import { NextRequest, NextResponse } from "next/server";
import type { UserRole } from "@/lib/auth-store";

// ── Public routes — no auth required ─────────────────────────────────────────
const PUBLIC_PREFIXES = [
  "/",
  "/login",
  "/register",
  "/verify-otp",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
  "/terms",
  "/privacy",
  "/_next",
  "/api",
  "/icons",
  "/screenshots",
  "/og-image.png",
  "/manifest.json",
  "/sw.js",
  "/favicon.ico",
];

// ── Role-restricted route prefixes ───────────────────────────────────────────
// Admin can access ALL routes (they preview any hub via adminHub state)
const ROLE_ROUTES: Record<string, UserRole[]> = {
  "/player":        ["player",  "admin"],
  "/coach":         ["coach",   "admin"],
  "/scout":         ["scout",   "admin"],
  "/fan":           ["fan",     "admin"],
  "/dashboard":     ["admin"],
  "/users":         ["admin"],
  "/verifications": ["admin"],
  "/scout-requests":["admin", "scout"],
  "/tournaments":   ["player", "coach", "scout", "fan", "admin"],
  "/video-analysis":["player", "coach", "admin"],
  // Shared protected routes — any authenticated user
  "/settings":      ["player", "coach", "scout", "fan", "admin"],
  "/sessions":      ["player", "coach", "scout", "fan", "admin"],
  "/analytics":     ["player", "coach", "scout", "fan", "admin"],
  "/community":     ["player", "coach", "scout", "fan", "admin"],
  "/injury-tracker":["player", "coach", "scout", "fan", "admin"],
  "/notifications": ["player", "coach", "scout", "fan", "admin"],
  "/streaming":     ["player", "coach", "scout", "fan", "admin"],
  "/subscriptions": ["player", "coach", "scout", "fan", "admin"],
  "/video-studio":  ["player", "coach", "scout", "fan", "admin"],
  "/welcome":       ["player", "coach", "scout", "fan", "admin"],
};

function isPublic(pathname: string): boolean {
  if (pathname === "/") return true;
  return PUBLIC_PREFIXES.some(
    (prefix) => prefix !== "/" && pathname.startsWith(prefix)
  );
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow public routes and static assets
  if (isPublic(pathname)) return NextResponse.next();

  const token = req.cookies.get("gs_token")?.value;
  const role  = req.cookies.get("gs_role")?.value as UserRole | undefined;

  // No token — redirect to login, preserving intended destination
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Check role-restricted routes
  const matchedPrefix = Object.keys(ROLE_ROUTES).find((prefix) =>
    pathname.startsWith(prefix)
  );

  if (matchedPrefix && role) {
    const allowed = ROLE_ROUTES[matchedPrefix];
    if (!allowed.includes(role)) {
      // Redirect to their own hub instead of 403
      const url = req.nextUrl.clone();
      url.pathname = rolePath(role);
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

function rolePath(role: UserRole): string {
  switch (role) {
    case "admin":    return "/dashboard";
    case "coach":    return "/coach";
    case "scout":    return "/scout";
    case "player":   return "/player";
    case "fan":      return "/fan";
    case "analyst":  return "/analyst";
    default:         return "/dashboard";
  }
}

export const config = {
  matcher: [
    /*
     * Match all paths except Next.js internals and static files.
     * This runs on every page request but NOT on _next/static, _next/image,
     * or files with an extension (images, fonts, etc.).
     */
    "/((?!_next/static|_next/image|.*\\.(?:ico|png|jpg|jpeg|svg|webp|woff2?|ttf|otf|css|js|map)).*)",
  ],
};
