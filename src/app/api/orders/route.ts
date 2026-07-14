import { withHandler } from "@/lib/http";
import { orderController } from "@/controllers/order.controller";

export const GET = withHandler((req) => orderController.list(req));
export const POST = withHandler((req) => orderController.purchase(req));
