import CryptoJS from 'crypto-js';

/**
 * SHARED crypto module — runs on both client and server.
 *
 * End-to-end encryption design:
 *   Client  →  encrypts payload with SHARED_KEY before fetch()
 *   Server  →  decrypts payload with SHARED_KEY before processing
 *   Server  →  encrypts response with SHARED_KEY before sending
 *   Client  →  decrypts response after fetch()
 *
 * The SHARED_KEY is the NEXT_PUBLIC_AES_KEY env var (exposed to browser).
 * Sensitive DB-level encryption (descriptions at rest) uses the server-only
 * AES_SECRET_KEY which is never sent to the client.
 *
 * This means even if someone intercepts the HTTPS stream, all body fields
 * are opaque ciphertext — a second layer beyond TLS.
 */

// ─── Keys ────────────────────────────────────────────────────────────────────

/**
 * Shared key — available in browser AND server.
 * Used for request/response body encryption (E2E layer).
 */
const getSharedKey = (): string => {
  const key =
    (typeof window === 'undefined'
      ? process.env.NEXT_PUBLIC_AES_KEY   // server build
      : (window as any).__ENV_AES_KEY ?? process.env.NEXT_PUBLIC_AES_KEY);
  if (!key) throw new Error('[crypto] NEXT_PUBLIC_AES_KEY is not set');
  return key;
};

/**
 * Server-only key — never sent to browser.
 * Used for encrypting task descriptions at rest in MongoDB.
 */
const getServerKey = (): string => {
  if (typeof window !== 'undefined') throw new Error('[crypto] Server key accessed on client');
  const key = process.env.AES_SECRET_KEY;
  if (!key) throw new Error('[crypto] AES_SECRET_KEY is not set');
  return key;
};

// ─── Primitives ──────────────────────────────────────────────────────────────

function aesEncrypt(plaintext: string, key: string): string {
  return CryptoJS.AES.encrypt(plaintext, key).toString();
}

function aesDecrypt(ciphertext: string, key: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, key);
  const result = bytes.toString(CryptoJS.enc.Utf8);
  if (!result) throw new Error('[crypto] Decryption produced empty string — wrong key or corrupt data');
  return result;
}

// ─── E2E (request / response bodies) ─────────────────────────────────────────

/**
 * Wrap an object into an encrypted envelope for transmission.
 * Call this on the CLIENT before every fetch() POST/PATCH body.
 *
 * Output shape: { __enc: "<ciphertext>" }
 */
export function encryptPayload(data: unknown): { __enc: string } {
  const json = JSON.stringify(data);
  return { __enc: aesEncrypt(json, getSharedKey()) };
}

/**
 * Unwrap an encrypted envelope on the SERVER after receiving a request.
 * Returns the original parsed object.
 */
export function decryptPayload<T = unknown>(envelope: { __enc: string }): T {
  const json = aesDecrypt(envelope.__enc, getSharedKey());
  return JSON.parse(json) as T;
}

/**
 * Encrypt a server response object before sending to client.
 * Output shape: { __enc: "<ciphertext>" }
 */
export function encryptResponse(data: unknown): { __enc: string } {
  return { __enc: aesEncrypt(JSON.stringify(data), getSharedKey()) };
}

/**
 * Decrypt a server response on the CLIENT after fetch().
 */
export function decryptResponse<T = unknown>(envelope: { __enc: string }): T {
  const json = aesDecrypt(envelope.__enc, getSharedKey());
  return JSON.parse(json) as T;
}

// ─── At-rest DB encryption (server only) ─────────────────────────────────────

/** Encrypt a string for storage in MongoDB (server only). */
export function encryptAtRest(plaintext: string): string {
  return aesEncrypt(plaintext, getServerKey());
}

/** Decrypt a string retrieved from MongoDB (server only). */
export function decryptAtRest(ciphertext: string): string {
  try {
    return aesDecrypt(ciphertext, getServerKey());
  } catch {
    return ciphertext; // plain-text migration fallback
  }
}

// Legacy aliases kept for compatibility with existing route files
export const encrypt = encryptAtRest;
export const decrypt = decryptAtRest;
