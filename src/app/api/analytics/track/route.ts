import { withHandler } from "@/lib/http";
import { analyticsController } from "@/controllers/analytics.controller";

export const runtime = 'nodejs';

export const POST = withHandler((req) => analyticsController.track(req));
