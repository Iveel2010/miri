"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/app/admin/layout";
import { apiGet, apiPost, apiPatch, apiDelete, ApiError } from "@/lib/api-client";
import type { ApiCategory } from "@/types/api";

export default function AdminCategoriesPage() {
  const [items, setItems] = useState<ApiCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ApiCategory | null>(null);
  const [form, setForm] = useState({ name: "", icon: "" });

  useEffect(() => {
    let active = true;
    apiGet<ApiCategory[]>("/api/admin/categories")
      .then((d) => active && setItems(d))
      .catch((e) => active && setError(e instanceof ApiError ? e.message : "Ачааллахад алдаа гарлаа."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const load = () => {
    setLoading(true);
    apiGet<ApiCategory[]>("/api/admin/categories")
      .then(setItems)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Ачааллахад алдаа гарлаа."))
      .finally(() => setLoading(false));
  };

  const resetForm = () => {
    setForm({ name: "", icon: "" });
    setEditing(null);
    setError(null);
  };

  const openEdit = (cat: ApiCategory) => {
    setEditing(cat);
    setForm({ name: cat.name, icon: cat.icon ?? "" });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = { name: form.name, icon: form.icon || undefined };
      if (editing) {
        await apiPatch(`/api/admin/categories/${editing.id}`, payload);
      } else {
        await apiPost("/api/admin/categories", payload);
      }
      resetForm();
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Хадгалахад алдаа гарлаа.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const cat = items.find((c) => c.id === id);
    if (!confirm(`"${cat?.name ?? "Энэ ангилал"}" устгахдаа итгэлтэй байна уу?`)) return;
    try {
      await apiDelete(`/api/admin/categories/${id}`);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Устгахад алдаа гарлаа.");
    }
  };

  const inputCls =
    "w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/10";

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
            <h2 className="font-display text-2xl font-bold text-primary">Ангилал</h2>
            <p className="mt-1 text-sm text-primary/60">Бүтээлийн ангилал нэмэх, засах, устгах.</p>
          </div>
        </div>

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1">
              <label className="block text-sm font-medium text-primary/70">
                Нэр <span className="text-red-500">*</span>
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Жишээ: Уран зураг"
                className={inputCls}
                required
              />
            </div>
            <div className="w-32 space-y-1">
              <label className="block text-sm font-medium text-primary/70">Дүрсэм (эмojи)</label>
              <input
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                placeholder="🎨"
                className={inputCls}
                maxLength={8}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving || !form.name.trim()}
                className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-white shadow-sm shadow-accent/30 transition hover:brightness-110 disabled:opacity-60"
              >
                {saving ? "Хадгалж байна…" : editing ? "Хадгалах" : "+ Нэмэх"}
              </button>
              {editing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-full border border-border px-6 py-2.5 text-sm font-medium text-primary/70 hover:bg-accent/5"
                >
                  Цуцлах
                </button>
              )}
            </div>
          </div>
        </form>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((cat) => (
            <div
              key={cat.id}
              className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-accent/5"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-2xl text-accent">
                {cat.icon || "🏷️"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-primary">{cat.name}</p>
                <p className="text-xs text-primary/50">
                  {cat._count?.artworks ?? 0} бүтээл · /{cat.slug}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(cat)}
                  className="rounded-full bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent/20"
                >
                  Засах
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(cat.id)}
                  className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
                >
                  Устгах
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="col-span-full rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center text-primary/50">
              Ангилал байхгүй. Дээрээс нэмнэ үү.
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
