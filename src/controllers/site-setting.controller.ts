import { parseJson } from "@/lib/http";
import { validate } from "@/lib/validation";
import { ApiResponse } from "@/lib/response";
import { requireRole } from "@/lib/auth";
import { siteSettingService, siteSettingsSchema, heroSettingsSchema } from "@/services/site-setting.service";

export const siteSettingController = {
  /** GET /api/site-settings/hero */
  async getHero() {
    const data = await siteSettingService.getHero();
    return ApiResponse.ok(data);
  },

  /** PUT /api/site-settings/hero (admin only) */
  async updateHero(req: Request) {
    requireRole(req, ["ADMIN"]);
    const body = await parseJson(req);
    const input = validate(heroSettingsSchema, body);
    const updated = await siteSettingService.updateHero(input);
    return ApiResponse.ok(updated, 200, "Hero settings updated");
  },

  /** GET /api/site-settings */
  async getSite() {
    const data = await siteSettingService.getSite();
    return ApiResponse.ok(data);
  },

  /** PUT /api/site-settings (admin only) */
  async updateSite(req: Request) {
    requireRole(req, ["ADMIN"]);
    const body = await parseJson(req);
    const input = validate(siteSettingsSchema, body);
    const updated = await siteSettingService.updateSite(input);
    return ApiResponse.ok(updated, 200, "Site settings updated");
  },
};
