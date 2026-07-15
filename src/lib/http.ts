import { NextResponse } from "next/server";
import { inspect } from "util";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { ApiResponse } from "./response";
import type { ApiError } from "./response";
import {
  AppError,
  BadRequestError,
  fromPrismaError,
  ValidationError,
} from "./errors";
import { logger } from "./logger";

// ============================================================================
// Route-layer helpers: JSON body parsing, centralized error handling,
// and a combined rate-limit + CORS guard wrapper.
// ============================================================================

/** Parse a JSON request body, returning {} on empty/invalid. */
export async function parseJson<T = Record<string, unknown>>(req: Request): Promise<T> {
  try {
    const text = await req.text();
    if (!text) return {} as T;
    return JSON.parse(text) as T;
  } catch {
    throw new BadRequestError("Invalid JSON body");
  }
}

/** Read multipart form fields + files. */
export async function parseForm(req: Request) {
  const form = await req.formData();
  const fields: Record<string, string> = {};
  const files: File[] = [];
  for (const [key, value] of form.entries()) {
    if (value instanceof File) files.push(value);
    else fields[key] = String(value);
  }
  return { fields, files };
}

/** Map any thrown error to a typed JSON response. */
export function handleError(err: unknown, req?: Request): NextResponse {
  const loc = req ? `${req.method} ${req.url}` : "(no request)";
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(`${loc} -> ${err.name}: ${err.message}`, err.details);
    }
    return ApiResponse.fail(
      err.message,
      err.statusCode,
      err.code,
      err.details as ApiError["errors"],
    );
  }
  if (err instanceof ValidationError) {
    return ApiResponse.fail(err.message, 422, err.code, err.details as ApiError["errors"]);
  }
  if (err instanceof ZodError) {
    const details: Record<string, string[]> = {};
    for (const issue of err.issues) {
      const key = issue.path.join(".") || "_";
      (details[key] ??= []).push(issue.message);
    }
    return ApiResponse.fail("Validation failed", 422, "VALIDATION_ERROR", details);
  }
  if (
    err instanceof Prisma.PrismaClientKnownRequestError ||
    err instanceof Prisma.PrismaClientUnknownRequestError ||
    err instanceof Prisma.PrismaClientInitializationError ||
    err instanceof Prisma.PrismaClientValidationError
  ) {
    const mapped = fromPrismaError(err);
    const meta = (err as { meta?: unknown }).meta;
    if (mapped.statusCode >= 500) logger.error(`${loc} -> ${mapped.message}`, meta ?? err.message);
    return ApiResponse.fail(mapped.message, mapped.statusCode, mapped.code, mapped.details as ApiError["errors"]);
  }
  // Genuinely unexpected: never swallow the cause. Surface its real shape.
  logger.error(`UNHANDLED ${loc} ::`, inspect(err, { depth: 5, showHidden: false }));
  return ApiResponse.fail(
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err instanceof Error
        ? err.message
        : "Internal server error",
    500,
    "INTERNAL_ERROR",
  );
}

/**
 * Wrap a route handler so errors are always converted to JSON and security
 * headers are applied. Usage: `export const GET = withHandler(async (req) => …)`.
 */
export function withHandler(
  fn: (req: Request, ctx: unknown) => Promise<NextResponse> | NextResponse,
) {
  return async (req: Request, ctx: unknown): Promise<NextResponse> => {
    try {
      const res = await fn(req, ctx);
      return res;
    } catch (err) {
      return handleError(err, req);
    }
  };
}
