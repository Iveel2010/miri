import { withHandler } from "@/lib/http";
import { purchaseRequestController } from "@/controllers/purchase-request.controller";

export const PATCH = withHandler(async (req, ctx) => {
  const { id } = await (ctx as { params: Promise<{ id: string }> }).params;
  return purchaseRequestController.updateStatus(req, { id });
});

export const DELETE = withHandler(async (req, ctx) => {
  const { id } = await (ctx as { params: Promise<{ id: string }> }).params;
  return purchaseRequestController.delete(req, { id });
});
