import { withHandler } from "@/lib/http";
import { userController } from "@/controllers/user.controller";

export const runtime = 'nodejs';

export const GET = withHandler((req) => userController.me(req));
export const PATCH = withHandler((req) => userController.updateMe(req));
