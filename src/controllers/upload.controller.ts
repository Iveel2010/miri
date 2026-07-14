import { parseForm } from "@/lib/http";
import { parseJson } from "@/lib/http";
import { ApiResponse } from "@/lib/response";
import { requireRole, requireUser } from "@/lib/auth";
import { uploadMany, deleteImage } from "@/lib/upload";

// ============================================================================
// Upload controller — Cloudinary-compatible image handling. Supports multiple
// files via multipart and base64 via JSON. Unused images can be deleted.
// ============================================================================

export const uploadController = {
  /** POST /api/upload (multipart form-data) */
  async upload(req: Request) {
    requireUser(req);
    const { files } = await parseForm(req);
    if (!files.length) return ApiResponse.fail("No files provided", 400, "BAD_REQUEST");
    const buffers = await Promise.all(
      files.map(async (f) => Buffer.from(await f.arrayBuffer())),
    );
    const results = await uploadMany(buffers);
    return ApiResponse.created(results, "Uploaded");
  },

  /** POST /api/upload/base64  (JSON: { images: string[] }) */
  async uploadBase64(req: Request) {
    requireUser(req);
    const body = await parseJson<{ images: string[]; folder?: string }>(req);
    if (!body.images?.length) return ApiResponse.fail("images[] required", 400, "BAD_REQUEST");
    const results = await uploadMany(body.images, { folder: body.folder });
    return ApiResponse.created(results, "Uploaded");
  },

  /** DELETE /api/upload  (JSON: { publicId }) */
  async remove(req: Request) {
    requireRole(req, ["ARTIST"]);
    const body = await parseJson<{ publicId: string }>(req);
    if (!body.publicId) return ApiResponse.fail("publicId required", 400, "BAD_REQUEST");
    await deleteImage(body.publicId);
    return ApiResponse.ok({ deleted: true });
  },
};
