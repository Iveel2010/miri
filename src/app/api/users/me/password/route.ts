import { withHandler } from "@/lib/http";
import { userController } from "@/controllers/user.controller";

export const POST = withHandler((req) => userController.changePassword(req));
