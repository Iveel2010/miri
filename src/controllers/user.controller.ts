import { parseJson } from "@/lib/http";
import { validate } from "@/lib/validation";
import { ApiResponse } from "@/lib/response";
import { requireUser } from "@/lib/auth";
import { userService, updateProfileSchema } from "@/services/user.service";
import { BadRequestError, ForbiddenError } from "@/lib/errors";

// ============================================================================
// User controllers — profile management.
// ============================================================================

export const userController = {
  /** GET /api/users/me */
  async me(req: Request) {
    const { sub } = requireUser(req);
    const user = await userService.getProfile(sub);
    return ApiResponse.ok(user);
  },

  /** PATCH /api/users/me */
  async updateMe(req: Request) {
    const { sub } = requireUser(req);
    const body = await parseJson(req);
    const input = validate(updateProfileSchema, body);
    const user = await userService.updateProfile(sub, input);
    return ApiResponse.ok(user, 200, "Profile updated");
  },

  /** POST /api/users/me/password  (current + new) */
  async changePassword(req: Request) {
    const { sub } = requireUser(req);
    const body = await parseJson<{ current: string; next: string }>(req);
    if (!body.current || !body.next) {
      throw new BadRequestError("Current and next password are required");
    }
    // Load the user with password to verify the current one.
    const { userRepository } = await import("@/repositories/user.repository");
    const current = await userRepository.findByEmail((await userRepository.findById(sub))!.email);
    if (!current) throw new ForbiddenError("User not found");
    const { verifyPassword } = await import("@/lib/auth");
    const ok = await verifyPassword(body.current, current.password);
    if (!ok) throw new BadRequestError("Current password is incorrect");
    await userService.changePassword(sub, body.current, body.next);
    return ApiResponse.ok({ changed: true }, 200, "Password changed");
  },
};
