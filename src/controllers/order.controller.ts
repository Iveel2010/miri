import { parseJson } from "@/lib/http";
import { validate, num, buildMeta } from "@/lib/validation";
import { ApiResponse } from "@/lib/response";
import { requireUser } from "@/lib/auth";
import { orderService, purchaseSchema } from "@/services/order.service";

export const orderController = {
  /** GET /api/orders (customer) */
  async list(req: Request) {
    const { sub } = requireUser(req);
    const sp = new URL(req.url).searchParams;
    const result = await orderService.listByUser(sub, num(sp.get("page"), 1), num(sp.get("limit"), 12));
    return ApiResponse.paginated(result.items, buildMeta(result.total, num(sp.get("page"), 1), num(sp.get("limit"), 12)));
  },

  /** GET /api/orders/[id] */
  async get(req: Request, params: { id: string }) {
    const { sub } = requireUser(req);
    const order = await orderService.getById(params.id, sub);
    return ApiResponse.ok(order);
  },

  /** POST /api/orders (purchase) */
  async purchase(req: Request) {
    const { sub } = requireUser(req);
    const input = validate(purchaseSchema, await parseJson(req));
    const order = await orderService.purchase(sub, input);
    return ApiResponse.created(order, "Order placed");
  },
};
