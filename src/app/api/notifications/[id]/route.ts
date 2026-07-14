import { withHandler } from "@/lib/http";
import { notificationController } from "@/controllers/notification.controller";

export const PATCH = withHandler(async (req, ctx) => {
  const { id } = await (ctx as { params: Promise<{ id: string }> }).params;
  return notificationController.markRead(req, { id });
});
