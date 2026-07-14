import { withHandler } from "@/lib/http";
import { favoriteController } from "@/controllers/favorite.controller";

export const runtime = 'nodejs';

export const POST = withHandler((req) => favoriteController.toggle(req));
