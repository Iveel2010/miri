import { parseJson } from "@/lib/http";
import { validate } from "@/lib/validation";
import { ApiResponse } from "@/lib/response";
import { requireRole } from "@/lib/auth";
import { collectionService, collectionInputSchema } from "@/services/collection.service";

export const collectionController = {
  /** GET /api/collections — artist's own (auth required). */
  async list(req: Request) {
    const { sub } = requireRole(req, ["ARTIST"]);
    const items = await collectionService.listByUser(sub);
    return ApiResponse.ok(items);
  },

  /** GET /api/collections/public — storefront (no auth). */
  async listPublic() {
    const items = await collectionService.listAll();
    return ApiResponse.ok(items);
  },

  /** POST /api/collections */
  async create(req: Request) {
    const { sub } = requireRole(req, ["ARTIST"]);
    const input = validate(collectionInputSchema, await parseJson(req));
    const collection = await collectionService.create(sub, input);
    return ApiResponse.created(collection, "Collection created");
  },

  /** GET /api/collections/[id] */
  async get(req: Request, params: { id: string }) {
    const { sub } = requireRole(req, ["ARTIST"]);
    const collection = await collectionService.getById(params.id, sub);
    return ApiResponse.ok(collection);
  },

  /** PUT /api/collections/[id] */
  async update(req: Request, params: { id: string }) {
    const { sub } = requireRole(req, ["ARTIST"]);
    const input = validate(collectionInputSchema, await parseJson(req));
    const collection = await collectionService.update(params.id, sub, input);
    return ApiResponse.ok(collection, 200, "Collection updated");
  },

  /** POST /api/collections/[id]/artworks */
  async addArtwork(req: Request, params: { id: string }) {
    const { sub } = requireRole(req, ["ARTIST"]);
    const body = await parseJson<{ artworkId: string; position?: number }>(req);
    if (!body.artworkId) return ApiResponse.fail("artworkId required", 400, "BAD_REQUEST");
    const link = await collectionService.addArtwork(params.id, sub, body.artworkId, body.position ?? 0);
    return ApiResponse.created(link);
  },

  /** DELETE /api/collections/[id]/artworks/[artworkId] */
  async removeArtwork(req: Request, params: { id: string; artworkId: string }) {
    const { sub } = requireRole(req, ["ARTIST"]);
    await collectionService.removeArtwork(params.id, sub, params.artworkId);
    return ApiResponse.noContent();
  },

  /** DELETE /api/collections/[id] */
  async remove(req: Request, params: { id: string }) {
    const { sub } = requireRole(req, ["ARTIST"]);
    await collectionService.remove(params.id, sub);
    return ApiResponse.noContent();
  },
};
