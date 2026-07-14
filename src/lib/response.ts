import { NextResponse } from "next/server";

// ============================================================================
// Typed API response helpers.
// Every route returns a consistent envelope: { success, data | message, ... }.
// ============================================================================

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  code?: string;
  errors?: Record<string, string[]> | string[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function ok<T>(data: T, status = 200, message?: string): NextResponse {
  const body: ApiSuccess<T> = { success: true, data };
  if (message) body.message = message;
  return NextResponse.json(body, { status });
}

export function paginated<T>(
  data: T[],
  meta: PaginationMeta,
  status = 200,
): NextResponse {
  return NextResponse.json(
    { success: true, data, meta },
    { status },
  );
}

export function created<T>(data: T, message = "Created"): NextResponse {
  return ok(data, 201, message);
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

export function fail(
  message: string,
  status = 400,
  code?: string,
  errors?: ApiError["errors"],
): NextResponse {
  const body: ApiError = { success: false, message };
  if (code) body.code = code;
  if (errors) body.errors = errors;
  return NextResponse.json(body, { status });
}

export const ApiResponse = { ok, paginated, created, noContent, fail };
