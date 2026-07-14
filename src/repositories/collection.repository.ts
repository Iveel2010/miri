import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const collectionInclude = {
  artworks: {
    include: { artwork: { include: { artist: { select: { id: true, name: true, avatar: true } } } } },
  },
  _count: { select: { artworks: true } },
} satisfies Prisma.CollectionInclude;

export const collectionRepository = {
  async findById(id: string) {
    return prisma.collection.findUnique({ where: { id }, include: collectionInclude });
  },

  async listByUser(userId: string) {
    return prisma.collection.findMany({
      where: { userId },
      include: collectionInclude,
      orderBy: { title: "asc" },
    });
  },

  async listAll() {
    return prisma.collection.findMany({
      include: collectionInclude,
      orderBy: { title: "asc" },
    });
  },

  async create(data: Prisma.CollectionCreateInput) {
    return prisma.collection.create({ data, include: collectionInclude });
  },

  async update(id: string, data: Prisma.CollectionUpdateInput) {
    return prisma.collection.update({ where: { id }, data, include: collectionInclude });
  },

  async addArtwork(collectionId: string, artworkId: string, position = 0) {
    return prisma.artworkCollection.upsert({
      where: { artworkId_collectionId: { artworkId, collectionId } },
      create: { collectionId, artworkId, position },
      update: { position },
    });
  },

  async removeArtwork(collectionId: string, artworkId: string) {
    return prisma.artworkCollection.delete({
      where: { artworkId_collectionId: { artworkId, collectionId } },
    });
  },

  async remove(id: string) {
    return prisma.collection.delete({ where: { id } });
  },
};
