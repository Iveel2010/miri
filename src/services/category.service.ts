import { z } from "zod";
import { categoryRepository } from "@/repositories/category.repository";
import { uniqueSlug } from "@/utils/slug";
import { ConflictError, NotFoundError } from "@/lib/errors";

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
    return categoryRepository.create({ name: input.name, slug, icon: input.icon });
  },

  async update(id: string, input: Partial<z.infer<typeof categoryInputSchema>>) {
    const found = await categoryRepository.findById(id);
    if (!found) throw new NotFoundError("Category not found");
    const data: { name?: string; icon?: string | null } = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.icon !== undefined) data.icon = input.icon;
    return categoryRepository.update(id, data);
  },

  async remove(id: string) {
    const found = await categoryRepository.findById(id);
    if (!found) throw new NotFoundError("Category not found");
    return categoryRepository.remove(id);
  },
};
