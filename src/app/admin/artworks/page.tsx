"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/app/admin/layout";
import { apiList, apiGet, apiPost, apiPatch, apiDelete, ApiError } from "@/lib/api-client";
import { optimizeCloudinaryUrl } from "@/lib/cloudinary";
import type { ApiArtwork, ApiCategory, PaginationMeta } from "@/types/api";

const STATUSES = ["DRAFT", "PENDING", "PUBLISHED", "REJECTED", "SOLD", "ARCHIVED"] as const;

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-shop-sand/70 text-shop-ink",
  PENDING: "bg-amber-100 text-amber-700",
  PUBLISHED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-red-100 text-red-700",
  SOLD: "bg-shop-lavender/70 text-[#5b5278]",
  ARCHIVED: "bg-shop-beige text-shop-soft",
};

const statusStyle = (s: string) => STATUS_STYLES[s] ?? "bg-shop-sand/70 text-shop-ink";

export default function AdminArtworksPage() {
  const [items, setItems] = useState<ApiArtwork[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ApiArtwork | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const handleImageFile = async (file?: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("files", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
      const env = await res.json();
      if (!res.ok) throw new Error(env?.message ?? "Урлаг хуулахад алдаа гарлаа.");
      const url = (env.data as { url: string }[])[0]?.url;
      if (url) setForm((f) => ({ ...f, image: url }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Урлаг хуулахад алдаа гарлаа.");
    } finally {
      setUploading(false);
    }
  };

  const [form, setForm] = useState({
    title: "",
    description: "",
    image: "",
    images: "",
    price: "",
    categoryId: "",
    categoryName: "",
    medium: "",
    width: "",
    height: "",
    year: "",
    status: "DRAFT" as typeof STATUSES[number],
    isFeatured: false,
  });

  useEffect(() => {
    apiGet<ApiCategory[]>("/api/categories").then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (statusFilter) params.set("status", statusFilter);
    params.set("page", "1");
    params.set("limit", "20");
    apiList<ApiArtwork>(`/api/admin/artworks?${params.toString()}`)
      .then((res) => {
        setItems(res.items);
        setMeta(res.meta);
      })
      .catch((e) => {
        if (e instanceof ApiError) setError(e.message);
      })
      .finally(() => setLoading(false));
  }, [search, statusFilter]);

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      image: "",
      images: "",
      price: "",
      categoryId: "",
      categoryName: "",
      medium: "",
      width: "",
      height: "",
      year: "",
      status: "DRAFT",
      isFeatured: false,
    });
    setEditing(null);
    setShowForm(false);
    setError(null);
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (artwork: ApiArtwork) => {
    setEditing(artwork);
    setForm({
      title: artwork.title,
      description: artwork.description ?? "",
      image: artwork.image,
      images: artwork.images?.join(", ") ?? "",
      price: String(artwork.price),
      categoryId: artwork.category?.id ?? "",
      categoryName: artwork.category?.name ?? "",
      medium: artwork.medium ?? "",
      width: artwork.width ? String(artwork.width) : "",
      height: artwork.height ? String(artwork.height) : "",
      year: artwork.year ? String(artwork.year) : "",
      status: artwork.status,
      isFeatured: (artwork as ApiArtwork & { isFeatured?: boolean }).isFeatured ?? false,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: form.title,
        description: form.description || undefined,
        image: form.image,
        images: form.images ? form.images.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
        price: Number(form.price),
        categoryId: form.categoryId || undefined,
        categoryName: form.categoryName || undefined,
        medium: form.medium || undefined,
        width: form.width ? Number(form.width) : undefined,
        height: form.height ? Number(form.height) : undefined,
        year: form.year ? Number(form.year) : undefined,
        status: form.status,
        isFeatured: form.isFeatured,
      };

      if (editing) {
        await apiPatch(`/api/admin/artworks/${editing.id}`, payload);
      } else {
        await apiPost("/api/admin/artworks", payload);
      }
      resetForm();
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.set("q", search);
        if (statusFilter) params.set("status", statusFilter);
        params.set("page", "1");
        params.set("limit", "20");
        const res = await apiList<ApiArtwork>(`/api/admin/artworks?${params.toString()}`);
        setItems(res.items);
        setMeta(res.meta);
      } catch (e) {
        if (e instanceof ApiError) setError(e.message);
      } finally {
        setLoading(false);
      }
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Энэ бүтээлийг устгахдаа итгэлтэй байна уу?")) return;
    try {
      await apiDelete(`/api/admin/artworks/${id}`);
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.set("q", search);
        if (statusFilter) params.set("status", statusFilter);
        params.set("page", "1");
        params.set("limit", "20");
        const res = await apiList<ApiArtwork>(`/api/admin/artworks?${params.toString()}`);
        setItems(res.items);
        setMeta(res.meta);
      } catch (e) {
        if (e instanceof ApiError) setError(e.message);
      } finally {
        setLoading(false);
      }
    } catch (e) {
      if (e instanceof ApiError) setError(e.message);
    }
  };

  if (loading && items.length === 0) {
    return (
      <AdminShell>
        <div className="text-primary/60">Ачаалж байна…</div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-primary">Бүтээлүүд</h2>
            <p className="mt-1 text-sm text-primary/60">Бүтээл нэмэх, засах, устгах.</p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white hover:brightness-110"
          >
            + Бүтээл нэмэх
          </button>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {showForm && (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Гарчиг" required>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent"
                />
              </Field>
              <Field label="Зураг">
                <div className="flex items-center gap-3">
                  {form.image ? (
                    <img src={form.image} alt="" className="h-14 w-14 rounded-xl object-cover" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-white text-primary/30">
                      —
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    onChange={(e) => handleImageFile(e.target.files?.[0])}
                    className="text-sm"
                  />
                  {uploading && <span className="text-xs text-primary/50">Урлаг хуулж байна…</span>}
                </div>
                <input
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  placeholder="Эсвэл зургийн URL оруулна уу"
                  className="mt-2 w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent"
                />
              </Field>
              <Field label="Үнэ">
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent"
                />
              </Field>
              <Field label="Ангилал">
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value, categoryName: "" })}
                  className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent"
                >
                  <option value="">— Сонгох —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Шинэ ангилал">
                <input
                  value={form.categoryName}
                  onChange={(e) => setForm({ ...form, categoryName: e.target.value })}
                  placeholder="Ангилал нэр"
                  className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent"
                />
              </Field>
              <Field label="Төлөв">
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as typeof STATUSES[number] })}
                  className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field label="Онцгой">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                    className="h-4 w-4 rounded border-border accent-accent"
                  />
                  <span className="text-sm text-primary/70">Featured дэлгүүрт харуулах</span>
                </label>
              </Field>
              <Field label="Дэлгэрэнгүй">
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent"
                />
              </Field>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-60">
                {saving ? "Хадгалж байна…" : editing ? "Хадгалах" : "Нэмэх"}
              </button>
              <button type="button" onClick={resetForm} className="rounded-full border border-border px-6 py-2.5 text-sm font-medium text-primary/70 hover:bg-accent/5">
                Цуцлах
              </button>
            </div>
          </form>
        )}

        <div className="flex gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Хайх: нэр..."
            className="rounded-full border border-border bg-card px-4 py-2 text-sm outline-none focus:border-accent"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-full border border-border bg-card px-4 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="">Бүх төлөв</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-4 font-semibold text-primary/70">Бүтээл</th>
                  <th className="px-6 py-4 font-semibold text-primary/70">Төлөв</th>
                  <th className="px-6 py-4 font-semibold text-primary/70">Онцгой</th>
                  <th className="px-6 py-4 font-semibold text-primary/70">Үнэ</th>
                  <th className="px-6 py-4 font-semibold text-primary/70">Үйлдэл</th>
                </tr>
              </thead>
              <tbody>
                {items.map((art) => (
                  <tr key={art.id} className="border-b border-border/60 last:border-0">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {art.image ? (
                          <img src={optimizeCloudinaryUrl(art.image)} alt="" className="h-10 w-10 rounded-lg object-cover ring-1 ring-border" />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-shop-beige text-primary/30 ring-1 ring-border">
                            —
                          </div>
                        )}
                        <span className="font-medium text-primary">{art.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyle(art.status)}`}>
                        {art.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => openEdit({ ...art, isFeatured: !(art as ApiArtwork & { isFeatured?: boolean }).isFeatured })}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                          (art as ApiArtwork & { isFeatured?: boolean }).isFeatured
                            ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                            : "bg-shop-sand/50 text-primary/40 hover:bg-shop-sand"
                        }`}
                      >
                        {(art as ApiArtwork & { isFeatured?: boolean }).isFeatured ? "Онцгой" : "Онцгой биш"}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-primary/70">{art.price}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(art)}
                          className="rounded-full bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent/20"
                        >
                          Засах
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(art.id)}
                          className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
                        >
                          Устгах
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-primary/50">
                      Бүтээл байхгүй.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {meta && meta.hasNext && (
            <div className="px-6 py-4 text-sm text-primary/50">
              {meta.total} бүтээлээс {meta.page * meta.limit} харуулж байна.
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-primary/70">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
