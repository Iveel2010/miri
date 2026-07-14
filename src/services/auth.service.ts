import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { userRepository } from "@/repositories/user.repository";
import {
  hashPassword,
  verifyPassword,
  issueTokens,
  setAuthCookies,
  clearAuthCookies,
  bumpTokenVersion,
  rotateRefreshToken,
  getRefreshToken,
} from "@/lib/auth";
import { signPurposeToken, verifyPurposeToken } from "@/lib/jwt";
import { emailService } from "./email.service";
import { ConflictError, NotFoundError, UnauthorizedError } from "@/lib/errors";
import type { Role } from "@prisma/client";

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

export const registerSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  // Public registration is open to CUSTOMER / ARTIST only. ADMIN accounts can
  // only be created through the secret adminRegister flow (see adminRegisterSchema).
  role: z.enum(["ARTIST", "CUSTOMER"]).default("CUSTOMER"),
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
});

/**
 * Secret admin registration. Requires a matching ADMIN_INVITE_CODE so only the
 * person holding the secret can mint admin (or any) accounts. Not advertised
 * anywhere in the UI — reachable only at the hidden /admin/register route.
 */
export const adminRegisterSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(["ADMIN", "ARTIST", "CUSTOMER"]).default("ADMIN"),
  inviteCode: z.string().min(1),
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({ email: z.string().email() });
export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});

export interface AuthResult {
  user: Awaited<ReturnType<typeof userRepository.findById>>;
  tokens: { accessToken: string; refreshToken: string };
}

export const authService = {
  /** Register a new user, issue tokens, send verification email. */
  async register(input: z.infer<typeof registerSchema>): Promise<AuthResult> {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) throw new ConflictError("Email already registered");

    const password = await hashPassword(input.password);
    const user = await userRepository.create({
      name: input.name,
      email: input.email,
      password,
      role: input.role as Role,
      bio: input.bio ?? null,
      avatar: input.avatar ?? null,
    });

    const verifyToken = signPurposeToken("verify", user!.id, process.env.VERIFY_TOKEN_EXPIRES ?? "24h");
    await userRepository.setVerification(user!.id, verifyToken);
    await emailService.sendVerification(input.email, verifyToken);

    const full = await prisma.user.findUnique({ where: { id: user!.id } });
    const tokens = issueTokens(full!.id, full!.role, full!.tokenVersion);
    await setAuthCookies(tokens);

    return { user, tokens };
  },

  /** Secret, invite-code-gated registration for admin (and other) accounts. */
  async adminRegister(input: z.infer<typeof adminRegisterSchema>): Promise<AuthResult> {
    const expected = process.env.ADMIN_INVITE_CODE;
    if (!expected || input.inviteCode !== expected) {
      throw new UnauthorizedError("Invalid admin invite code");
    }

    const existing = await userRepository.findByEmail(input.email);
    if (existing) throw new ConflictError("Email already registered");

    const password = await hashPassword(input.password);
    // Admin accounts are auto-verified so they can log in immediately.
    const user = await userRepository.create({
      name: input.name,
      email: input.email,
      password,
      role: input.role as Role,
      bio: input.bio ?? null,
      avatar: input.avatar ?? null,
      emailVerified: true,
    });

    const full = await prisma.user.findUnique({ where: { id: user!.id } });
    const tokens = issueTokens(full!.id, full!.role, full!.tokenVersion);
    await setAuthCookies(tokens);

    return { user, tokens };
  },

  /** Authenticate and start a session. */
  async login(input: z.infer<typeof loginSchema>): Promise<AuthResult> {
    const user = await userRepository.findByEmail(input.email);
    if (!user) throw new UnauthorizedError("Invalid credentials");
    const okPw = await verifyPassword(input.password, user.password);
    if (!okPw) throw new UnauthorizedError("Invalid credentials");

    const tokens = issueTokens(user.id, user.role, user.tokenVersion);
    await setAuthCookies(tokens);

    const safe = await userRepository.findById(user.id);
    return { user: safe, tokens };
  },

  /** Logout: clear auth cookies. Controllers additionally call `revokeAll` */
  async logout(): Promise<void> {
    await clearAuthCookies();
  },

  /** Revoke all sessions for a user (global logout / password change). */
  async revokeAll(userId: string): Promise<void> {
    await bumpTokenVersion(userId);
    await clearAuthCookies();
  },

  /** Rotate a refresh token into a fresh pair and persist cookies. */
  async refresh(req: Request): Promise<AuthResult> {
    const refresh = getRefreshToken(req);
    if (!refresh) throw new UnauthorizedError("Missing refresh token");
    const { userId, role, tokens } = await rotateRefreshToken(refresh);
    await setAuthCookies(tokens);
    const user = await userRepository.findById(userId);
    void role;
    return { user, tokens };
  },

  /** Verify email using the purpose token. */
  async verifyEmail(token: string): Promise<void> {
    let sub: string;
    try {
      ({ sub } = verifyPurposeToken("verify", token));
    } catch {
      throw new UnauthorizedError("Invalid or expired verification token");
    }
    const user = await userRepository.findById(sub);
    if (!user) throw new NotFoundError("User not found");
    await userRepository.markVerified(sub);
  },

  async resendVerification(email: string): Promise<void> {
    const user = await userRepository.findByEmail(email);
    if (!user) throw new NotFoundError("User not found");
    if (user.emailVerified) return;
    const token = signPurposeToken("verify", user.id, process.env.VERIFY_TOKEN_EXPIRES ?? "24h");
    await userRepository.setVerification(user.id, token);
    await emailService.sendVerification(email, token);
  },

  /** Generate a password-reset token and email it. Never reveals if user exists. */
  async forgotPassword(email: string): Promise<void> {
    const user = await userRepository.findByEmail(email);
    if (!user) return; // do not leak account existence
    const token = signPurposeToken("reset", user.id, process.env.RESET_TOKEN_EXPIRES ?? "1h");
    const expires = new Date(Date.now() + 60 * 60 * 1000);
    await userRepository.setResetToken(user.id, token, expires);
    await emailService.sendPasswordReset(email, token);
  },

  /** Reset password using the purpose token, then revoke all sessions. */
  async resetPassword(token: string, password: string): Promise<void> {
    let sub: string;
    try {
      ({ sub } = verifyPurposeToken("reset", token));
    } catch {
      throw new UnauthorizedError("Invalid or expired reset token");
    }
    const user = await userRepository.findByResetToken(token);
    if (!user || user.resetTokenExpires === null || user.resetTokenExpires < new Date()) {
      throw new UnauthorizedError("Invalid or expired reset token");
    }
    const hashed = await hashPassword(password);
    await userRepository.update(sub, { password: hashed });
    await userRepository.clearResetToken(sub);
    await bumpTokenVersion(sub); // revoke existing sessions
  },
};
