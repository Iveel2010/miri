import { z } from "zod";
import { userRepository } from "@/repositories/user.repository";
import { hashPassword } from "@/lib/auth";
import { NotFoundError } from "@/lib/errors";

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
});

export const userService = {
  async getProfile(id: string) {
    const user = await userRepository.findById(id);
    if (!user) throw new NotFoundError("User not found");
    return user;
  },

  async updateProfile(id: string, data: z.infer<typeof updateProfileSchema>) {
    return userRepository.update(id, data);
  },

  async changePassword(id: string, current: string, next: string) {
    // Delegated password check lives in auth flow; here we just hash + store.
    const hashed = await hashPassword(next);
    return userRepository.update(id, { password: hashed });
  },

};
