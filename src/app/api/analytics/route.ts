import { withHandler } from "@/lib/http";
import { analyticsController } from "@/controllers/analytics.controller";

export const GET = withHandler((req) => analyticsController.forArtist(req));
