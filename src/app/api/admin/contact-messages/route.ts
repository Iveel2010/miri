import { withHandler } from "@/lib/http";
import { contactController } from "@/controllers/contact.controller";

export const GET = withHandler((req) => contactController.adminList(req));
