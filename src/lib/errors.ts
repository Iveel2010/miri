// ============================================================================
// Centralized error types. Thrown by services/repositories, mapped to HTTP
// responses by the route-layer `handleError` helper.
// ============================================================================

export class AppError extends Error {
  readonly statusCode: number;
  readonly code: string;
  details?: unknown;

  constructor(
    message: string,
    statusCode = 500,
    code = "INTERNAL_ERROR",
    details?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request", details?: unknown) {
    super(message, 400, "BAD_REQUEST", details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403, "FORBIDDEN");
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict", details?: unknown) {
    super(message, 409, "CONFLICT", details);
  }
}

export class ValidationError extends AppError {
  constructor(
    message = "Validation failed",
    details?: Record<string, string[]>,
  ) {
    super(message, 422, "VALIDATION_ERROR", details);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = "Too many requests", retryAfter?: number) {
    super(message, 429, "RATE_LIMITED");
    if (retryAfter !== undefined) this.details = { retryAfter };
  }
}

// Codes that indicate the database is unreachable / a connection failed.
// These should map to 503 so clients can retry rather than treating it as a
// permanent 500.
const PRISMA_CONNECTION_CODES = new Set([
  "P1000", "P1001", "P1002", "P1003", "P1008", "P1009",
  "P1010", "P1011", "P1012", "P1013", "P1014", "P1015",
  "P1016", "P1017", "P1018", "P1024",
]);

// Maps a Prisma error to a domain error. Accepts the Prisma error instance
// (with a `name`) or a plain object (code/message/meta).
export function fromPrismaError(error: {
  name?: string;
  code?: string;
  meta?: unknown;
  message?: string;
}): AppError {
  const code = error.code;

  // Connection / initialization failures (no reliable code, or known codes).
  if (
    error.name === "PrismaClientInitializationError" ||
    error.name === "PrismaClientRustPanicError" ||
    (code && PRISMA_CONNECTION_CODES.has(code))
  ) {
    return new AppError(
      "The database is temporarily unavailable. Please try again.",
      503,
      "DB_UNAVAILABLE",
      code ? { code } : undefined,
    );
  }

  switch (code) {
    case "P2002":
      return new ConflictError("A record with this value already exists.", error.meta);
    case "P2025":
      return new NotFoundError("Record not found.");
    case "P2003":
      return new BadRequestError("Related record does not exist.", error.meta);
    case "P2000":
    case "P2001":
    case "P2006":
    case "P2011":
    case "P2012":
    case "P2013":
    case "P2019":
    case "P2020":
    case "P2021":
    case "P2022":
      return new BadRequestError(error.message ?? "Invalid database query.", error.meta);
    default:
      return new AppError(
        error.message ?? "Database error",
        500,
        "DB_ERROR",
        code ? { code } : undefined,
      );
  }
}
