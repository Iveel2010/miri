import { prisma } from "@/lib/prisma";
import type { Prisma, OrderStatus } from "@prisma/client";

const orderInclude = {
  items: true,
  user: { select: { id: true, name: true, email: true, avatar: true } },
} satisfies Prisma.OrderInclude;

export const orderRepository = {
  async findById(id: string) {
    return prisma.order.findUnique({ where: { id }, include: orderInclude });
  },

  async findByUser(userId: string, params: { skip?: number; take?: number }) {
    const where = { userId };
    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: orderInclude,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.order.count({ where }),
    ]);
    return { items, total };
  },

  async list(params: {
    skip?: number;
    take?: number;
    status?: OrderStatus;
    search?: string;
  }) {
    const where: Prisma.OrderWhereInput = {};
    if (params.status) where.status = params.status;
    if (params.search) {
      where.user = {
        OR: [
          { name: { contains: params.search, mode: "insensitive" } },
          { email: { contains: params.search, mode: "insensitive" } },
        ],
      };
    }
    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: orderInclude,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.order.count({ where }),
    ]);
    return { items, total };
  },

  async create(data: {
    userId: string;
    total: number;
    items: Array<{ artworkId: string; title: string; image?: string | null; price: number; quantity?: number }>;
    shippingAddress?: string | null;
    paymentRef?: string | null;
  }) {
    return prisma.order.create({
      data: {
        userId: data.userId,
        total: data.total,
        shippingAddress: data.shippingAddress,
        paymentRef: data.paymentRef,
        items: { create: data.items.map((i) => ({ ...i, quantity: i.quantity ?? 1 })) },
      },
      include: orderInclude,
    });
  },

  async update(id: string, data: Prisma.OrderUpdateInput) {
    return prisma.order.update({ where: { id }, data, include: orderInclude });
  },

  async count(where: Prisma.OrderWhereInput = {}) {
    return prisma.order.count({ where });
  },

  async revenueSum(where: Prisma.OrderWhereInput = {}) {
    const agg = await prisma.order.aggregate({ where, _sum: { total: true } });
    return agg._sum.total ?? 0;
  },

  async revenueSumByArtworkIds(artworkIds: string[]) {
    const items = await prisma.orderItem.findMany({
      where: {
        artworkId: { in: artworkIds },
        order: { status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] } },
      },
      select: { price: true, quantity: true },
    });
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },

  async salesCountByArtworkIds(artworkIds: string[]) {
    const count = await prisma.orderItem.count({
      where: {
        artworkId: { in: artworkIds },
        order: { status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] } },
      },
    });
    return count;
  },
};
