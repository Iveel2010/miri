"use client";

import { useEffect, useState } from "react";
import AdminShell from "@/app/admin/layout";
import { apiList, apiPatch, ApiError } from "@/lib/api-client";
import type { ApiUser, PaginationMeta } from "@/types/api";

const ROLES = ["ADMIN", "ARTIST", "CUSTOMER"] as const;

const inputCls =
  "w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/10";

export default function AdminArtistsPage() {
  const [items, setItems] = useState<ApiUser[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    phone: "",
    email: "",
    whatsapp: "",
    telegram: "",
    facebook: "",
    instagram: "",
    location: "",
    preferredContactMethod: "",
    responseTime: "",
    showPhone: false,
    showEmail: true,
  });

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (roleFilter) params.set("role", roleFilter);
    params.set("page", "1");
    params.set("limit", "20");
    apiList<ApiUser>(`/api/admin/artists?${params.toString()}`)
      .then((res) => {
        if (active) {
          setItems(res.items);
          setMeta(res.meta);
        }
      })
      .catch((e) => {
        if (active && e instanceof ApiError) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [search, roleFilter]);

  const openEdit = (artist: ApiUser) => {
    setEditingId(artist.id);
    setForm({
      phone: artist.phone ?? "",
      email: artist.email ?? "",
      whatsapp: artist.whatsapp ?? "",
      telegram: artist.telegram ?? "",
      facebook: artist.facebook ?? "",
      instagram: artist.instagram ?? "",
      location: artist.location ?? "",
      preferredContactMethod: artist.preferredContactMethod ?? "",
      responseTime: artist.responseTime ?? "",
      showPhone: artist.showPhone,
      showEmail: artist.showEmail,
    });
    setError(null);
    setSaved(false);
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({
      phone: "",
      email: "",
      whatsapp: "",
      telegram: "",
      facebook: "",
      instagram: "",
      location: "",
      preferredContactMethod: "",
      responseTime: "",
      showPhone: false,
      showEmail: true,
    });
    setError(null);
    setSaved(false);
  };

  const refresh = () => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (roleFilter) params.set("role", roleFilter);
    params.set("page", "1");
    params.set("limit", "20");
    apiList<ApiUser>(`/api/admin/artists?${params.toString()}`)
      .then((res) => {
        setItems(res.items);
        setMeta(res.meta);
      })
      .catch((e) => {
        if (e instanceof ApiError) setError(e.message);
      })
      .finally(() => setLoading(false));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const payload = {
        phone: form.phone || null,
        email: form.email || null,
        whatsapp: form.whatsapp || null,
        telegram: form.telegram || null,
        facebook: form.facebook || null,
        instagram: form.instagram || null,
        location: form.location || null,
        preferredContactMethod: form.preferredContactMethod || null,
        responseTime: form.responseTime || null,
        showPhone: form.showPhone,
        showEmail: form.showEmail,
      };
      await apiPatch(`/api/admin/artists/${editingId}`, payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      refresh();
      resetForm();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Хадгалахад алдаа гарлаа.");
    } finally {
      setSaving(false);
    }
  };

  const contactFields = (artist: ApiUser) =>
    [artist.phone, artist.email, artist.whatsapp, artist.telegram, artist.facebook, artist.instagram].filter(Boolean).length;

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
            <h2 className="font-display text-2xl font-bold text-primary">Уран зураачид</h2>
            <p className="mt-1 text-sm text-primary/60">Холбоо барих мэдээллийг удирдах, засах.</p>
          </div>
        </div>

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}
        {saved && (
          <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Амжилттай хадгалагдлаа.
          </p>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Хайх: нэр, и-мэйл..."
            className="rounded-full border border-border bg-card px-4 py-2 text-sm outline-none focus:border-accent"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-full border border-border bg-card px-4 py-2 text-sm outline-none focus:border-accent"
          >
            <option value="">Бүх ангилал</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        <div className="rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-4 font-semibold text-primary/70">Уран зураач</th>
                  <th className="px-6 py-4 font-semibold text-primary/70">И-мэйл</th>
                  <th className="px-6 py-4 font-semibold text-primary/70">Ангилал</th>
                  <th className="px-6 py-4 font-semibold text-primary/70">Холбоо</th>
                  <th className="px-6 py-4 font-semibold text-primary/70">Үйлдэл</th>
                </tr>
              </thead>
              <tbody>
                {items.map((artist) => (
                  <tr key={artist.id} className="border-b border-border/60 last:border-0">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 font-semibold text-accent">
                          {(artist.name ?? "?").charAt(0).toUpperCase()}
                        </span>
                        <span className="font-medium text-primary">{artist.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-primary/70">{artist.email}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                        {artist.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-primary/70">
                      {contactFields(artist) > 0 ? (
                        <span className="text-green-600">{contactFields(artist)} талбар</span>
                      ) : (
                        <span className="text-primary/40">Хоосон</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => openEdit(artist)}
                        className="rounded-full bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent hover:bg-accent/20"
                      >
                        Засах
                      </button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-primary/50">
                      Уран зураач олдсонгүй.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {meta && meta.total > 0 && (
            <div className="px-6 py-4 text-sm text-primary/50">
              {meta.total} харилцагчаас {meta.page * meta.limit} харуулж байна.
            </div>
          )}
        </div>

        {editingId && (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold text-primary">Холбоо барих мэдээлэл засах</h3>
              <button type="button" onClick={resetForm} className="text-sm text-primary/50 hover:text-primary">
                Цуцлах
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-primary/70">Утас</label>
                <input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+976 ..." />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-primary/70">И-мэйл</label>
                <input className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="artist@example.com" />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-primary/70">WhatsApp</label>
                <input className={inputCls} value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="+976 ..." />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-primary/70">Telegram</label>
                <input className={inputCls} value={form.telegram} onChange={(e) => setForm({ ...form, telegram: e.target.value })} placeholder="@username" />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-primary/70">Facebook</label>
                <input className={inputCls} value={form.facebook} onChange={(e) => setForm({ ...form, facebook: e.target.value })} placeholder="https://facebook.com/..." />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-primary/70">Instagram</label>
                <input className={inputCls} value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} placeholder="https://instagram.com/..." />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <label className="block text-sm font-medium text-primary/70">Байршил</label>
                <input className={inputCls} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Улаанбаатар, Монгол" />
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-primary/70">Илүүдэл холбоо</label>
                <select
                  className={inputCls}
                  value={form.preferredContactMethod}
                  onChange={(e) => setForm({ ...form, preferredContactMethod: e.target.value })}
                >
                  <option value="">— Сонгох —</option>
                  <option value="PHONE">Утас</option>
                  <option value="EMAIL">И-мэйл</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="TELEGRAM">Telegram</option>
                  <option value="FACEBOOK">Facebook</option>
                  <option value="INSTAGRAM">Instagram</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-primary/70">Хариу өгөх хугацаа</label>
                <input className={inputCls} value={form.responseTime} onChange={(e) => setForm({ ...form, responseTime: e.target.value })} placeholder="Жишээ: 1 цагт хариулна" />
              </div>
              <div className="sm:col-span-2 flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.showPhone} onChange={(e) => setForm({ ...form, showPhone: e.target.checked })} className="h-4 w-4 rounded border-border accent-accent" />
                  <span className="text-sm text-primary/70">Утасны мэдээллийг илдээх</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.showEmail} onChange={(e) => setForm({ ...form, showEmail: e.target.checked })} className="h-4 w-4 rounded border-border accent-accent" />
                  <span className="text-sm text-primary/70">И-мэйлийг илдээх</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-60">
                {saving ? "Хадгалж байна…" : "Хадгалах"}
              </button>
            </div>
          </form>
        )}
      </div>
    </AdminShell>
  );
}
