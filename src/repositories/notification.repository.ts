import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const notificationRepository = {
  async list(userId: string, params: { skip?: number; take?: number; unreadOnly?: boolean }) {
    const where: Prisma.NotificationWhereInput = { userId };
    if (params.unreadOnly) where.read = false;
    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: "desc" },
      }),
      prisma.notification.count({ where }),
    ]);
    return { items, total };
  },

  async create(data: {
    userId: string;
    type: string;
    title: string;
    body?: string | null;
    relatedId?: string | null;
  }) {
    return prisma.notification.create({ data });
  },

  async markRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
  },

  async markAllRead(userId: string) {
    return prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
  },

  async unreadCount(userId: string) {
    return prisma.notification.count({ where: { userId, read: false } });
  },
};
