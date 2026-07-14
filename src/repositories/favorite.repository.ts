import { prisma } from "@/lib/prisma";

export const favoriteRepository = {
  async exists(userId: string, artworkId: string) {
    const r = await prisma.favorite.findUnique({
      where: { userId_artworkId: { userId, artworkId } },
      select: { userId: true },
    });
    return Boolean(r);
  },

  async add(userId: string, artworkId: string) {
    return prisma.favorite.upsert({
      where: { userId_artworkId: { userId, artworkId } },
      create: { userId, artworkId },
      update: {},
    });
  },

  async remove(userId: string, artworkId: string) {
    return prisma.favorite.delete({
      where: { userId_artworkId: { userId, artworkId } },
    });
  },

  async listByUser(userId: string, params: { skip?: number; take?: number }) {
    const where = { userId };
    const [items, total] = await Promise.all([
      prisma.favorite.findMany({
        where,
        include: {
          artwork: {
            include: {
              artist: { select: { id: true, name: true, avatar: true } },
              category: { select: { id: true, name: true, slug: true } },
            },
          },
        },
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.favorite.count({ where }),
    ]);
    return { items, total };
  },

  async countByArtwork(artworkId: string) {
    return prisma.favorite.count({ where: { artworkId } });
  },
};
