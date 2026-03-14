import { NextResponse } from 'next/server';
import { clearAuthCookies } from '@/lib/cookies';
import { ok } from '@/lib/response';

export async function POST() {
  const response = ok({ message: 'Logged out successfully' });
  return clearAuthCookies(response);
}
