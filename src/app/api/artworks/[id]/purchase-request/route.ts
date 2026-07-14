import { withHandler } from "@/lib/http";
import { rateLimit, clientKey } from "@/lib/rate-limit";
import { ApiResponse } from "@/lib/response";
import { purchaseRequestController } from "@/controllers/purchase-request.controller";

export const runtime = 'nodejs';

export const POST = withHandler(async (req, ctx) => {
  const limit = rateLimit(clientKey(req, "purchase-request"), 5, 60_000);
  if (!limit.success) {
    return ApiResponse.fail("Too many requests", 429, "RATE_LIMITED", {
      retryAfter: [String(limit.retryAfter)],
    });
  }
  const { id } = await (ctx as { params: Promise<{ id: string }> }).params;
  return purchaseRequestController.submit(req, { id });
});
