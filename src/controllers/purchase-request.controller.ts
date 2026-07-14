import { parseJson } from "@/lib/http";
import { validate } from "@/lib/validation";
import { requireUser } from "@/lib/auth";
import { ApiResponse } from "@/lib/response";
import { purchaseRequestService, purchaseRequestInputSchema } from "@/services/purchase-request.service";
import { num, buildMeta } from "@/lib/validation";

export const purchaseRequestController = {
  async submit(req: Request, params: { id: string }) {
    const input = validate(purchaseRequestInputSchema, await parseJson(req));
    const request = await purchaseRequestService.submit(params.id, input);
    return ApiResponse.created(request, "Purchase request submitted");
  },

  async list(req: Request) {
    requireUser(req);
    const sp = new URL(req.url).searchParams;
    const page = num(sp.get("page"), 1);
    const limit = num(sp.get("limit"), 20);
    const status = sp.get("status") as "NEW" | "CONTACTED" | "RESERVED" | "SOLD" | "CANCELLED" | undefined;
    const result = await purchaseRequestService.listForAdmin({ page, limit, status });
    return ApiResponse.ok({
      items: result.items,
      meta: buildMeta(result.total, page, limit),
    });
  },

  async updateStatus(req: Request, params: { id: string }) {
    requireUser(req);
    const body = await parseJson(req);
    const status = body.status as "NEW" | "CONTACTED" | "RESERVED" | "SOLD" | "CANCELLED";
    if (!["NEW", "CONTACTED", "RESERVED", "SOLD", "CANCELLED"].includes(status)) {
      return ApiResponse.fail("Invalid status", 400, "VALIDATION_ERROR");
    }
    const request = await purchaseRequestService.updateStatus(params.id, status);
    return ApiResponse.ok(request, 200, "Status updated");
  },

  async delete(_req: Request, params: { id: string }) {
    requireUser(_req);
    await purchaseRequestService.delete(params.id);
    return ApiResponse.ok({ deleted: true });
  },
};
