import { withHandler } from "@/lib/http";
import { favoriteController } from "@/controllers/favorite.controller";

export const GET = withHandler((req) => favoriteController.list(req));
