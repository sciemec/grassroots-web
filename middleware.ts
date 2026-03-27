import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/*
|--------------------------------------------------------------------------
| GrassRoots Sports - Route Protection Middleware
| File: middleware.ts (place in project root, next to package.json)
|--------------------------------------------------------------------------
*/

// Routes that don't need auth
const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/',           // landing page
  '/about',
  '/pricing',
];

// Routes restricted by role
const ROLE_ROUTES: Record<string, string[]> = {
  '/admin':  ['admin'],
  '/club':   ['club', 'admin'],
  '/scout':  ['scout', 'admin'],
  '/player': ['player', 'admin'],
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some(r => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // Allow static files and API routes
  if (pathname.startsWith('/_next') || pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Check for token in cookies (more secure than localStorage for middleware)
  // Note: localStorage is not accessible in middleware — use cookies for SSR auth
  const token = request.cookies.get('grassroots_token')?.value;

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based access (requires user role in cookie)
  const userRole = request.cookies.get('grassroots_role')?.value;

  for (const [routePrefix, allowedRoles] of Object.entries(ROLE_ROUTES)) {
    if (pathname.startsWith(routePrefix)) {
      if (!userRole || !allowedRoles.includes(userRole)) {
        // Redirect to their own dashboard
        const dashboardMap: Record<string, string> = {
          admin:  '/admin/dashboard',
          club:   '/club/dashboard',
          scout:  '/scout/dashboard',
          player: '/player/dashboard',
        };
        const redirect = dashboardMap[userRole ?? ''] ?? '/login';
        return NextResponse.redirect(new URL(redirect, request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
};
