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

// Maps a Prisma known errors to a domain error.
export function fromPrismaError(error: {
  code?: string;
  meta?: unknown;
  message?: string;
}): AppError {
  switch (error.code) {
    case "P2002":
      return new ConflictError("A record with this value already exists.", error.meta);
    case "P2025":
      return new NotFoundError("Record not found.");
    case "P2003":
      return new BadRequestError("Related record does not exist.", error.meta);
    default:
      return new AppError(error.message ?? "Database error", 500, "DB_ERROR");
  }
}
