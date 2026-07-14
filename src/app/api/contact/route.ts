import { withHandler } from "@/lib/http";
import { contactController } from "@/controllers/contact.controller";

export const runtime = 'nodejs';

export const POST = withHandler((req) => contactController.submit(req));
