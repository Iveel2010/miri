import { artworkRepository } from "@/repositories/artwork.repository";
import { analyticsRepository } from "@/repositories/analytics.repository";
import { csv } from "@/lib/validation";

// ============================================================================
// Search service — composes the artwork repository's filter/sort with
// analytics event tracking. Supports title, artist, category, medium, price,
// newest and popularity ordering.
// ============================================================================

export interface SearchParams {
  q?: string | null;
  artist?: string | null; // artist id(s), comma-separated
  category?: string | null; // category id(s)
  medium?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  sort?: "newest" | "price_asc" | "price_desc" | "popular";
  page?: number;
  limit?: number;
  userId?: string;
}

export const searchService = {
  async search(params: SearchParams) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 12;
    const artistIds = csv(params.artist);
    const categoryIds = csv(params.category);

    // For multi-id filters we resolve the first id to keep the query simple;
    // extend the repository to accept arrays if multiple selections are needed.
    const result = await artworkRepository.search({
      skip: (page - 1) * limit,
      take: limit,
      title: params.q ?? undefined,
      artistId: artistIds[0],
      categoryId: categoryIds[0],
      medium: params.medium ?? undefined,
      minPrice: params.minPrice ?? undefined,
      maxPrice: params.maxPrice ?? undefined,
      sort: params.sort,
    });

    if (params.q) {
      await analyticsRepository.track("SEARCH", {
        userId: params.userId,
        metadata: { q: params.q, total: result.total },
      });
    }

    return { ...result, page, limit };
  },
};
