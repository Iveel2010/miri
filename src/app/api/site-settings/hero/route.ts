import { withHandler } from "@/lib/http";
import { siteSettingController } from "@/controllers/site-setting.controller";

/** GET /api/site-settings/hero */
export const GET = withHandler(() => siteSettingController.getHero());

/** PUT /api/site-settings/hero — admin-only update of hero content. */
export const PUT = withHandler((req) => siteSettingController.updateHero(req));
