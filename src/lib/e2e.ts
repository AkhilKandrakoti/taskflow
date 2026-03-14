import { NextResponse } from 'next/server';
import { encryptResponse, decryptPayload } from '@/lib/crypto';

/**
 * Parse a request body — handles both encrypted { __enc } envelopes
 * and plain JSON (for backward compat / health checks).
 */
export async function parseBody<T>(req: Request): Promise<T> {
  const raw = await req.json();
  if (raw && typeof raw === 'object' && '__enc' in raw) {
    return decryptPayload<T>(raw as { __enc: string });
  }
  // Plain JSON fallback (dev tools, Postman without encryption)
  return raw as T;
}

/**
 * Send an encrypted success response.
 * The entire `data` payload is AES-encrypted before transmission.
 */
export function okE2E(data: unknown, status = 200): NextResponse {
  return NextResponse.json(
    { success: true, data: encryptResponse(data) },
    { status }
  );
}

export function createdE2E(data: unknown): NextResponse {
  return okE2E(data, 201);
}
