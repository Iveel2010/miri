"use client";

import { useEffect, useState } from "react";
import { ZodError } from "zod";
import Image from "next/image";
import AdminShell from "@/app/admin/layout";
import { apiGet, apiPut, ApiError } from "@/lib/api-client";
import { heroSettingsSchema, siteSettingsSchema } from "@/lib/schemas";
import type { ApiSiteSettings, ApiSiteStat, ApiSiteSocial, ApiSiteHeroSettings } from "@/types/api";

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-primary/70">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/10";

const EMPTY: ApiSiteSettings = {
  logoText: "Miry",
  logoImage: "",
  artistPhoto: "/misheel.jpg",
  aboutName: "Сайн уу, би Мишээл 🌸",
  aboutSubtitle: "",
  aboutBio: "",
  aboutStats: [
    { value: "8+", label: "Жил зураг", icon: "🎨" },
    { value: "200+", label: "Уран бүтээл", icon: "🖼️" },
    { value: "12", label: "Үзэсгэлэн", icon: "🏛️" },
  ],
  contact: {
    email: "hello@miry.art",
    studio: "Улаанбаатар, Монгол",
    hours: "Даваа–Баасан · 10:00–18:00",
    socials: [
      { label: "Instagram", href: "#" },
      { label: "Pinterest", href: "#" },
      { label: "Behance", href: "#" },
    ],
  },
};

async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("files", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd, credentials: "include" });
  const env = await res.json();
  if (!res.ok) throw new Error(env?.message ?? "Урлаг хуулахад алдаа гарлаа.");
  return (env.data as { url: string }[])[0]?.url ?? "";
}

const EMPTY_HERO: ApiSiteHeroSettings = {
  heroImage: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=900&h=1125&fit=crop&crop=center",
  heroTitle: "Таны мэдрэмжийг\nмөнхөлнө",
  heroSubtitle: "Намайг Мишээл гэдэг. Дүрслэх урлагаар дамжуулан хүмүүсийн дотоод мэдрэмж, сэтгэл хөдлөл, нандин дурсамж үе мөчүүдийг зургаар илэрхийлэхийг зорьдог уран бүтээлч. MIRI-д тавтай морил. 🥰❤️",
  heroBadge: "MIRI",
  heroCaption: "Амархан Цэцэг — Мишээл, 2024",
};

