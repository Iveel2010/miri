import { parseJson } from "@/lib/http";
import { validate, num, buildMeta } from "@/lib/validation";
import { ApiResponse } from "@/lib/response";
import { requireUser } from "@/lib/auth";
import { artworkService } from "@/services/artwork.service";
import { artworkInputSchema } from "@/lib/schemas";

// ============================================================================
// Artwork controllers — public browse + artist CRUD.
// ============================================================================

export const artworkController = {
  /** GET /api/artworks */
  async list(req: Request) {
    const sp = new URL(req.url).searchParams;
    const { items, total } = await artworkService.list({
      page: num(sp.get("page"), 1),
      limit: num(sp.get("limit"), 12),
      title: sp.get("q") ?? undefined,
      categoryId: sp.get("category") ?? undefined,
      medium: sp.get("medium") ?? undefined,
      minPrice: sp.get("minPrice") ? num(sp.get("minPrice")) : undefined,
      maxPrice: sp.get("maxPrice") ? num(sp.get("maxPrice")) : undefined,
      sort: (sp.get("sort") as "newest" | "price_asc" | "price_desc" | "popular") ?? undefined,
      featured: sp.get("featured") === "true" ? true : sp.get("featured") === "false" ? false : undefined,
    });
    return ApiResponse.paginated(items, buildMeta(total, num(sp.get("page"), 1), num(sp.get("limit"), 12)));
  },

  /** GET /api/artworks/top */
  async top(_req: Request) {
    const items = await artworkService.topArtworks(num(new URL(_req.url).searchParams.get("limit"), 10));
    return ApiResponse.ok(items);
  },

  /** GET /api/artworks/[id] */
  async getById(req: Request, params: { id: string }) {
    const artwork = await artworkService.getByIdOrSlug(params.id, true);
    return ApiResponse.ok(artwork);
  },

  /** GET /api/artworks/artist/[artistId] */
  async byArtist(req: Request, params: { artistId: string }) {
    const sp = new URL(req.url).searchParams;
    const result = await artworkService.listByArtist(
      params.artistId,
      num(sp.get("page"), 1),
      num(sp.get("limit"), 12),
    );
    return ApiResponse.paginated(result.items, buildMeta(result.total, num(sp.get("page"), 1), num(sp.get("limit"), 12)));
  },

  /** POST /api/artworks */
  async create(req: Request) {
    const { sub } = requireUser(req);
    const body = await parseJson(req);
    const input = validate(artworkInputSchema, body);
    const artwork = await artworkService.create(sub, input);
    return ApiResponse.created(artwork, "Artwork created");
  },

  /** PUT /api/artworks/[id] */
  async update(req: Request, params: { id: string }) {
    const { sub, role } = requireUser(req);
    const body = await parseJson(req);
    const input = validate(artworkInputSchema.partial(), body);
    const artwork = await artworkService.update(params.id, sub, input, role === "ADMIN");
    return ApiResponse.ok(artwork, 200, "Artwork updated");
  },

  /** DELETE /api/artworks/[id] */
  async remove(req: Request, params: { id: string }) {
    const { sub, role } = requireUser(req);
    await artworkService.remove(params.id, sub, role === "ADMIN");
    return ApiResponse.noContent();
  },

  /** POST /api/artworks/[id]/publish */
  async publish(req: Request, params: { id: string }) {
    const { sub, role } = requireUser(req);
    const artwork = await artworkService.publish(params.id, sub, role === "ADMIN");
    return ApiResponse.ok(artwork, 200, "Artwork submitted for review");
  },

  /** POST /api/artworks/[id]/draft */
  async draft(req: Request, params: { id: string }) {
    const { sub, role } = requireUser(req);
    const body = await parseJson(req);
    const input = validate(artworkInputSchema.partial(), body);
    const artwork = await artworkService.saveDraft(params.id, sub, input, role === "ADMIN");
    return ApiResponse.ok(artwork, 200, "Draft saved");
  },
};
