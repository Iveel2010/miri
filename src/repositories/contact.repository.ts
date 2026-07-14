import { prisma } from "@/lib/prisma";

export const contactRepository = {
  async create(data: { name: string; email: string; subject?: string; body: string }) {
    return prisma.contactMessage.create({
      data,
    });
  },

  async list(page = 1, limit = 20) {
    const [items, total] = await Promise.all([
      prisma.contactMessage.findMany({
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.contactMessage.count(),
    ]);
    return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit), hasNext: page * limit < total, hasPrev: page > 1 } };
  },
};
