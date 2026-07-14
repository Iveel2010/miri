import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const reviewInclude = {
  user: { select: { id: true, name: true, avatar: true } },
} satisfies Prisma.ReviewInclude;

export const reviewRepository = {
  async listByArtwork(artworkId: string, params: { skip?: number; take?: number }) {
    const where = { artworkId };
    const [items, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: reviewInclude,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.review.count({ where }),
    ]);
    return { items, total };
  },

  async findByUserAndArtwork(userId: string, artworkId: string) {
    return prisma.review.findUnique({ where: { userId_artworkId: { userId, artworkId } } });
  },

  async create(data: { userId: string; artworkId: string; rating: number; comment?: string | null }) {
    return prisma.review.create({ data, include: reviewInclude });
  },

  async upsert(
    where: { userId: string; artworkId: string },
    data: { rating: number; comment?: string | null },
  ) {
    return prisma.review.upsert({
      where: { userId_artworkId: where },
      create: { ...where, ...data },
      update: data,
      include: reviewInclude,
    });
  },

  async remove(userId: string, artworkId: string) {
    return prisma.review.delete({ where: { userId_artworkId: { userId, artworkId } } });
  },

  async averageRating(artworkId: string) {
    const agg = await prisma.review.aggregate({
      where: { artworkId },
      _avg: { rating: true },
      _count: { _all: true },
    });
    return { average: agg._avg.rating ?? 0, count: agg._count._all };
  },
};
