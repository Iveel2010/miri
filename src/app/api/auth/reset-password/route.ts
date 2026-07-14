import { withHandler } from "@/lib/http";
import { authController } from "@/controllers/auth.controller";

export const POST = withHandler((req) => authController.resetPassword(req));
