import { withHandler } from "@/lib/http";
import { authController } from "@/controllers/auth.controller";

export const runtime = 'nodejs';

export const GET = withHandler((req) => authController.verifyEmail(req));
