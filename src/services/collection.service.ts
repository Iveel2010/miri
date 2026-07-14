import { z } from "zod";
import { collectionRepository } from "@/repositories/collection.repository";
import { uniqueSlug } from "@/utils/slug";
import { ForbiddenError, NotFoundError } from "@/lib/errors";

export const collectionInputSchema = z.object({
  title: z.string().min(2).max(160),
  description: z.string().max(1000).optional(),
  coverImage: z.string().url().optional(),
});

export const collectionService = {
  async listByUser(userId: string) {
    return collectionRepository.listByUser(userId);
  },

  /** Public storefront list of all curated collections. */
  async listAll() {
    return collectionRepository.listAll();
  },

  async getById(id: string, userId: string) {
    const found = await collectionRepository.findById(id);
    if (!found) throw new NotFoundError("Collection not found");
    if (found.userId !== userId) throw new ForbiddenError("Not your collection");
    return found;
  },

  async create(userId: string, input: z.infer<typeof collectionInputSchema>) {
    const slug = await uniqueSlug(input.title, async (s) => {
      const c = await collectionRepository.listByUser(userId);
      return c.some((x) => x.slug === s);
    });
    return collectionRepository.create({
      title: input.title,
      slug,
      description: input.description,
      coverImage: input.coverImage,
      user: { connect: { id: userId } },
    });
  },

  async update(id: string, userId: string, input: z.infer<typeof collectionInputSchema>) {
    const found = await collectionRepository.findById(id);
    if (!found) throw new NotFoundError("Collection not found");
    if (found.userId !== userId) throw new ForbiddenError("Not your collection");
    return collectionRepository.update(id, input);
  },

  async addArtwork(id: string, userId: string, artworkId: string, position = 0) {
    const found = await collectionRepository.findById(id);
    if (!found) throw new NotFoundError("Collection not found");
    if (found.userId !== userId) throw new ForbiddenError("Not your collection");
    return collectionRepository.addArtwork(id, artworkId, position);
  },

  async removeArtwork(id: string, userId: string, artworkId: string) {
    const found = await collectionRepository.findById(id);
    if (!found) throw new NotFoundError("Collection not found");
    if (found.userId !== userId) throw new ForbiddenError("Not your collection");
    return collectionRepository.removeArtwork(id, artworkId);
  },

  async remove(id: string, userId: string) {
    const found = await collectionRepository.findById(id);
    if (!found) throw new NotFoundError("Collection not found");
    if (found.userId !== userId) throw new ForbiddenError("Not your collection");
    return collectionRepository.remove(id);
  },
};
