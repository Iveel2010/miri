import { parseJson } from "@/lib/http";
import { validate, num, buildMeta } from "@/lib/validation";
import { ApiResponse } from "@/lib/response";
import { requireRole } from "@/lib/auth";
import { contactService, contactInputSchema } from "@/services/contact.service";

export const contactController = {
  /** POST /api/contact — public. */
  async submit(req: Request) {
    const input = validate(contactInputSchema, await parseJson(req));
    const message = await contactService.submit(input);
    return ApiResponse.created(message, "Contact message received");
  },

  /** GET /api/admin/contact-messages — admin only. */
  async adminList(req: Request) {
    requireRole(req, ["ADMIN"]);
    const sp = new URL(req.url).searchParams;
    const page = num(sp.get("page"), 1);
    const limit = num(sp.get("limit"), 20);
    const result = await contactService.list(page, limit);
    return ApiResponse.ok({
      items: result.items,
      meta: buildMeta(result.meta.total, page, limit),
    });
  },
};
