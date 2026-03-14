import { NextResponse } from 'next/server';

const IS_PROD = process.env.NODE_ENV === 'production';

export const COOKIE_ACCESS = 'tf_access';
export const COOKIE_REFRESH = 'tf_refresh';

export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string
): NextResponse {
  response.cookies.set(COOKIE_ACCESS, accessToken, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax',
    maxAge: 15 * 60,          // 15 minutes
    path: '/',
  });

  response.cookies.set(COOKIE_REFRESH, refreshToken, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });

  return response;
}

export function clearAuthCookies(response: NextResponse): NextResponse {
  response.cookies.set(COOKIE_ACCESS, '', { maxAge: 0, path: '/' });
  response.cookies.set(COOKIE_REFRESH, '', { maxAge: 0, path: '/' });
  return response;
}
