import { notificationRepository } from "@/repositories/notification.repository";
import { ForbiddenError } from "@/lib/errors";

export const notificationService = {
  async list(userId: string, params: { page?: number; limit?: number; unreadOnly?: boolean }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const result = await notificationRepository.list(userId, {
      skip: (page - 1) * limit,
      take: limit,
      unreadOnly: params.unreadOnly,
    });
    const unread = await notificationRepository.unreadCount(userId);
    return { ...result, unread };
  },

  async markRead(id: string, userId: string) {
    const res = await notificationRepository.markRead(id, userId);
    if (res.count === 0) throw new ForbiddenError("Notification not accessible");
    return res;
  },

  async markAllRead(userId: string) {
    return notificationRepository.markAllRead(userId);
  },
};
