import { z } from "zod";
import { artworkInputSchema } from "@/lib/schemas";
import { artworkRepository } from "@/repositories/artwork.repository";
import { categoryRepository } from "@/repositories/category.repository";
import { uniqueSlug } from "@/utils/slug";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import { trigger } from "@/lib/pusher";
import type { ArtworkStatus } from "@prisma/client";

export const artworkService = {
  async getByIdOrSlug(idOrSlug: string, incrementView = false) {
    const found = (await artworkRepository.findById(idOrSlug)) ??
      (await artworkRepository.findBySlug(idOrSlug));
    if (!found) throw new NotFoundError("Artwork not found");
    if (incrementView) await artworkRepository.incrementViews(found.id);
    return found;
  },

  async list(params: {
    page?: number;
    limit?: number;
    title?: string;
    categoryId?: string;
    medium?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: "newest" | "price_asc" | "price_desc" | "popular";
    includeUnpublished?: boolean;
    status?: ArtworkStatus;
    featured?: boolean;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 12;
    const { items, total } = await artworkRepository.search({
      skip: (page - 1) * limit,
      take: limit,
      title: params.title,
      categoryId: params.categoryId,
      medium: params.medium,
      minPrice: params.minPrice,
      maxPrice: params.maxPrice,
      sort: params.sort,
      includeUnpublished: params.includeUnpublished,
      status: params.status,
      featured: params.featured,
    });
    return { items, total, page, limit };
  },

  async listByArtist(artistId: string, page = 1, limit = 12) {
    return artworkRepository.listByArtist(artistId, {
      skip: (page - 1) * limit,
      take: limit,
    });
  },

  async create(artistId: string, input: z.infer<typeof artworkInputSchema>) {
    const slug = await uniqueSlug(input.title, (s) => artworkRepository.existsBySlug(s));

    let category = null;
    if (input.categoryId) {
      category = await categoryRepository.findById(input.categoryId);
    } else if (input.categoryName) {
      const trimmed = input.categoryName.trim();
      let existing = await categoryRepository.findByName(trimmed);
      if (!existing) {
        const slugified = `${trimmed
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")}-${Date.now().toString(36)}`;
        existing = await categoryRepository.create({
          name: trimmed,
          slug: slugified || `category-${Date.now().toString(36)}`,
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
      artist: { connect: { id: artistId } },
    });

    trigger("private-admin", "stats-update", {});
    return artwork;
  },

  async update(artworkId: string, actorId: string, input: Partial<z.infer<typeof artworkInputSchema>>, isAdmin = false) {
    const existing = await artworkRepository.findById(artworkId);
    if (!existing) throw new NotFoundError("Artwork not found");
    if (!isAdmin && existing.artistId !== actorId) {
      throw new ForbiddenError("You can only edit your own artwork");
    }

    const { categoryId, categoryName, ...rest } = input;
    const data: Record<string, unknown> = { ...rest };

    let category = existing.category;
    if (categoryId) {
      category = await categoryRepository.findById(categoryId);
    } else if (categoryName) {
      const trimmed = categoryName.trim();
      let found = await categoryRepository.findByName(trimmed);
      if (!found) {
        const slugified = `${trimmed
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")}-${Date.now().toString(36)}`;
        found = await categoryRepository.create({ name: trimmed, slug: slugified });
      }
      category = found;
    }

    if (category) data.category = { connect: { id: category.id } };
    else if (categoryId === null || categoryName === null) data.category = { disconnect: true };

    const artwork = await artworkRepository.update(artworkId, data);
    trigger("private-admin", "stats-update", {});
    return artwork;
  },

  async publish(artworkId: string, actorId: string, isAdmin = false) {
    const existing = await artworkRepository.findById(artworkId);
    if (!existing) throw new NotFoundError("Artwork not found");
    if (!isAdmin && existing.artistId !== actorId) {
      throw new ForbiddenError("You can only publish your own artwork");
    }
    const status: ArtworkStatus = "PENDING";
    const artwork = await artworkRepository.updateStatus(artworkId, status);
    trigger("private-admin", "stats-update", {});
    return artwork;
  },

  async saveDraft(artworkId: string, actorId: string, input: Partial<z.infer<typeof artworkInputSchema>>, isAdmin = false) {
    const existing = await artworkRepository.findById(artworkId);
    if (!existing) throw new NotFoundError("Artwork not found");
    if (!isAdmin && existing.artistId !== actorId) {
      throw new ForbiddenError("You can only edit your own artwork");
    }
    const artwork = await artworkRepository.update(artworkId, { ...input, status: "DRAFT" });
    trigger("private-admin", "stats-update", {});
    return artwork;
  },

  async remove(artworkId: string, actorId: string, isAdmin = false) {
    const existing = await artworkRepository.findById(artworkId);
    if (!existing) throw new NotFoundError("Artwork not found");
    if (!isAdmin && existing.artistId !== actorId) {
      throw new ForbiddenError("You can only delete your own artwork");
    }
    await artworkRepository.remove(artworkId);
    trigger("private-admin", "stats-update", {});
  },

  async topArtworks(limit = 10) {
    return artworkRepository.topArtworks(limit);
  },
};
