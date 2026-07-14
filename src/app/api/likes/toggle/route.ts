import { withHandler } from "@/lib/http";
import { likeController } from "@/controllers/like.controller";

export const runtime = 'nodejs';

export const POST = withHandler((req) => likeController.toggle(req));
