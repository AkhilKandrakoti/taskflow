import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const PROTECTED_ROUTES = ['/dashboard'];
const AUTH_ROUTES = ['/login', '/register'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const accessToken = req.cookies.get('tf_access')?.value;
  const refreshToken = req.cookies.get('tf_refresh')?.value;

  const hasSession = accessToken || refreshToken;

  // Check if the route requires auth
  const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
  const isAuthPage = AUTH_ROUTES.some((r) => pathname.startsWith(r));

  if (isProtected) {
    if (!hasSession) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Validate access token if present
    if (accessToken) {
      try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
        await jwtVerify(accessToken, secret);
      } catch {
        // Token invalid — but refresh token might save the session
        // Let the API middleware handle the refresh; just allow through
        if (!refreshToken) {
          return NextResponse.redirect(new URL('/login', req.url));
        }
      }
    }
  }

  // Redirect logged-in users away from auth pages
  if (isAuthPage && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};
