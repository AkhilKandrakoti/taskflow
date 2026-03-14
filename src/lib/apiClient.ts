/**
 * apiClient — thin fetch wrapper that handles E2E encryption transparently.
 *
 * Every outgoing POST/PATCH body is AES-encrypted before transmission.
 * Every incoming response `data` field is AES-decrypted after receipt.
 *
 * Usage:
 *   const data = await apiClient.post('/api/auth/login', { email, password });
 *   const data = await apiClient.get('/api/tasks?page=1');
 */

import { encryptPayload, decryptResponse } from '@/lib/crypto';

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

async function request<T = unknown>(
  method: Method,
  url: string,
  body?: unknown
): Promise<T> {
  const init: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  };

  // Encrypt the request body for mutating methods
  if (body !== undefined && method !== 'GET') {
    init.body = JSON.stringify(encryptPayload(body));
  }

  const res = await fetch(url, init);
  const json = await res.json();

  if (!res.ok) {
    // Error responses are NOT encrypted (they contain no sensitive data)
    throw new Error(json.message || `Request failed: ${res.status}`);
  }

  // Decrypt the response data envelope
  if (json.data && typeof json.data === 'object' && '__enc' in json.data) {
    return decryptResponse<T>(json.data as { __enc: string });
  }

  // Fallback: plain response (e.g. logout)
  return json.data as T;
}

export const apiClient = {
  get:    <T>(url: string)                  => request<T>('GET',    url),
  post:   <T>(url: string, body: unknown)   => request<T>('POST',   url, body),
  patch:  <T>(url: string, body: unknown)   => request<T>('PATCH',  url, body),
  delete: <T>(url: string)                  => request<T>('DELETE', url),
};
