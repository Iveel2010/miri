import { parseJson } from "@/lib/http";
import { validate, num, buildMeta } from "@/lib/validation";
import { ApiResponse } from "@/lib/response";
import { requireRole } from "@/lib/auth";
import { adminService } from "@/services/admin.service";
import { artworkInputSchema, artistContactSchema } from "@/lib/schemas";
import type { Role } from "@prisma/client";

export const adminController = {
  async stats() {
    const data = await adminService.getStats();
    return ApiResponse.ok(data);
  },

  async listArtworks(req: Request) {
    requireRole(req, ["ADMIN"]);
    const sp = new URL(req.url).searchParams;
    const page = num(sp.get("page"), 1);
    const limit = num(sp.get("limit"), 20);
    const { items, total } = await adminService.listArtworks({
      page,
      limit,
      title: sp.get("q") ?? undefined,
      status: sp.get("status") ?? undefined,
    });
    return ApiResponse.paginated(items, buildMeta(total, page, limit));
  },

  async createArtwork(req: Request) {
    requireRole(req, ["ADMIN"]);
    const { sub } = requireRole(req, ["ADMIN"]);
    const body = await parseJson(req);
    const input = validate(artworkInputSchema, body);
    const artwork = await adminService.createArtwork(sub, input);
    return ApiResponse.created(artwork, "Artwork created");
  },

  async getArtwork(req: Request, params: { id: string }) {
    const artwork = await adminService.getArtwork(params.id);
    return ApiResponse.ok(artwork);
  },

  async updateArtwork(req: Request, params: { id: string }) {
    requireRole(req, ["ADMIN"]);
    const body = await parseJson(req);
    const input = validate(artworkInputSchema.partial(), body);
    const artwork = await adminService.updateArtwork(params.id, input);
    return ApiResponse.ok(artwork, 200, "Artwork updated");
  },

  async deleteArtwork(req: Request, params: { id: string }) {
    requireRole(req, ["ADMIN"]);
    await adminService.deleteArtwork(params.id);
    return ApiResponse.noContent();
  },

  async listArtists(req: Request) {
    requireRole(req, ["ADMIN"]);
    const sp = new URL(req.url).searchParams;
    const page = num(sp.get("page"), 1);
    const limit = num(sp.get("limit"), 20);
    const { items, total } = await adminService.listArtists({
      page,
      limit,
      search: sp.get("q") ?? undefined,
      role: (sp.get("role") as Role | undefined) ?? undefined,
    });
    return ApiResponse.paginated(items, buildMeta(total, page, limit));
  },

  async getArtist(_req: Request, params: { id: string }) {
    const artist = await adminService.getArtist(params.id);
    return ApiResponse.ok(artist);
  },

  async updateArtistContact(req: Request, params: { id: string }) {
    requireRole(req, ["ADMIN"]);
    const body = await parseJson(req);
    const input = validate(artistContactSchema, body);
    const artist = await adminService.updateArtistContact(params.id, input);
    return ApiResponse.ok(artist, 200, "Artist contact updated");
  },

};