export default function AdminContentPage() {
  const [form, setForm] = useState<ApiSiteSettings>(EMPTY);
  const [heroForm, setHeroForm] = useState<ApiSiteHeroSettings>(EMPTY_HERO);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingHero, setSavingHero] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [heroFieldErrors, setHeroFieldErrors] = useState<Record<string, string>>({});
  const [siteFieldErrors, setSiteFieldErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const [heroSaved, setHeroSaved] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiGet<ApiSiteSettings>("/api/site-settings"),
      apiGet<ApiSiteHeroSettings>("/api/site-settings/hero"),
    ])
      .then(([site, hero]) => {
        setForm({ ...EMPTY, ...site });
        setHeroForm({ ...EMPTY_HERO, ...hero });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const set = (patch: Partial<ApiSiteSettings>) => {
    setForm((f) => ({ ...f, ...patch }));
    setSaved(false);
    setSavedAt(null);
  };

  const setHero = (patch: Partial<ApiSiteHeroSettings>) => {
    setHeroForm((f) => ({ ...f, ...patch }));
    setHeroSaved(false);
  };

  const setContact = (patch: Partial<ApiSiteSettings["contact"]>) => {
    setForm((f) => ({
      ...f,
      contact: { ...f.contact, ...patch },
    }));
    setSaved(false);
    setSavedAt(null);
  };

  const setSocial = (i: number, patch: Partial<ApiSiteSocial>) => {
    setForm((f) => ({
      ...f,
      contact: {
        ...f.contact,
        socials: f.contact.socials.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
      },
    }));
    setSaved(false);
    setSavedAt(null);
  };

  const validateHero = (): boolean => {
    try {
      heroSettingsSchema.parse(heroForm);
      setHeroFieldErrors({});
      return true;
    } catch (err) {
      if (err instanceof ZodError) {
        const errors: Record<string, string> = {};
        for (const issue of err.issues) {
          const key = issue.path.join(".") || "_";
          errors[key] = issue.message;
        }
        setHeroFieldErrors(errors);
      } else {
        setError(err instanceof Error ? err.message : "Validation failed");
      }
      return false;
    }
  };

  const validateSite = (): boolean => {
    try {
      siteSettingsSchema.parse(form);
      setSiteFieldErrors({});
      return true;
    } catch (err) {
      if (err instanceof ZodError) {
        const errors: Record<string, string> = {};
        for (const issue of err.issues) {
          const key = issue.path.join(".") || "_";
          errors[key] = issue.message;
        }
        setSiteFieldErrors(errors);
      } else {
        setError(err instanceof Error ? err.message : "Validation failed");
      }
      return false;
    }
  };

  const addSocial = () => {
    setForm((f) => ({
      ...f,
      contact: {
        ...f.contact,
        socials: [...f.contact.socials, { label: "", href: "" }],
      },
    }));
    setSaved(false);
    setSavedAt(null);
  };

  const removeSocial = (i: number) => {
    setForm((f) => ({
      ...f,
      contact: {
        ...f.contact,
        socials: f.contact.socials.filter((_, idx) => idx !== i),
      },
    }));
    setSaved(false);
    setSavedAt(null);
  };

  const setStat = (i: number, patch: Partial<ApiSiteStat>) => {
    setForm((f) => ({
      ...f,
      aboutStats: f.aboutStats.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    }));
    setSaved(false);
    setSavedAt(null);
  };

  const handleImage = async (key: "logoImage" | "artistPhoto", file?: File | null) => {
    if (!file) return;
    setSaving(true);
    setError(null);
    try {
      const url = await uploadImage(file);
      const next = { ...form, [key]: url };
      set(next);
      // Persist immediately so the uploaded image shows on the public site
      // without a separate Save click.
      await apiPut("/api/site-settings", next);
      setSaved(true);
      setSavedAt("Лого");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Урлаг хуулахад алдаа гарлаа.");
    } finally {
      setSaving(false);
    }
  };

  const handleHeroImage = async (file?: File | null) => {
    if (!file) return;
    setSavingHero(true);
    setError(null);
    try {
      const url = await uploadImage(file);
      setHero({ heroImage: url });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Урлаг хуулахад алдаа гарлаа.");
    } finally {
      setSavingHero(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSite()) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await apiPut("/api/site-settings", form);
      setSaved(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Хадгалахад алдаа гарлаа.");
    } finally {
      setSaving(false);
    }
  };

  const handleHeroSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateHero()) return;
    setSavingHero(true);
    setError(null);
    setHeroSaved(false);
    try {
      await apiPut("/api/site-settings/hero", heroForm);
      setHeroSaved(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Хадгалахад алдаа гарлаа.");
    } finally {
      setSavingHero(false);
    }
  };

  const saveSection = async (section: string) => {
    if (!validateSite()) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    setSavedAt(null);
    try {
      await apiPut("/api/site-settings", form);
      setSaved(true);
      setSavedAt(section);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Хадгалахад алдаа гарлаа.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminShell>
        <div className="text-primary/60">Ачаалж байна…</div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold text-primary">Агуулга &amp; брэнд</h2>
          <p className="mt-1 text-sm text-primary/60">
            Нүүр хуудасны уран зураачийн зураг, танилцуулга болон логоог энд өөрчилнө.
          </p>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {saved && (
          <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            Амжилттай хадгалагдлаа.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Hero */}
          <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <h3 className="font-display text-lg font-semibold text-primary">Нүүр хуудас</h3>
            <Field label="Нүүр зураг" error={heroFieldErrors.heroImage}>
              <div className="flex items-center gap-4">
                  {heroForm.heroImage ? (
                    <Image src={heroForm.heroImage} alt="hero" width={80} height={100} className="rounded-2xl object-cover" />
                  ) : (
                    <span className="flex h-20 w-16 items-center justify-center rounded-2xl bg-accent/10 text-accent">
                      ✦
                    </span>
                  )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleHeroImage(e.target.files?.[0])}
                  className="text-sm"
                />
                <input
                  className={inputCls}
                  value={heroForm.heroImage}
                  onChange={(e) => setHero({ heroImage: e.target.value })}
                  placeholder="Зургийн URL"
                />
              </div>
            </Field>
            <Field label="Баганууд" error={heroFieldErrors.heroBadge}>
              <input
                className={inputCls}
                value={heroForm.heroBadge}
                onChange={(e) => setHero({ heroBadge: e.target.value })}
                placeholder="MIRI"
              />
            </Field>
            <Field label="Гарчиг" error={heroFieldErrors.heroTitle}>
              <textarea
                rows={2}
                className={inputCls}
                value={heroForm.heroTitle}
                onChange={(e) => setHero({ heroTitle: e.target.value })}
              />
            </Field>
            <Field label="Тайлбар" error={heroFieldErrors.heroSubtitle}>
              <textarea
                rows={4}
                className={inputCls}
                value={heroForm.heroSubtitle}
                onChange={(e) => setHero({ heroSubtitle: e.target.value })}
              />
            </Field>
            <Field label="Зургийг доорхи текст" error={heroFieldErrors.heroCaption}>
              <input
                className={inputCls}
                value={heroForm.heroCaption}
                onChange={(e) => setHero({ heroCaption: e.target.value })}
                placeholder='"Нэрийн текст" — Уран зураач, 2024'
              />
            </Field>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleHeroSubmit}
                disabled={savingHero}
                className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-60"
              >
                {savingHero ? "Хадгалж байна…" : "Нүүр хуудасны тохиргоог хадгалах"}
              </button>
              {heroSaved && (
                <p className="text-sm text-green-600 self-center">Амжилттай хадгалагдлаа.</p>
              )}
            </div>
          </section>

          {/* Logo */}
          <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <h3 className="font-display text-lg font-semibold text-primary">Лого</h3>
            <Field label="Лого текст" error={siteFieldErrors.logoText}>
              <input
                className={inputCls}
                value={form.logoText}
                onChange={(e) => set({ logoText: e.target.value })}
                placeholder="Miry"
              />
            </Field>
            <Field label="Лого зураг (заавал биш)">
              <div className="flex items-center gap-4">
                  {form.logoImage ? (
                    <Image src={form.logoImage} alt="logo" width={56} height={56} className="rounded-full object-cover" />
                  ) : (
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
                      ✦
                    </span>
                  )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImage("logoImage", e.target.files?.[0])}
                  className="text-sm"
                />
                <input
                  className={inputCls}
                  value={form.logoImage}
                  onChange={(e) => set({ logoImage: e.target.value })}
                  placeholder="Зургийн URL (заавал биш)"
                />
              </div>
            </Field>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => saveSection("Лого")}
                disabled={saving}
                className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-60"
              >
                {saving ? "Хадгалж байна…" : "Логог хадгалах"}
              </button>
              {savedAt === "Лого" && (
                <p className="text-sm text-green-600 self-center">Амжилттай хадгалагдлаа.</p>
              )}
            </div>
          </section>

          {/* Artist / About */}
          <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <h3 className="font-display text-lg font-semibold text-primary">
              Уран зураач &amp; Танилцуулга
            </h3>
            <Field label="Уран зураачийн зураг">
              <div className="flex items-center gap-4">
                {form.artistPhoto ? (
                  <Image src={form.artistPhoto} alt="artist" width={80} height={80} className="rounded-2xl object-cover" />
                ) : null}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImage("artistPhoto", e.target.files?.[0])}
                  className="text-sm"
                />
                <input
                  className={inputCls}
                  value={form.artistPhoto}
                  onChange={(e) => set({ artistPhoto: e.target.value })}
                  placeholder="Зургийн URL"
                />
              </div>
            </Field>
            <Field label="Нэр / гарчиг" error={siteFieldErrors.aboutName}>
              <input
                className={inputCls}
                value={form.aboutName}
                onChange={(e) => set({ aboutName: e.target.value })}
              />
            </Field>
            <Field label="Богино танилцуулга" error={siteFieldErrors.aboutSubtitle}>
              <textarea
                rows={3}
                className={inputCls}
                value={form.aboutSubtitle}
                onChange={(e) => set({ aboutSubtitle: e.target.value })}
              />
            </Field>
            <Field label="Нэмэлт био (заавал биш)" error={siteFieldErrors.aboutBio}>
              <textarea
                rows={3}
                className={inputCls}
                value={form.aboutBio}
                onChange={(e) => set({ aboutBio: e.target.value })}
              />
            </Field>

            <div>
              <p className="mb-2 text-sm font-medium text-primary/70">Статистик (хамгийн 3)</p>
              <div className="space-y-3">
                {form.aboutStats.map((stat, i) => (
                  <div key={i} className="flex gap-3">
                    <input
                      className={`${inputCls} w-16 text-center`}
                      value={stat.icon}
                      onChange={(e) => setStat(i, { icon: e.target.value })}
                      placeholder="🎨"
                    />
                    <input
                      className={`${inputCls} w-24`}
                      value={stat.value}
                      onChange={(e) => setStat(i, { value: e.target.value })}
                      placeholder="8+"
                    />
                    <input
                      className={inputCls}
                      value={stat.label}
                      onChange={(e) => setStat(i, { label: e.target.value })}
                      placeholder="Жил зураг"
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => saveSection("Уран зураач & Танилцуулга")}
                disabled={saving}
                className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-60"
              >
                {saving ? "Хадгалж байна…" : "Уран зураачийг хадгалах"}
              </button>
              {savedAt === "Уран зураач & Танилцуулга" && (
                <p className="text-sm text-green-600 self-center">Амжилттай хадгалагдлаа.</p>
              )}
            </div>
          </section>

          {/* Contact */}
          <section className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <h3 className="font-display text-lg font-semibold text-primary">
              Холбоо барих
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="И-мэйл" error={siteFieldErrors["contact.email"]}>
                <input
                  className={inputCls}
                  value={form.contact.email}
                  onChange={(e) => setContact({ email: e.target.value })}
                />
              </Field>
              <Field label="Студио" error={siteFieldErrors["contact.studio"]}>
                <input
                  className={inputCls}
                  value={form.contact.studio}
                  onChange={(e) => setContact({ studio: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Цаг" error={siteFieldErrors["contact.hours"]}>
              <input
                className={inputCls}
                value={form.contact.hours}
                onChange={(e) => setContact({ hours: e.target.value })}
              />
            </Field>

            <div>
              <p className="mb-2 text-sm font-medium text-primary/70">
                Социал холбоосууд (хамгийн 8)
              </p>
              <div className="space-y-3">
                {form.contact.socials.map((s, i) => (
                  <div key={i} className="flex gap-3">
                    <input
                      className={`${inputCls} w-32`}
                      value={s.label}
                      onChange={(e) => setSocial(i, { label: e.target.value })}
                      placeholder="Instagram"
                    />
                    <input
                      className={inputCls}
                      value={s.href}
                      onChange={(e) => setSocial(i, { href: e.target.value })}
                      placeholder="https://instagram.com/..."
                    />
                    <button
                      type="button"
                      onClick={() => removeSocial(i)}
                      className="rounded-xl border border-border px-3 py-2 text-xs text-red-500 hover:bg-red-50"
                    >
                      Устгах
                    </button>
                  </div>
                ))}
              </div>
              {form.contact.socials.length < 8 && (
                <button
                  type="button"
                  onClick={addSocial}
                  className="mt-3 rounded-full border border-accent/30 px-4 py-2 text-xs font-medium text-accent hover:bg-accent hover:text-white"
                >
                  + Социал нэмэх
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => saveSection("Холбоо барих")}
                disabled={saving}
                className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-60"
              >
                {saving ? "Хадгалж байна…" : "Холбоо барихыг хадгалах"}
              </button>
              {savedAt === "Холбоо барих" && (
                <p className="text-sm text-green-600 self-center">Амжилттай хадгалагдлаа.</p>
              )}
            </div>
          </section>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-white hover:brightness-110 disabled:opacity-60"
            >
              {saving ? "Хадгалж байна…" : "Хадгалах"}
            </button>
          </div>
        </form>
      </div>
    </AdminShell>
  );
}
