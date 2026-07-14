import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "./jwt";
import { UnauthorizedError } from "./errors";
import type { AccessTokenPayload } from "./jwt";
import type { Role, User } from "@prisma/client";

// ============================================================================
// Authentication primitives: password hashing + token issuance + session.
// ============================================================================

const SALT_ROUNDS = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Issue a fresh access + refresh pair. The refresh token's `tv` (tokenVersion)
 * is bound to the user record, enabling global revocation via `bumpTokenVersion`.
 */
export function issueTokens(
  userId: string,
  role: Role,
  tokenVersion: number,
): IssuedTokens {
  const accessToken = signAccessToken({ sub: userId, role });
  const refreshToken = signRefreshToken({
    sub: userId,
    jti: randomUUID(),
    tv: tokenVersion,
  });
  return { accessToken, refreshToken };
}

/** Persist the refresh token on the client via httpOnly cookies. */
export async function setAuthCookies(tokens: IssuedTokens): Promise<void> {
  const jar = await cookies();
  const secure = process.env.AUTH_COOKIE_SECURE === "true";
  const sameSite =
    (process.env.AUTH_COOKIE_SAME_SITE as "lax" | "strict" | "none") ?? "lax";
  jar.set(ACCESS_COOKIE, tokens.accessToken, {
    httpOnly: true,
    secure,
    sameSite,
    path: "/",
    maxAge: 60 * 15, // 15m, matches access token lifetime
  });
  jar.set(REFRESH_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    secure,
    sameSite,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7d
  });
}

export async function clearAuthCookies(): Promise<void> {
  const jar = await cookies();
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
}

/** Invalidate every issued token for the user (global logout / password change). */
export async function bumpTokenVersion(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { tokenVersion: { increment: 1 } },
  });
}

// ---------------------------------------------------------------------------
// Request-bound helpers (used by route handlers / controllers).
// ---------------------------------------------------------------------------

function parseCookies(header: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k) out[k] = decodeURIComponent(v.join("="));
  }
  return out;
}

function getCookie(req: Request, name: string): string | undefined {
  return parseCookies(req.headers.get("cookie"))[name];
}

export function getAccessToken(req: Request): string | undefined {
  return getCookie(req, ACCESS_COOKIE);
}

export function getRefreshToken(req: Request): string | undefined {
  return getCookie(req, REFRESH_COOKIE);
}

/**
 * Validate the access token from the request. Throws UnauthorizedError if
 * missing/invalid. Returns the verified payload (sub, role).
 */
export function requireUser(req: Request): AccessTokenPayload {
  const token = getAccessToken(req);
  if (!token) throw new UnauthorizedError("Missing access token");
  try {
    return verifyAccessToken(token);
  } catch {
    throw new UnauthorizedError("Invalid or expired access token");
  }
}

/**
 * Ensure the authenticated user has one of the allowed roles.
 * Pass no roles to simply require authentication.
 */
export function requireRole(
  req: Request,
  roles: Role[] = [],
): AccessTokenPayload {
  const payload = requireUser(req);
  if (roles.length && !roles.includes(payload.role as Role)) {
    throw new UnauthorizedError("Insufficient permissions");
  }
  return payload;
}

/** Load the full user (safe fields) and verify it still exists. */
export async function loadUser(req: Request): Promise<User> {
  const { sub } = requireUser(req);
  const user = await prisma.user.findUnique({ where: { id: sub } });
  if (!user) throw new UnauthorizedError("User no longer exists");
  return user;
}

/**
 * Rotate a refresh token into a new pair, validating the tokenVersion.
 * Returns the user id and new tokens, or throws.
 */
export async function rotateRefreshToken(
  refreshToken: string,
): Promise<{ userId: string; role: Role; tokens: IssuedTokens }> {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new UnauthorizedError("Invalid refresh token");
  }
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, role: true, tokenVersion: true },
  });
  if (!user) throw new UnauthorizedError("User no longer exists");
  if (user.tokenVersion !== payload.tv) {
    throw new UnauthorizedError("Refresh token revoked");
  }
  const tokens = issueTokens(user.id, user.role, user.tokenVersion);
  return { userId: user.id, role: user.role, tokens };
}
