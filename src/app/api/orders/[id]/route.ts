import { withHandler } from "@/lib/http";
import { orderController } from "@/controllers/order.controller";

export const GET = withHandler(async (req, ctx) => {
  const { id } = await (ctx as { params: Promise<{ id: string }> }).params;
  return orderController.get(req, { id });
});
