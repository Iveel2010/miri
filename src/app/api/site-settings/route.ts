import { withHandler } from "@/lib/http";
import { siteSettingController } from "@/controllers/site-setting.controller";

/** GET /api/site-settings — public site content (logo, about, artist photo). */
export const GET = withHandler(() => siteSettingController.getSite());

/** PUT /api/site-settings — admin-only update of editable site content. */
export const PUT = withHandler((req) => siteSettingController.updateSite(req));
