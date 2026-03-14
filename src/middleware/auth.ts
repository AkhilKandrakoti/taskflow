import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, verifyRefreshToken, signAccessToken, JWTPayload } from '@/lib/jwt';
import { setAuthCookies, COOKIE_ACCESS, COOKIE_REFRESH } from '@/lib/cookies';
import { unauthorized } from '@/lib/response';

export interface AuthenticatedRequest extends NextRequest {
  user: JWTPayload;
}

type RouteHandler = (
  req: AuthenticatedRequest,
  context: { params: Record<string, string> }
) => Promise<NextResponse>;

/**
 * Higher-order function that wraps route handlers with JWT authentication.
 * Automatically attempts a silent access-token refresh via the refresh token
 * if the access token is expired — standard sliding-session pattern.
 */
export function withAuth(handler: RouteHandler) {
  return async (
    req: NextRequest,
    context: { params: Record<string, string> }
  ): Promise<NextResponse> => {
    const accessToken = req.cookies.get(COOKIE_ACCESS)?.value;
    const refreshToken = req.cookies.get(COOKIE_REFRESH)?.value;

    let payload: JWTPayload | null = null;
    let refreshed = false;
    let newAccessToken: string | null = null;

    // 1. Try access token
    if (accessToken) {
      try {
        payload = verifyAccessToken(accessToken);
      } catch {
        // expired or invalid — fall through to refresh
      }
    }

    // 2. Silent refresh if access token is gone or expired
    if (!payload && refreshToken) {
      try {
        const refreshPayload = verifyRefreshToken(refreshToken);
        payload = { userId: refreshPayload.userId, email: refreshPayload.email };
        newAccessToken = signAccessToken(payload);
        refreshed = true;
      } catch {
        return unauthorized('Session expired. Please log in again.');
      }
    }

    if (!payload) {
      return unauthorized();
    }

    // Attach user to request
    (req as AuthenticatedRequest).user = payload;

    const response = await handler(req as AuthenticatedRequest, context);

    // If we silently refreshed, attach the new access token cookie
    if (refreshed && newAccessToken) {
      setAuthCookies(response, newAccessToken, refreshToken!);
    }

    return response;
  };
}
