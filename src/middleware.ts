import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that are fully public — no token needed
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/about',
  '/pricing',
  '/privacy',
  '/terms',
  // All hub routes are open to guests (explore-first model)
  '/player',
  '/coach',
  '/scout',
  '/fan',
  '/analyst',
  '/streaming',
  '/video-studio',
  '/video-analysis',
  '/sessions',
  '/welcome',
  '/talent-database',
  '/school-leagues',
  '/injury-tracker',
  '/community',
  '/tournaments',
  '/subscriptions',
  '/analytics',
  '/settings',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/locales')
  ) {
    return NextResponse.next();
  }

  // Allow all public and hub routes for guests
  if (PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))) {
    return NextResponse.next();
  }

  // /admin requires auth — check for token cookie (set by auth-store as gs_token)
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('gs_token')?.value;
    const role  = request.cookies.get('gs_role')?.value;

    if (!token || role !== 'admin') {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)',
  ],
};
