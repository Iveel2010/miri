// ============================================================================
// Typed REST API client (browser + server safe for data fetching).
// Talks to the backend's /api/* routes. Auth uses httpOnly cookies, so the
// token is never read in JS — we only observe auth state via /api/auth/me.
// ============================================================================

export class ApiError extends Error {
  status: number;
  code?: string;
  errors?: Record<string, string[]> | string[];
  constructor(
    status: number,
    message: string,
    code?: string,
    errors?: Record<string, string[]> | string[],
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

// Hooks invoked on a 401 so the auth context can reset state.
const unauthorizedListeners = new Set<() => void>();
export function onUnauthorized(cb: () => void): () => void {
  unauthorizedListeners.add(cb);
  return () => unauthorizedListeners.delete(cb);
}

export interface Envelope {
  success: boolean;
  data?: unknown;
  meta?: unknown;
  message?: string;
  code?: string;
  errors?: Record<string, string[]> | string[];
}

import type { PaginationMeta } from "@/types/api";

function buildEmptyMeta(): PaginationMeta {
  return { page: 1, limit: 0, total: 0, totalPages: 1, hasNext: false, hasPrev: false };
}

type Init = RequestInit;

async function raw(path: string, init: Init = {}): Promise<Envelope | null> {
  const res = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? ((await res.json()) as Envelope) : null;

  if (!res.ok) {
    if (res.status === 401) unauthorizedListeners.forEach((cb) => cb());
    throw new ApiError(
      res.status,
      body?.message ?? res.statusText,
      body?.code,
      body?.errors,
    );
  }
  // 204 No Content
  if (res.status === 204) return null;
  return body ?? { success: true };
}

export async function apiGet<T>(path: string, init?: Init): Promise<T> {
  const env = await raw(path, { ...init, method: init?.method ?? "GET" });
  return (env?.data ?? null) as T;
}

export async function apiList<T>(path: string, init?: Init): Promise<{ items: T[]; meta: PaginationMeta }> {
  const env = await raw(path, { ...init, method: init?.method ?? "GET" });
  return { items: (env?.data ?? []) as T[], meta: (env?.meta as PaginationMeta | undefined) ?? buildEmptyMeta() };
}

export async function apiPost<T>(path: string, body?: unknown, init?: Init): Promise<T> {
  return apiGet<T>(path, {
    ...init,
    method: "POST",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export async function apiPatch<T>(path: string, body?: unknown, init?: Init): Promise<T> {
  return apiGet<T>(path, {
    ...init,
    method: "PATCH",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export async function apiPut<T>(path: string, body?: unknown, init?: Init): Promise<T> {
  return apiGet<T>(path, {
    ...init,
    method: "PUT",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export async function apiDelete<T>(path: string, init?: Init): Promise<T> {
  return apiGet<T>(path, { ...init, method: "DELETE" });
}

export const apiClient = { get: apiGet, list: apiList, post: apiPost, patch: apiPatch, del: apiDelete };
