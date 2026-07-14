import { userRepository } from "@/repositories/user.repository";
import { NotFoundError } from "@/lib/errors";

// ============================================================================
// Artist public profile service. Builds the view returned by
// GET /api/artists/:id — phone/email are intentionally omitted unless the
// artist enabled their visibility toggle. Social links are always shown when
// present (no toggle for them in the MVP dashboard).
// ============================================================================

export const artistService = {
  async getPublicProfile(id: string) {
    const user = await userRepository.findByIdWithContact(id);
    if (!user) throw new NotFoundError("Artist not found");

    return {
      id: user.id,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      verified: user.verified,
      bio: user.bio,
      location: user.location,
      responseTime: user.responseTime,
      preferredContactMethod: user.preferredContactMethod,
      phone: user.showPhone ? user.phone : null,
      email: user.showEmail ? user.email : null,
      whatsapp: user.whatsapp,
      telegram: user.telegram,
      facebook: user.facebook,
      instagram: user.instagram,
      _count: user._count,
    };
  },
};
