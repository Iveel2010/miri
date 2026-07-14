import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const categoryRepository = {
  async findAll() {
    return prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { artworks: true } } },
    });
  },

  async findById(id: string) {
    return prisma.category.findUnique({ where: { id } });
  },

  async findBySlug(slug: string) {
    return prisma.category.findUnique({ where: { slug } });
  },

  async findByName(name: string) {
    return prisma.category.findFirst({ where: { name } });
  },

  existsBySlug(slug: string) {
    return prisma.category
      .findUnique({ where: { slug }, select: { id: true } })
      .then((r) => Boolean(r));
  },

  async create(data: { name: string; slug: string; icon?: string }) {
    return prisma.category.create({ data });
  },

  async update(id: string, data: Prisma.CategoryUpdateInput) {
    return prisma.category.update({ where: { id }, data });
  },

  async remove(id: string) {
    return prisma.category.delete({ where: { id } });
  },
};
