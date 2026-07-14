import type { Prisma } from "@prisma/client";
import { analyticsRepository } from "@/repositories/analytics.repository";
import { artworkRepository } from "@/repositories/artwork.repository";
import { orderRepository } from "@/repositories/order.repository";
import { BadRequestError } from "@/lib/errors";

// ============================================================================
// Analytics service — aggregates for the admin dashboard and artist analytics.
// ============================================================================

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

export const analyticsService = {
  async dashboard() {
    const totals = await analyticsRepository.totals();
    const [revenue, sales30, revenue30, views] = await Promise.all([
      analyticsRepository.revenue(),
      analyticsRepository.salesCount(),
      analyticsRepository.revenue(daysAgo(30)),
      analyticsRepository.eventCount("VIEW_ARTWORK", daysAgo(30)),
    ]);
    const [topArtists, topArtworks] = await Promise.all([
      analyticsRepository.topArtists(5),
      analyticsRepository.topArtworks(10),
    ]);
    return {
      totals,
      revenue,
      salesLast30: sales30,
      revenueLast30: revenue30,
      viewsLast30: views,
      topArtists,
      topArtworks,
    };
  },

  /** Record a client-initiated analytics event (view, visit, favorite, …). */
  async track(input: {
    type: string;
    userId?: string;
    artworkId?: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    if (input.artworkId && !(await artworkRepository.exists(input.artworkId))) {
      throw new BadRequestError("Referenced artwork does not exist");
    }
    return analyticsRepository.track(input.type, {
      userId: input.userId,
      artworkId: input.artworkId,
      metadata: input.metadata,
    });
  },

  /** Per-artist analytics: their artworks, sales and views. */
  async forArtist(artistId: string) {
    const artistArtworkIds = await artworkRepository.findIdsByArtist(artistId);
    const artworks = artistArtworkIds.length;

    const days30 = daysAgo(30);
    const [viewsLast30, revenueLast30, totalSalesValue] = await Promise.all([
      artistArtworkIds.length
        ? analyticsRepository.eventCountByArtworkIds("VIEW_ARTWORK", artistArtworkIds, days30)
        : 0,
      artistArtworkIds.length
        ? orderRepository.revenueSumByArtworkIds(artistArtworkIds)
        : 0,
      artistArtworkIds.length
        ? orderRepository.salesCountByArtworkIds(artistArtworkIds)
        : 0,
    ]);

    return {
      artworks,
      viewsLast30,
      revenueLast30,
      totalSalesValue,
    };
  },
};
