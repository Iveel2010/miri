import { z } from "zod";
import { artworkInputSchema, artistContactSchema } from "@/lib/schemas";
import { categoryRepository } from "@/repositories/category.repository";
import { analyticsService } from "@/services/analytics.service";
import { artworkRepository } from "@/repositories/artwork.repository";
import { userRepository } from "@/repositories/user.repository";
import { uniqueSlug } from "@/utils/slug";
import { NotFoundError } from "@/lib/errors";
import { trigger } from "@/lib/pusher";
import type { ArtworkStatus, Role } from "@prisma/client";

export const adminService = {
  async getStats() {
    const totals = await analyticsService.dashboard();
    return {
      totals: totals.totals,
      revenue: totals.revenue,
      salesLast30: totals.salesLast30,
      revenueLast30: totals.revenueLast30,
      viewsLast30: totals.viewsLast30,
    };
  },

  async listArtworks(params: { page: number; limit: number; title?: string; status?: string }) {
    const skip = (params.page - 1) * params.limit;
    const where: Record<string, unknown> = {};
    if (params.title) {
      where.title = { contains: params.title, mode: "insensitive" };
    }
    if (params.status) {
      where.status = params.status;
    }

    const [searchResult, total] = await Promise.all([
      artworkRepository.search({
        skip,
        take: params.limit,
        title: params.title,
        status: params.status as ArtworkStatus | undefined,
        includeUnpublished: true,
        sort: "newest",
      }),
      artworkRepository.count(where),
    ]);

    return { items: searchResult.items, total };
  },

  async createArtwork(adminId: string, input: z.infer<typeof artworkInputSchema>) {
    const slug = await uniqueSlug(input.title, (s) => artworkRepository.existsBySlug(s));

    let category = null;
    if (input.categoryId) {
      category = await categoryRepository.findById(input.categoryId);
    } else if (input.categoryName) {
      const trimmed = input.categoryName.trim();
      let existing = await categoryRepository.findByName(trimmed);
      if (!existing) {
        const slugified = `${trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now().toString(36)}`;
        existing = await categoryRepository.create({
          name: trimmed,
          slug: slugified,
        });
      }
      category = existing;
    }

    const artwork = await artworkRepository.create({
      title: input.title,
      slug,
      description: input.description,
      image: input.image,
      images: input.images ?? [],
      price: input.price,
      category: category ? { connect: { id: category.id } } : undefined,
      medium: input.medium,
      width: input.width,
      height: input.height,
      year: input.year,
      status: (input.status as ArtworkStatus) ?? "DRAFT",
      artist: { connect: { id: adminId } },
    });

    trigger("private-admin", "stats-update", {});
    return artwork;
  },

  async getArtwork(id: string) {
    const artwork = await artworkRepository.findById(id);
    if (!artwork) throw new NotFoundError("Artwork not found");
    return artwork;
  },

  async updateArtwork(id: string, input: Partial<z.infer<typeof artworkInputSchema>>) {
    const existing = await artworkRepository.findById(id);
    if (!existing) throw new NotFoundError("Artwork not found");

    let category = existing.category;
    if (input.categoryId) {
      category = await categoryRepository.findById(input.categoryId);
    } else if (input.categoryName) {
      const trimmed = input.categoryName.trim();
      let existingCat = await categoryRepository.findByName(trimmed);
      if (!existingCat) {
        const slugified = `${trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now().toString(36)}`;
        existingCat = await categoryRepository.create({ name: trimmed, slug: slugified });
      }
      category = existingCat;
    }

    const { categoryId, categoryName, ...rest } = input;
    const data: Record<string, unknown> = { ...rest };
    if (category) data.category = { connect: { id: category.id } };
    else if (categoryId === null || categoryName === null) data.category = { disconnect: true };

    const artwork = await artworkRepository.update(id, data);
    trigger("private-admin", "stats-update", {});
    return artwork;
  },

  async deleteArtwork(id: string) {
    const existing = await artworkRepository.findById(id);
    if (!existing) throw new NotFoundError("Artwork not found");
    await artworkRepository.remove(id);
    trigger("private-admin", "stats-update", {});
  },

  async listArtists(params: { page: number; limit: number; search?: string; role?: Role }) {
    const skip = (params.page - 1) * params.limit;
    const where: Record<string, unknown> = {};
    if (params.role) where.role = params.role;
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { email: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const listResult = await userRepository.list({ ...params, skip, take: params.limit });
    return listResult;
  },

  async getArtist(id: string) {
    const artist = await userRepository.findById(id);
    if (!artist) throw new NotFoundError("Artist not found");
    return artist;
  },

  async updateArtistContact(id: string, input: z.infer<typeof artistContactSchema>) {
    const existing = await userRepository.findById(id);
    if (!existing) throw new NotFoundError("Artist not found");
    const artist = await userRepository.update(id, input as Record<string, unknown>);
    trigger("private-admin", "stats-update", {});
    return artist;
  },
};
