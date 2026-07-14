import { prisma } from "@/lib/prisma";
import type { Prisma, ArtworkStatus } from "@prisma/client";

const artworkInclude = {
  artist: { select: { id: true, name: true, avatar: true, role: true } },
  category: { select: { id: true, name: true, slug: true, icon: true } },
  _count: { select: { favorites: true, likes: true, reviews: true } },
} satisfies Prisma.ArtworkInclude;

export const artworkRepository = {
  async findById(id: string) {
    return prisma.artwork.findUnique({ where: { id }, include: artworkInclude });
  },

  async findBySlug(slug: string) {
    return prisma.artwork.findUnique({ where: { slug }, include: artworkInclude });
  },

  /** Used during slug uniqueness checks. */
  existsBySlug(slug: string) {
    return prisma.artwork
      .findUnique({ where: { slug }, select: { id: true } })
      .then((r) => Boolean(r));
  },

  /** Cheap existence probe by id (used to validate analytics event references). */
  exists(id: string) {
    return prisma.artwork
      .findUnique({ where: { id }, select: { id: true } })
      .then((r) => Boolean(r));
  },

  async create(data: Prisma.ArtworkCreateInput) {
    return prisma.artwork.create({ data, include: artworkInclude });
  },

  async update(id: string, data: Prisma.ArtworkUpdateInput) {
    return prisma.artwork.update({ where: { id }, data, include: artworkInclude });
  },

  async updateStatus(id: string, status: Prisma.ArtworkUpdateInput["status"]) {
    return prisma.artwork.update({ where: { id }, data: { status } });
  },

  async incrementViews(id: string, by = 1) {
    return prisma.artwork.update({
      where: { id },
      data: { views: { increment: by } },
    });
  },

  async remove(id: string) {
    return prisma.artwork.delete({ where: { id } });
  },

  /**
   * Search / filter / sort artworks. Supports title, artist, category, medium,
   * price range, newest and popularity ordering.
   */
  async search(params: {
    skip?: number;
    take?: number;
    title?: string;
    artistId?: string;
    categoryId?: string;
    medium?: string;
    minPrice?: number;
    maxPrice?: number;
    status?: ArtworkStatus;
    featured?: boolean;
    sort?: "newest" | "price_asc" | "price_desc" | "popular";
    includeUnpublished?: boolean;
  }) {
    const skip = Math.max(0, params.skip ?? 0);
    const where: Prisma.ArtworkWhereInput = {};
    if (params.title) {
      where.title = { contains: params.title, mode: "insensitive" };
    }
    if (params.artistId) where.artistId = params.artistId;
    if (params.categoryId) where.categoryId = params.categoryId;
    if (params.medium) where.medium = { contains: params.medium, mode: "insensitive" };
    if (params.minPrice !== undefined || params.maxPrice !== undefined) {
      where.price = { gte: params.minPrice, lte: params.maxPrice };
    }
    if (params.featured !== undefined) {
      where.isFeatured = params.featured;
    }
    if (params.status) {
      where.status = params.status;
    } else if (!params.includeUnpublished) {
      where.status = "PUBLISHED";
    }

    const orderBy: Prisma.ArtworkOrderByWithRelationInput | Prisma.ArtworkOrderByWithRelationInput[] =
      params.sort === "price_asc"
        ? { price: "asc" }
        : params.sort === "price_desc"
          ? { price: "desc" }
          : params.sort === "popular"
            ? [{ favoritesCount: "desc" }, { likesCount: "desc" }]
            : { createdAt: "desc" };

    const [items, total] = await Promise.all([
      prisma.artwork.findMany({
        where,
        include: artworkInclude,
        skip,
        take: params.take,
        orderBy,
      }),
      prisma.artwork.count({ where }),
    ]);
    return { items, total };
  },

  async listByArtist(artistId: string, params: { skip?: number; take?: number }) {
    const where = { artistId };
    const skip = Math.max(0, params.skip ?? 0);
    const [items, total] = await Promise.all([
      prisma.artwork.findMany({
        where,
        include: artworkInclude,
        skip,
        take: params.take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.artwork.count({ where }),
    ]);
    return { items, total };
  },

  async findIdsByArtist(artistId: string): Promise<string[]> {
    const items = await prisma.artwork.findMany({
      where: { artistId },
      select: { id: true },
    });
    return items.map((i) => i.id);
  },

  async markSold(id: string) {
    return prisma.artwork.update({ where: { id }, data: { status: "SOLD" } });
  },

  async incrementFavorites(id: string, by = 1) {
    return prisma.artwork.update({
      where: { id },
      data: { favoritesCount: { increment: by } },
    });
  },

  async incrementLikes(id: string, by = 1) {
    return prisma.artwork.update({
      where: { id },
      data: { likesCount: { increment: by } },
    });
  },

  async topArtworks(limit = 10) {
    return prisma.artwork.findMany({
      where: { status: "PUBLISHED" },
      include: artworkInclude,
      orderBy: [{ favoritesCount: "desc" }, { views: "desc" }],
      take: limit,
    });
  },

  async count(where: Prisma.ArtworkWhereInput = {}) {
    return prisma.artwork.count({ where });
  },
};
