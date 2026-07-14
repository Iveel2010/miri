import { withHandler } from "@/lib/http";
import { analyticsController } from "@/controllers/analytics.controller";

export const POST = withHandler((req) => analyticsController.track(req));
