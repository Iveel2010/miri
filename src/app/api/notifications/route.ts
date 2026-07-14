import { withHandler } from "@/lib/http";
import { notificationController } from "@/controllers/notification.controller";

export const runtime = 'nodejs';

export const GET = withHandler((req) => notificationController.list(req));
