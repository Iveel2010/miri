import { z } from "zod";
import { categoryRepository } from "@/repositories/category.repository";
import { uniqueSlug } from "@/utils/slug";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { trigger } from "@/lib/pusher";

export const categoryInputSchema = z.object({
  name: z.string().min(2).max(60),
  icon: z.string().max(10).optional(),
});

export const categoryService = {
  async list() {
    return categoryRepository.findAll();
  },

  async create(input: z.infer<typeof categoryInputSchema>) {
    const slug = await uniqueSlug(input.name, (s) => categoryRepository.existsBySlug(s));
    const existing = await categoryRepository.findBySlug(slug);
    if (existing) throw new ConflictError("Category already exists");
    const category = await categoryRepository.create({ name: input.name, slug, icon: input.icon });
    trigger("private-admin", "stats-update", {});
    return category;
  },

  async update(id: string, input: Partial<z.infer<typeof categoryInputSchema>>) {
    const found = await categoryRepository.findById(id);
    if (!found) throw new NotFoundError("Category not found");
    const data: { name?: string; icon?: string | null } = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.icon !== undefined) data.icon = input.icon;
    const category = await categoryRepository.update(id, data);
    trigger("private-admin", "stats-update", {});
    return category;
  },

  async remove(id: string) {
    const found = await categoryRepository.findById(id);
    if (!found) throw new NotFoundError("Category not found");
    await categoryRepository.remove(id);
    trigger("private-admin", "stats-update", {});
  },
};
