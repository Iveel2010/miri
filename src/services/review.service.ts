import { z } from "zod";
import { reviewRepository } from "@/repositories/review.repository";
import { artworkRepository } from "@/repositories/artwork.repository";
import { ForbiddenError, NotFoundError } from "@/lib/errors";

export const reviewInputSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export const reviewService = {
  async listByArtwork(artworkId: string, page = 1, limit = 12) {
    const result = await reviewRepository.listByArtwork(artworkId, { skip: (page - 1) * limit, take: limit });
    const stats = await reviewRepository.averageRating(artworkId);
    return { ...result, average: stats.average, count: stats.count };
  },

  async create(userId: string, artworkId: string, input: z.infer<typeof reviewInputSchema>) {
    const artwork = await artworkRepository.findById(artworkId);
    if (!artwork) throw new NotFoundError("Artwork not found");
    if (artwork.artistId === userId) {
      throw new ForbiddenError("Artists cannot review their own artwork");
    }
    const existing = await reviewRepository.findByUserAndArtwork(userId, artworkId);
    if (existing) {
      // Update existing review instead of duplicating.
      return reviewRepository.upsert({ userId, artworkId }, input);
    }
    return reviewRepository.create({ userId, artworkId, ...input });
  },

  async remove(userId: string, artworkId: string) {
    const existing = await reviewRepository.findByUserAndArtwork(userId, artworkId);
    if (!existing) throw new NotFoundError("Review not found");
    return reviewRepository.remove(userId, artworkId);
  },
};
