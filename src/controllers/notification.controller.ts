import { ApiResponse } from "@/lib/response";
import { requireUser } from "@/lib/auth";
import { notificationService } from "@/services/notification.service";
import { num, buildMeta } from "@/lib/validation";

export const notificationController = {
  /** GET /api/notifications */
  async list(req: Request) {
    const { sub } = requireUser(req);
    const sp = new URL(req.url).searchParams;
    const result = await notificationService.list(sub, {
      page: num(sp.get("page"), 1),
      limit: num(sp.get("limit"), 20),
      unreadOnly: sp.get("unread") === "true",
    });
    return ApiResponse.paginated(result.items, buildMeta(result.total, num(sp.get("page"), 1), num(sp.get("limit"), 20)), 200);
  },

  /** PATCH /api/notifications/[id] */
  async markRead(req: Request, params: { id: string }) {
    const { sub } = requireUser(req);
    await notificationService.markRead(params.id, sub);
    return ApiResponse.ok({ read: true });
  },

  /** POST /api/notifications/read-all */
  async markAll(req: Request) {
    const { sub } = requireUser(req);
    await notificationService.markAllRead(sub);
    return ApiResponse.ok({ readAll: true });
  },
};
