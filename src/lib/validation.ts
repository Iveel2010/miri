import { z, ZodTypeAny, ZodError } from "zod";
import { ValidationError } from "./errors";

// ============================================================================
// Zod validation helpers used by controllers to validate inputs.
// ============================================================================

/**
 * Parse `data` against a Zod schema. On failure throw a 422 ValidationError
 * whose details map field -> messages (ready for the client).
 */
export function validate<T extends ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  try {
    return schema.parse(data);
  } catch (err) {
    if (err instanceof ZodError) {
      const details: Record<string, string[]> = {};
      for (const issue of err.issues) {
        const key = issue.path.join(".") || "_";
        (details[key] ??= []).push(issue.message);
      }
      throw new ValidationError("Validation failed", details);
    }
    throw err;
  }
}

/** Safe partial parse (used for query strings where fields are optional). */
export function validateQuery<T extends ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  return validate(schema, data);
}

/** Coerce a query string value to a number with a default. */
export function num(value: string | null | undefined, fallback = 0): number {
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** Parse a comma-separated query string into a clean string array. */
export function csv(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Build a Prisma-friendly pagination object from page/limit. */
export function paginate(page = 1, limit = 12) {
  const safePage = Math.max(1, Math.floor(page));
  const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));
  return {
    skip: (safePage - 1) * safeLimit,
    take: safeLimit,
    page: safePage,
    limit: safeLimit,
  };
}

export function buildMeta(total: number, page: number, limit: number) {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
