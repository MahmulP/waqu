import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes, static files, install and login pages
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/install') ||
    pathname.startsWith('/login') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check if database is configured
  const dbConfigured = 
    process.env.DB_HOST &&
    process.env.DB_USER &&
    process.env.DB_NAME;

  if (!dbConfigured && pathname !== '/install') {
    return NextResponse.redirect(new URL('/install', request.url));
  }

  // Check authentication for dashboard routes
  if (pathname.startsWith('/dashboard')) {
    const userId = request.cookies.get('userId')?.value;
    if (!userId) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
