import { withHandler } from "@/lib/http";
import { adminController } from "@/controllers/admin.controller";

export const GET = withHandler((req) => adminController.listArtists(req));
