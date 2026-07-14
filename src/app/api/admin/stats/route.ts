import { withHandler } from "@/lib/http";
import { adminController } from "@/controllers/admin.controller";

export const runtime = 'nodejs';

export const GET = withHandler(() => adminController.stats());
