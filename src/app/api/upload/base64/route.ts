import { withHandler } from "@/lib/http";
import { uploadController } from "@/controllers/upload.controller";

export const POST = withHandler((req) => uploadController.uploadBase64(req));
