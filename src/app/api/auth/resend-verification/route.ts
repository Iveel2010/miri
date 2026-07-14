import { withHandler } from "@/lib/http";
import { authController } from "@/controllers/auth.controller";

export const runtime = 'nodejs';

export const POST = withHandler((req) => authController.resendVerification(req));
