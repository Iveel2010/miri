import { withHandler } from "@/lib/http";
import { uploadController } from "@/controllers/upload.controller";

export const runtime = 'nodejs';

export const POST = withHandler((req) => uploadController.upload(req));
export const DELETE = withHandler((req) => uploadController.remove(req));
