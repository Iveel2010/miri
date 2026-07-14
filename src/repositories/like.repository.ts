import { prisma } from "@/lib/prisma";

export const likeRepository = {
  async exists(userId: string, artworkId: string) {
    const r = await prisma.like.findUnique({
      where: { userId_artworkId: { userId, artworkId } },
      select: { userId: true },
    });
    return Boolean(r);
  },

  async add(userId: string, artworkId: string) {
    return prisma.like.upsert({
      where: { userId_artworkId: { userId, artworkId } },
      create: { userId, artworkId },
      update: {},
    });
  },

  async remove(userId: string, artworkId: string) {
    return prisma.like.delete({ where: { userId_artworkId: { userId, artworkId } } });
  },

  async countByArtwork(artworkId: string) {
    return prisma.like.count({ where: { artworkId } });
  },
};
