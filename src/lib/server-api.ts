import { headers } from "next/headers";
import { inspect } from "util";
import { ApiError, type Envelope } from "./api-client";
import { logger } from "./logger";
import type { PaginationMeta } from "@/types/api";

function buildEmptyMeta(): PaginationMeta {
  return { page: 1, limit: 0, total: 0, totalPages: 1, hasNext: false, hasPrev: false };
}

async function serverRaw(path: string, auth: boolean): Promise<Envelope | null> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? `${proto}://${host}`;
  const cookie = auth ? h.get("cookie") : undefined;

  const res = await fetch(`${base}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    cache: "no-store",
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const body = isJson ? ((await res.json()) as Envelope) : null;
  if (!res.ok) {
    throw new ApiError(
      res.status,
      body?.message ?? res.statusText,
      body?.code,
      body?.errors,
    );
  }
  if (res.status === 204) return null;
  return body ?? { success: true };
}

export async function serverApi<T>(path: string, auth = false): Promise<T> {
  const env = await serverRaw(path, auth);
  return (env?.data ?? null) as T;
}

export async function serverApiList<T>(
  path: string,
  auth = false,
): Promise<{ items: T[]; meta: PaginationMeta }> {
  const env = await serverRaw(path, auth);
  return { items: (env?.data ?? []) as T[], meta: (env?.meta as PaginationMeta | undefined) ?? buildEmptyMeta() };
}

/**
 * Resilient variant of {@link serverApi}: on any failure it logs the real
 * cause (so transient/opaque errors like a thrown `{}` are never swallowed
 * silently) and returns `fallback` instead of crashing the whole page with a
 * 500. Use this for Server-Component data that should degrade gracefully.
 */
export async function safeServerApi<T>(
  path: string,
  fallback: T,
  auth = false,
): Promise<T> {
  try {
    return await serverApi<T>(path, auth);
  } catch (err) {
    logger.error(`safeServerApi failed: ${path}`, inspect(err, { depth: 5 }));
    return fallback;
  }
}

/**
 * Resilient variant of {@link serverApiList}: returns empty data on failure
 * rather than throwing.
 */
export async function safeServerApiList<T>(
  path: string,
  auth = false,
): Promise<{ items: T[]; meta: PaginationMeta }> {
  try {
    return await serverApiList<T>(path, auth);
  } catch (err) {
    logger.error(`safeServerApiList failed: ${path}`, inspect(err, { depth: 5 }));
    return { items: [], meta: buildEmptyMeta() };
  }
}
