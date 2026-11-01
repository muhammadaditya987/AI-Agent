import { NextRequest, NextResponse } from 'next/server';

const protectedPaths = ['/dashboard', '/settings', '/profile', '/content-factory', '/workflows'];

export function middleware(request: NextRequest) {
  const requiresSession = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );

  if (
    requiresSession &&
    !request.cookies.has('ai_agency_access') &&
    !request.cookies.has('ai_agency_refresh')
  ) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnTo', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/settings/:path*', '/profile/:path*', '/content-factory/:path*', '/workflows/:path*'],
};