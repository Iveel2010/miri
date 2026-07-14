import { parseJson } from "@/lib/http";
import { ApiResponse } from "@/lib/response";
import { requireRole } from "@/lib/auth";
import { validate } from "@/lib/validation";
import { categoryService, categoryInputSchema } from "@/services/category.service";

export const categoryController = {
  /** GET /api/categories (public) */
  async list() {
    const items = await categoryService.list();
    return ApiResponse.ok(items);
  },

  /** GET /api/admin/categories (admin) */
  async adminList() {
    const items = await categoryService.list();
    return ApiResponse.ok(items);
  },

  /** POST /api/admin/categories (admin) */
  async create(req: Request) {
    requireRole(req, ["ADMIN"]);
    const body = await parseJson(req);
    const input = validate(categoryInputSchema, body);
    const category = await categoryService.create(input);
    return ApiResponse.created(category, "Ангилал нэмэгдлээ");
  },

  /** PUT/PATCH /api/admin/categories/:id (admin) */
  async update(req: Request, params: { id: string }) {
    requireRole(req, ["ADMIN"]);
    const body = await parseJson(req);
    const input = validate(categoryInputSchema.partial(), body);
    const category = await categoryService.update(params.id, input);
    return ApiResponse.ok(category, 200, "Ангилал шинэчлэгдлээ");
  },

  /** DELETE /api/admin/categories/:id (admin) */
  async remove(req: Request, params: { id: string }) {
    requireRole(req, ["ADMIN"]);
    await categoryService.remove(params.id);
    return ApiResponse.noContent();
  },
};
