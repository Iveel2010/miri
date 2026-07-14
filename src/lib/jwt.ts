import jwt, { type SignOptions } from "jsonwebtoken";

// ============================================================================
// JWT helpers. Access tokens are short-lived; refresh tokens carry a
// `jti` + `tokenVersion` so the server can revoke all sessions at once.
// ============================================================================

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? "dev-access-secret";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret";

const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES ?? "15m";
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES ?? "7d";

export interface AccessTokenPayload {
  sub: string; // user id
  role: string;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string; // unique token id
  tv: number; // user.tokenVersion at issue time
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES,
  } as SignOptions);
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES,
  } as SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, REFRESH_SECRET) as RefreshTokenPayload;
}

// Single-purpose token (email verification / password reset).
const TOKEN_SECRET = process.env.TOKEN_SECRET ?? "dev-purpose-token-secret";

export function signPurposeToken(
  purpose: string,
  sub: string,
  expiresIn = "1h",
): string {
  return jwt.sign({ purpose, sub }, TOKEN_SECRET, { expiresIn } as SignOptions);
}

export function verifyPurposeToken(
  purpose: string,
  token: string,
): { sub: string } {
  const decoded = jwt.verify(token, TOKEN_SECRET) as { purpose: string; sub: string };
  if (decoded.purpose !== purpose) {
    throw new Error("Invalid token purpose");
  }
  return { sub: decoded.sub };
}
