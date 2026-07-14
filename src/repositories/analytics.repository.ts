import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// Aggregations powering the analytics service / admin dashboard.
export const analyticsRepository = {
  async eventCount(type: string, since?: Date) {
    return prisma.analyticsEvent.count({
      where: { type, ...(since ? { createdAt: { gte: since } } : {}) },
    });
  },

  async eventCountByArtworkIds(type: string, artworkIds: string[], since?: Date) {
    return prisma.analyticsEvent.count({
      where: { type, artworkId: { in: artworkIds }, ...(since ? { createdAt: { gte: since } } : {}) },
    });
  },

  async track(type: string, data: { userId?: string; artworkId?: string; metadata?: Prisma.InputJsonValue }) {
    return prisma.analyticsEvent.create({
      data: { type, userId: data.userId, artworkId: data.artworkId, metadata: data.metadata },
    });
  },

  async revenue(since?: Date) {
    const agg = await prisma.order.aggregate({
      where: {
        status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] },
        ...(since ? { createdAt: { gte: since } } : {}),
      },
      _sum: { total: true },
    });
    return agg._sum.total ?? 0;
  },

  async salesCount(since?: Date) {
    return prisma.order.count({
      where: {
        status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] },
        ...(since ? { createdAt: { gte: since } } : {}),
      },
    });
  },

  async topArtists(limit = 5) {
    const artists = await prisma.user.findMany({
      where: { role: "ARTIST" },
      select: {
        id: true,
        name: true,
        avatar: true,
        _count: { select: { artworks: true } },
      },
      orderBy: { artworks: { _count: "desc" } },
      take: limit,
    });
    return artists;
  },

  async topArtworks(limit = 10) {
    return prisma.artwork.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ favoritesCount: "desc" }, { views: "desc" }],
      take: limit,
      include: { artist: { select: { id: true, name: true } } },
    });
  },

  async totals() {
    const [users, artists, artworks, orders, categories] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "ARTIST" } }),
      prisma.artwork.count(),
      prisma.order.count(),
      prisma.category.count(),
    ]);
    return { users, artists, artworks, orders, categories };
  },
};
