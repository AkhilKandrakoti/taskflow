import { NextResponse } from 'next/server';

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function created<T>(data: T) {
  return ok(data, 201);
}

export function badRequest(message: string, errors?: unknown) {
  return NextResponse.json(
    { success: false, message, ...(errors ? { errors } : {}) },
    { status: 400 }
  );
}

export function unauthorized(message = 'Authentication required') {
  return NextResponse.json({ success: false, message }, { status: 401 });
}

export function forbidden(message = 'You do not have permission to perform this action') {
  return NextResponse.json({ success: false, message }, { status: 403 });
}

export function notFound(message = 'Resource not found') {
  return NextResponse.json({ success: false, message }, { status: 404 });
}

export function serverError(message = 'An unexpected error occurred') {
  return NextResponse.json({ success: false, message }, { status: 500 });
}
