import { parseJson } from "@/lib/http";
import { validate } from "@/lib/validation";
import { ApiResponse } from "@/lib/response";
import { requireUser, getRefreshToken, getAccessToken } from "@/lib/auth";
import { verifyAccessToken } from "@/lib/jwt";
import { authService, registerSchema, adminRegisterSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "@/services/auth.service";
import { userRepository } from "@/repositories/user.repository";

// ============================================================================
// Auth controllers — register / login / logout / refresh / me / password.
// Cookies are set inside the service layer (next/headers) and attached to the
// outgoing response automatically by the App Router.
// ============================================================================

export const authController = {
  /** Register a new user, issue tokens, send verification email. */
  async register(req: Request) {
    const body = await parseJson(req);
    const input = validate(registerSchema, body);
    const { user } = await authService.register(input);
    return ApiResponse.created(user, "Registration successful. Check your email to verify.");
  },

  /** Secret admin registration — requires a valid ADMIN_INVITE_CODE. */
  async adminRegister(req: Request) {
    const body = await parseJson(req);
    const input = validate(adminRegisterSchema, body);
    const { user } = await authService.adminRegister(input);
    return ApiResponse.created(user, "Admin account created");
  },

  async login(req: Request) {
    const body = await parseJson(req);
    const input = validate(loginSchema, body);
    const { user } = await authService.login(input);
    return ApiResponse.ok(user, 200, "Logged in");
  },

  async logout(req: Request) {
    let userId: string | undefined;
    try {
      const token = getAccessToken(req);
      if (token) {
        const payload = verifyAccessToken(token);
        userId = payload.sub;
      }
    } catch {
      // ignore invalid/expired access token so logout still clears cookies
    }

    if (userId) {
      await authService.revokeAll(userId);
    } else {
      await authService.logout();
    }

    return ApiResponse.ok({ loggedOut: true }, 200, "Logged out");
  },

  async refresh(req: Request) {
    const token = getRefreshToken(req);
    if (!token) return ApiResponse.fail("Missing refresh token", 401, "UNAUTHORIZED");
    const { user } = await authService.refresh(req);
    return ApiResponse.ok(user, 200, "Token refreshed");
  },

  async me(req: Request) {
    const { sub } = requireUser(req);
    const profile = await userRepository.findById(sub);
    if (!profile) return ApiResponse.fail("User not found", 404, "NOT_FOUND");
    return ApiResponse.ok(profile);
  },

  async verifyEmail(req: Request) {
    const token = new URL(req.url).searchParams.get("token");
    if (!token) return ApiResponse.fail("Missing token", 400, "BAD_REQUEST");
    await authService.verifyEmail(token);
    return ApiResponse.ok({ verified: true }, 200, "Email verified");
  },

  async resendVerification(req: Request) {
    const body = await parseJson(req);
    const { email } = validate(forgotPasswordSchema, body);
    await authService.resendVerification(email);
    return ApiResponse.ok({ sent: true }, 200, "Verification email sent");
  },

  async forgotPassword(req: Request) {
    const body = await parseJson(req);
    const { email } = validate(forgotPasswordSchema, body);
    await authService.forgotPassword(email);
    return ApiResponse.ok({ sent: true }, 200, "If the account exists, a reset link was sent");
  },

  async resetPassword(req: Request) {
    const body = await parseJson(req);
    const { token, password } = validate(resetPasswordSchema, body);
    await authService.resetPassword(token, password);
    return ApiResponse.ok({ reset: true }, 200, "Password reset successful");
  },
};
