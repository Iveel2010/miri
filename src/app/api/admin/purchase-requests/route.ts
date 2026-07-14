import { withHandler } from "@/lib/http";
import { purchaseRequestController } from "@/controllers/purchase-request.controller";

export const runtime = 'nodejs';

export const GET = withHandler((req) => purchaseRequestController.list(req));
