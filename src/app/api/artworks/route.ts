import { withHandler } from "@/lib/http";
import { artworkController } from "@/controllers/artwork.controller";

export const GET = withHandler((req) => artworkController.list(req));
export const POST = withHandler((req) => artworkController.create(req));
