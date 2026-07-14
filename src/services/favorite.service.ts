import { favoriteRepository } from "@/repositories/favorite.repository";
import { artworkRepository } from "@/repositories/artwork.repository";
import { notificationRepository } from "@/repositories/notification.repository";
import { NotFoundError } from "@/lib/errors";

export const favoriteService = {
  async list(userId: string, page = 1, limit = 12) {
    return favoriteRepository.listByUser(userId, { skip: (page - 1) * limit, take: limit });
  },

  async toggle(userId: string, artworkId: string) {
    const artwork = await artworkRepository.findById(artworkId);
    if (!artwork) throw new NotFoundError("Artwork not found");

    const exists = await favoriteRepository.exists(userId, artworkId);
    if (exists) {
      await favoriteRepository.remove(userId, artworkId);
      await artworkRepository.incrementFavorites(artworkId, -1);
      return { favorited: false };
    }
    await favoriteRepository.add(userId, artworkId);
    await artworkRepository.incrementFavorites(artworkId, 1);
    await notificationRepository.create({
      userId: artwork.artistId,
      type: "NEW_FAVORITE",
      title: "New favorite",
      body: `Someone favorited "${artwork.title}".`,
      relatedId: artworkId,
    });
    return { favorited: true };
  },

  async isFavorited(userId: string, artworkId: string) {
    return favoriteRepository.exists(userId, artworkId);
  },
};
