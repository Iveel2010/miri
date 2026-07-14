import { withHandler } from "@/lib/http";
import { adminController } from "@/controllers/admin.controller";

export const runtime = 'nodejs';

export const GET = withHandler((req) => adminController.listArtworks(req));
export const POST = withHandler((req) => adminController.createArtwork(req));
