import { likeRepository } from "@/repositories/like.repository";
import { artworkRepository } from "@/repositories/artwork.repository";
import { NotFoundError } from "@/lib/errors";

export const likeService = {
  async toggle(userId: string, artworkId: string) {
    const artwork = await artworkRepository.findById(artworkId);
    if (!artwork) throw new NotFoundError("Artwork not found");

    const exists = await likeRepository.exists(userId, artworkId);
    if (exists) {
      await likeRepository.remove(userId, artworkId);
      await artworkRepository.incrementLikes(artworkId, -1);
      return { liked: false };
    }
    await likeRepository.add(userId, artworkId);
    await artworkRepository.incrementLikes(artworkId, 1);
    return { liked: true };
  },

  async isLiked(userId: string, artworkId: string) {
    return likeRepository.exists(userId, artworkId);
  },

  async count(artworkId: string) {
    return likeRepository.countByArtwork(artworkId);
  },
};
